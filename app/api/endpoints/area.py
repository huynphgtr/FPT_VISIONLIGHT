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

class OverrideRequest(BaseModel):
    minutes: int = Field(..., ge=0, description="Duration of override in minutes")
    state: str = Field(..., description="Desired state: ON or OFF")

    @validator("state")
    def state_must_be_on_off(cls, v: str) -> str:
        v2 = v.strip().upper()
        if v2 not in ("ON", "OFF"):
            raise ValueError("state must be 'ON' or 'OFF'")
        return v2

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
def set_override(
                    area_id: int, 
                    payload: OverrideRequest, 
                    area_repo: AreaRepository = Depends(get_area_repo)
) -> Dict[str, Any]:
    """Set an override (P1) for an area for given minutes and desired state (ON/OFF)."""
    
    # 1. Kiểm tra tồn tại thông qua repo
    if not area_repo.check_area_exists(area_id):
        raise HTTPException(status_code=404, detail="Area not found")

    # 2. Thực thi logic ghi đè thông qua repo
    try:
        area_repo.set_area_override(area_id, payload.minutes, payload.state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 3. Trả về kết quả mới nhất
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
