from __future__ import annotations
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from app.api.deps import get_area_repo, get_device_repo
from app.database import db
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, validator
from app.database.repositories.device_repository import DeviceRepository
from app.database.repositories.area_repository import AreaRepository

router = APIRouter()

import json
from app.services.mqtt_service import _mqtt_instance

class AreaOverrideRequest(BaseModel):
    duration_minutes: int = Field(..., ge=0, description="Duration of override in minutes")
    state: str = Field(..., description="Desired state: ON or OFF")

    @validator("state")
    def state_must_be_on_off(cls, v: str) -> str:
        v2 = v.strip().upper()
        if v2 not in ("ON", "OFF"):
            raise ValueError("state must be 'ON' or 'OFF'")
        return v2

class AreaConfigUpdateRequest(BaseModel):
    min_person: Optional[int] = Field(None, ge=0, description="Minimum number of people to trigger lights ON")
    lux_threshold: Optional[int] = Field(None, ge=0, description="Maximum lux value to trigger lights ON")
    override_timeout: Optional[int] = Field(None, ge=0, description="Duration of manual override before reverting to AUTO")
    off_delay: Optional[int] = Field(None, ge=0, description="Delay in seconds before turning lights OFF when empty")


@router.get("/status", response_model=List[Dict[str, Any]])
def get_list_areas_status(
                    area_repo: AreaRepository = Depends(get_area_repo),
                    device_repo: DeviceRepository = Depends(get_device_repo)
                    ) -> List[Dict[str, Any]]:
    """Return all areas with their status, current mode and config."""
    areas = area_repo.get_all_areas_status()
    results = []
    for a in areas:
        aid = a["area_id"]
        status = area_repo.get_override_status(aid)
        config = area_repo.get_config(aid)
        schedule = area_repo.get_active_schedule(aid)
        relays = device_repo.get_relays_by_area_id(aid)
        results.append(
            {
                "area_id": aid,
                "area_name": a.get("area_name"),
                "area_type": a.get("area_type"),
                "status": status,
                "config": config,
                "active_schedule": schedule or None,
                "relays": relays,
            }
        )
    return results

@router.post("/{area_id}/override", response_model=Dict[str, Any])
def override_area(
                    area_id: int, 
                    payload: AreaOverrideRequest, 
                    area_repo: AreaRepository = Depends(get_area_repo),
                    device_repo: DeviceRepository = Depends(get_device_repo)
) -> Dict[str, Any]:
    """Set an override (P1) for an area for given minutes and desired state (ON/OFF)."""
    
    # 1. Kiểm tra tồn tại thông qua repo
    if not area_repo.check_area_exists(area_id):
        raise HTTPException(status_code=404, detail="Area not found")

    # 2. Tính toán override_until = datetime.now(...) + duration_minutes
    from datetime import timezone
    tz_vn = timezone(timedelta(hours=7))
    override_until = datetime.now(tz_vn) + timedelta(minutes=payload.duration_minutes)

    # 3. Gọi repo.update_area_status để cập nhật current_mode='MANUAL', last_priority=1 và override_until
    try:
        area_repo.update_area_status(
            area_id=area_id, 
            current_mode='MANUAL', 
            last_priority=1, 
            override_until=override_until
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 4. Gọi lighting_controller._cancel_off_timer(area_id) và thực thi lệnh Bật/Tắt ngay lập tức qua MQTT
    if _mqtt_instance and _mqtt_instance.lighting_controller:
        _mqtt_instance.lighting_controller._cancel_off_timer(area_id)
        
    if _mqtt_instance and _mqtt_instance._client:
        pub_payload = {"command": payload.state, "meta": {"source": "override", "reason": "manual_override"}}
        text = json.dumps(pub_payload)
        
        # Lấy danh sách relay
        relays = device_repo.get_relays_for_area(area_id)
        for topic in relays:
            try:
                _mqtt_instance._client.publish(topic, text, qos=1)
            except Exception as e:
                pass


    # 5. Trả về kết quả mới nhất
    status = area_repo.get_override_status(area_id)
    if not status:
         raise HTTPException(status_code=500, detail="Failed to retrieve updated status")
         
    return status

@router.get("/{area_id}/history", response_model=List[Dict[str, Any]])
def get_history(
    area_id: int, area_repo: AreaRepository = Depends(get_area_repo)
    ) -> List[Dict[str, Any]]:
    """Return last 20 history log entries for the area."""
    rows = area_repo.get_history_logs(area_id, limit=20)
    return rows

@router.put("/{area_id}/config", response_model=Dict[str, Any])
def update_area_config(
        area_id: int,
        payload: AreaConfigUpdateRequest,
        area_repo: AreaRepository = Depends(get_area_repo)
) -> Dict[str, Any]:
    """Update configuration parameters (AI thresholds) for an area."""
    # 1. Kiểm tra tồn tại
    if not area_repo.check_area_exists(area_id):
        raise HTTPException(status_code=404, detail="Area not found")

    # 2. Xây dựng dictionary các giá trị cần cập nhật
    updates = payload.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No parameters provided for update")

    # 3. Gọi Repo cập nhật CSDL
    try:
        area_repo.update_config(area_id, updates)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 4. Trả về cấu hình mới nhất
    config = area_repo.get_config(area_id)
    if not config:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated config")
        
    return config
