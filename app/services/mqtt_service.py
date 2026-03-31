"""MQTT Service using paho-mqtt to subscribe to camera topics and publish relay commands.

- Connects to broker and subscribes to camera topics stored in DB.
- On JSON message: extracts person_count and brightness (1-4), converts brightness to lux,
  looks up device/area by MQTT topic, and calls LightingController.decide.
- Publishes resulting command to relay topic(s) in the same area.

Usage:
    svc = MqttService(broker_host='localhost', broker_port=1883)
    svc.start()
    ...
    svc.stop()
"""
from __future__ import annotations
import json
import logging
import os
from typing import Dict, Optional
import paho.mqtt.client as mqtt
from app.database.repositories.device_repository import DeviceRepository
from app.database.repositories.area_repository import AreaRepository
from app.core.lighting_controller import LightingController
from app.core.device_controller import DeviceController
import sqlite3

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class MqttService:
    def __init__(
        self,
        broker_host: Optional[str] = None,
        broker_port: Optional[int] = None,
        keepalive: Optional[int] = None,
        client_id: Optional[str] = None,
        DATABASE_URL: Optional[str] = None,
    ) -> None:
        self.broker_host = os.getenv("BROKER_HOST", "broker.emqx.io")
        self.broker_port = int(os.getenv("BROKER_PORT", "1883"))
        self.keepalive = int(os.getenv("KEEPALIVE", "60"))
        self.client_id = os.getenv("CLIENT_ID", "autolight-controller")
        raw_url = os.getenv("DATABASE_URL", "sqlite:///./app.db")
        self.DATABASE_URL = raw_url
        db_path = raw_url.replace("sqlite:///", "")
        self._client: Optional[mqtt.Client] = None
        self._running = False
        self.db_conn = sqlite3.connect(db_path, check_same_thread=False)
        self.db_conn.row_factory = sqlite3.Row          
        self.lighting_controller = LightingController(area_repository=AreaRepository(db_conn=self.db_conn))
        self.device_controller = DeviceController(device_repository=DeviceRepository(db_conn=self.db_conn))
        self.area_repository = AreaRepository(db_conn=self.db_conn)
        self._camera_topic_map: Dict[str, str] = {}
        self._relay_topic_map: Dict[str, str] = {}
        self.area_data_cache = {}

    # ----- MQTT callbacks -----
    def _on_connect(self, client, userdata, flags, rc):
        logger.info("Connected to MQTT broker %s:%d (rc=%s)", self.broker_host, self.broker_port, rc)
        camera_topics = self.device_controller.load_camera_topics()
        relay_topics = self.device_controller.load_relay_topics()

        for c in camera_topics:
            try:
                client.subscribe(c, qos=1)
                logger.info("Subscribed to camera topic: %s", c)
            except Exception as e:
                logger.exception("Failed to subscribe to %s: %s", c, e)        
        
        # for r in relay_topics:
        #     try:
        #         client.subscribe(r, qos=1)
        #         logger.info("Subscribed to relay topic: %s", r)
        #     except Exception as e:
        #         logger.exception("Failed to subscribe to %s: %s", r, e)

    def _on_disconnect(self, client, userdata, rc):
        logger.warning("Disconnected from MQTT broker (rc=%s)", rc)

    # Bảng chuyển đổi brightness (1-4) sang giá trị lux
    # 1=tối, 2=mờ, 3=trung bình, 4=sáng
    BRIGHTNESS_TO_LUX = {
        1: 100.0,   # Tối
        2: 300.0,   # Mờ
        3: 500.0,   # Trung bình
        4: 800.0,   # Sáng
    }

    def _on_message(self, client, userdata, msg):
        payload = msg.payload.decode("utf-8", errors="ignore")
        logger.debug("Received message on %s: %s", msg.topic, payload)

        # Try to parse JSON
        try:
            data = json.loads(payload)
        except Exception:
            logger.warning("Skipping non-JSON message from %s", msg.topic)
            return

        # --- Extract 2 thông số từ AI: person_ids và brightness ---
        raw_people = data.get("people") or data.get("person_ids") or data.get("current_person_count") or data.get("count") or ""
        raw_brightness = data.get("light_level") or data.get("bright") or data.get("brightness") or 0

        # Normalize person_ids
        current_cam_ids = set()
        if isinstance(raw_people, str) and raw_people.strip():
            current_cam_ids = {p_id.strip() for p_id in raw_people.split(",") if p_id.strip()}
        elif isinstance(raw_people, list):
            current_cam_ids = {str(p_id).strip() for p_id in raw_people if str(p_id).strip()}

        try:
            brightness_val = int(raw_brightness)
        except Exception:
            brightness_val = 0

        current_cam_lux = self.BRIGHTNESS_TO_LUX.get(brightness_val, 99999.0)
        
        # --- Tra cứu device bằng MQTT topic (thay vì IP) ---
        dev = self.device_controller.get_device_by_topic(msg.topic)
        if not dev:
            logger.warning("No device found for topic=%s; skipping", msg.topic)
            return

        ip = dev.get("ip_address", "unknown")
        area_id = dev.get("area_id")
        if area_id is None:
            logger.warning("Device for topic=%s missing area_id", msg.topic)
            return

        logger.info("Processing AI message: topic=%s IDs=%s brightness=%s (lux=%.1f) area=%s",
                     msg.topic, current_cam_ids, brightness_val, current_cam_lux, area_id)

        # --- CẬP NHẬT CACHE ĐA CAMERA ---
        if area_id not in self.area_data_cache:
            self.area_data_cache[area_id] = {}

        # Lưu giá trị mới nhất của camera này vào cache của Area
        self.area_data_cache[area_id][msg.topic] = {
            "ids": current_cam_ids,
            "lux": current_cam_lux
        }

        all_area_ids = set()
        min_lux = 99999.0

        # Duyệt qua tất cả camera đã từng gửi tin nhắn trong Area này
        for topic, values in self.area_data_cache[area_id].items():
            if "ids" in values:
                all_area_ids.update(values["ids"])
            # Fallback cho cache cũ (nếu có lúc đang chạy) xử lý người đếm
            elif "count" in values:
                 # nếu cache có đếm, có thể bỏ qua hoặc xử lý (ở đây bỏ qua vì đổi logic)
                 pass
            # Thường thì chỉ cần 1 góc tối là cần bật đèn, nên ta lấy Min Lux
            if values["lux"] < min_lux:
                min_lux = values["lux"]

        total_person_count = len(all_area_ids)

        logger.info(f"Area {area_id} Aggregation: Topics={len(self.area_data_cache[area_id])} "
                    f"Total Persons={total_person_count} (IDs: {all_area_ids}), Min Lux={min_lux}")
        
        # --- Tái sử dụng logic quyết định đèn (decide + process_decision) ---
        # decision = self.lighting_controller.decide(ip, person_count, lux)
        decision = self.lighting_controller.decide(ip, total_person_count, min_lux)
        action = decision.get("action")
        if not action or action == "NOOP":
            return
        logger.info("Area %s: AI decision: %s due to %s", area_id, action, decision.get('reason', ''))

        # Delegate execution, DB update, Timer, and MQTT publishing to the Controller
        self.lighting_controller.process_decision(area_id, decision)

    # ----- Lifecycle -----
    def start(self) -> None:
        if self._running:
            logger.warning("MQTT service already running")
            return
        self._client = mqtt.Client(client_id=self.client_id)
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._client.on_disconnect = self._on_disconnect

        try:
            self._client.connect(self.broker_host, self.broker_port, keepalive=self.keepalive)
            # Start background loop
            self._client.loop_start()
            self._running = True
            logger.info("MQTT service started and connecting to %s:%d", self.broker_host, self.broker_port)
        except Exception:
            logger.exception("Failed to start MQTT client")
            self._running = False

    def stop(self) -> None:
        if not self._running or self._client is None:
            logger.warning("MQTT service not running")
            return
        try:
            self._client.loop_stop()
            self._client.disconnect()
            logger.info("MQTT service stopped")
        except Exception:
            logger.exception("Error stopping MQTT service")
        finally:
            self._client = None
            self._running = False

_mqtt_instance: Optional[MqttService] = None

def start_mqtt(broker_host: str = "localhost", broker_port: int = 1883) -> None:
    global _mqtt_instance
    if _mqtt_instance is not None:
        logger.info("MQTT service already started")
        return
    _mqtt_instance = MqttService(broker_host=broker_host, broker_port=broker_port)
    _mqtt_instance.start()

def stop_mqtt() -> None:
    global _mqtt_instance
    if _mqtt_instance is None:
        logger.info("MQTT service not running")
        return
    _mqtt_instance.stop()
    _mqtt_instance = None
