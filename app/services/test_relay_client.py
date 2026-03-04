import sqlite3
import json
import time
import logging
import paho.mqtt.client as mqtt
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

BROKER = "broker.emqx.io"
PORT = 1883
DB_PATH = "app.db"

class RelayListenerSimulator:
    def __init__(self):
        self.client = mqtt.Client(f"Relay_Listener_{int(time.time())}")
        self.relay_topics = []

    def load_relays(self):
        """Lấy danh sách topic của các RELAY từ DB"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            query = "SELECT mqtt_topic FROM devices WHERE UPPER(device_type) = 'RELAY'"
            cur.execute(query)
            rows = cur.fetchall()
            
            self.relay_topics = [r["mqtt_topic"] for r in rows if r["mqtt_topic"]]
            conn.close()
            logger.info(f"Đã nạp {len(self.relay_topics)} Relay topics từ DB.")
        except Exception as e:
            logger.error(f"Lỗi nạp dữ liệu Relay từ DB: {e}")
            raise

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info(f"Đã kết nối tới MQTT Broker tại {BROKER}:{PORT}")
            if not self.relay_topics:
                logger.warning("Không tìm thấy topic RELAY nào trong Database. Đang dùng wildcard dự phòng: 'autolight/+/+/light'")
                self.client.subscribe("autolight/+/+/light", qos=1)
            else:
                for topic in self.relay_topics:
                    logger.info(f" -> Subscribing tới: {topic}")
                    self.client.subscribe(topic, qos=1)
            print("-" * 50)
            print("ĐANG LẮNG NGHE LỆNH ĐIỀU KHIỂN TỪ BACKEND...")
            print("-" * 50)
        else:
            logger.error(f"Kết nối thất bại với mã lỗi {rc}")

    def on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode('utf-8')
            data = json.loads(payload)
            now = datetime.now().strftime('%H:%M:%S')
            command = data.get("command", "UNKNOWN")
            source = data.get("meta", {}).get("source", "unknown")
            reason = data.get("meta", {}).get("reason", "unknown")
            
            # In log đẹp mắt
            print(f"\n[{now}] 🚨 LỆNH MỚI TỚI RELAY 🚨")
            print(f" ┣ Topic:   {msg.topic}")
            print(f" ┣ Lệnh:    {command}")
            print(f" ┣ Nguồn:   {source}")
            print(f" ┣ Lý do:   {reason}")
            print(f" ┗ Payload: {payload}")
        except json.JSONDecodeError:
            print(f"\n[{now}] Nhận bản tin không phải JSON trên {msg.topic}: {msg.payload.decode()}")
        except Exception as e:
            logger.error(f"Lỗi xử lý tin nhắn: {e}")

    def run(self):
        self.load_relays()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        
        logger.info(f"Khởi động Dummy Relay Listener Client...")
        try:
            self.client.connect(BROKER, PORT, 60)
            self.client.loop_forever()
        except KeyboardInterrupt:
            logger.info("\nĐã dọn dẹp và dừng lắng nghe.")
        except Exception as e:
            logger.error(f"Không thể kết nối broker: {e}")

if __name__ == "__main__":
    listener = RelayListenerSimulator()
    listener.run()
