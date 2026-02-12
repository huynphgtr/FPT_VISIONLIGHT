"""Lighting controller implementing the priority logic for turning lights ON/OFF.

Priority (highest -> lowest):
- P1 Manual Override: if override is active, do nothing (NOOP) and preserve state
- P2 Schedule: if an active schedule exists, follow its action_state
- P3 Auto AI: use person_count and lux compared to area's config (min_person, lux_threshold).
  If conditions for ON are not met, apply off_delay before returning OFF (return OFF_DELAYED if delay > 0).

All methods return a dictionary describing the resulting action and metadata for the caller.
"""
from __future__ import annotations
from typing import Any, Dict, Optional
from app.database import db
from app.database.repositories.area_repository import AreaRepository


class LightingController:
    def __init__(self, area_repository: AreaRepository) -> None:
        self.repo = area_repository

    def decide(self, ip_address: str, person_count: int, lux: float) -> Dict[str, Any]:
        """Decide the target light action for a device identified by ip_address.

        Returns a dict with at least the key 'action' which is one of:
          - 'NOOP' (do nothing / keep current state)
          - 'ON'
          - 'OFF'
          - 'OFF_DELAYED' (apply off_delay then off)

        Additional keys: 'source' ('override'|'schedule'|'auto'), and other metadata.
        """
        # Find area by device IP
        area = self.repo.get_area_by_device_ip(ip_address)
        if not area:
            return {"action": "NOOP", "reason": "area_not_found", "ip": ip_address}

        area_id = area.get("area_id") or area.get("id")
        if area_id is None:
            return {"action": "NOOP", "reason": "area_id_missing", "ip": ip_address}

        # P1: Manual override
        override = self.repo.get_override_status(area_id)
        if override and override.get("is_overridden"):
            # Keep current state; return NOOP and include override info
            return {
                "action": "NOOP",
                "source": "override",
                "override_until": override.get("override_until"),
                "detail": override,
            }

        # P2: Schedule
        schedule = self.repo.get_active_schedule(area_id)
        if schedule:
            desired = self._normalize_state_from_schedule(schedule)
            if desired in ("ON", "OFF"):
                return {"action": desired, "source": "schedule", "schedule": schedule}
            # if schedule exists but doesn't specify an action, fall through to P3

        # P3: Auto AI
        config = self.repo.get_config(area_id)
        if not config:
            return {"action": "NOOP", "reason": "config_missing", "area_id": area_id}

        min_person = self._to_number(config.get("min_person"), default=1)
        lux_threshold = self._to_number(config.get("lux_threshold"), default=0)
        off_delay = self._to_number(config.get("off_delay"), default=0)

        # Decide ON condition
        try:
            person_ok = (int(person_count) >= int(min_person))
        except Exception:
            person_ok = False

        try:
            lux_ok = (float(lux) < float(lux_threshold))
        except Exception:
            lux_ok = False

        if person_ok and lux_ok:
            return {"action": "ON", "source": "auto", "reason": "presence_and_low_lux", "person_count": person_count, "lux": lux}

        # Not meeting ON condition -> apply off_delay before OFF
        if off_delay and off_delay > 0:
            return {"action": "OFF_DELAYED", "source": "auto", "off_delay": off_delay, "reason": "thresholds_not_met", "person_count": person_count, "lux": lux}

        return {"action": "OFF", "source": "auto", "reason": "thresholds_not_met", "person_count": person_count, "lux": lux}
    
    
    # ----- Helper methods -----
    def _normalize_state_from_schedule(self, schedule_row: Dict[str, Any]) -> Optional[str]:
        """Try to extract schedule action state and return 'ON' or 'OFF' or None if unknown."""
        # Common keys that might indicate the action/state
        candidates = ("action_state", "state", "action", "command", "desired_state")
        val = None
        for k in candidates:
            if k in schedule_row:
                val = schedule_row.get(k)
                if val is not None:
                    break
        if val is None:
            return None
        return self._normalize_state(val)

    def _normalize_state(self, v: Any) -> Optional[str]:
        if isinstance(v, bool):
            return "ON" if v else "OFF"
        s = str(v).strip().lower()
        if s in ("on", "1", "true", "active", "enable", "enabled"):
            return "ON"
        if s in ("off", "0", "false", "inactive", "disable", "disabled"):
            return "OFF"
        return None

    def _to_number(self, v: Any, default: Optional[float] = None) -> Optional[float]:
        if v is None:
            return default
        if isinstance(v, (int, float)):
            return v
        try:
            if isinstance(v, str) and "." in v:
                return float(v)
            return int(v)
        except Exception:
            try:
                return float(v)
            except Exception:
                return default
