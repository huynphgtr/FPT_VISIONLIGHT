"""Repository for area-related database queries using sqlite3.

Provides:
- get_area_by_device_ip(ip_address)
- get_active_schedule(area_id)
- get_override_status(area_id)
- get_config(area_id)

All methods use context managers and return dictionaries (or empty dict if nothing found).
"""
from __future__ import annotations
import sqlite3
from datetime import datetime, time, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import null

class AreaRepository:
    
    def __init__(self, db_conn: sqlite3.Connection) -> None:
        self.db = db_conn

    def get_all_areas_status(self) -> List[Dict[str, Any]]:
        """Return a list of all areas with basic info: area_id, area_name, area_type."""
        cur = self.db.execute("SELECT area_id, area_name, area_type FROM areas ORDER BY area_id")
        rows = cur.fetchall()
        return [dict(r) for r in rows]

    def check_area_exists(self, area_id: int) -> bool:
        """Kiểm tra Area có tồn tại không."""
        cur = self.db.execute("SELECT 1 FROM areas WHERE area_id = ? LIMIT 1", (area_id,))
        return cur.fetchone() is not None

    def set_area_override(self, area_id: int, minutes: int, state: str) -> None:
        """Thực thi logic cập nhật trạng thái đè (Override)."""
        override_until = datetime.now() + timedelta(minutes=minutes)
        override_str = override_until.strftime("%Y-%m-%d %H:%M:%S")

        # 1. Cập nhật hoặc Chèn mới trạng thái vào bảng area_status
        cur = self.db.execute("SELECT area_id FROM area_status WHERE area_id = ?", (area_id,))
        if cur.fetchone():
            self.db.execute(
                "UPDATE area_status SET override_until = ?, current_mode = ?, last_priority = ? WHERE area_id = ?",
                (override_str, state, 1, area_id),
            )
        else:
            self.db.execute(
                "INSERT INTO area_status (area_id, override_until, last_priority, current_mode) VALUES (?, ?, ?, ?)",
                (area_id, override_str, 1, state),
            )
        # 2. Ghi log vào bảng history_log
        self.db.execute(
            "INSERT INTO history_log (area_id, event_type, description) VALUES (?, ?, ?)",
            (
                area_id,
                "override",
                f"Override set to {state} for {minutes} minutes until {override_str}",
            ),
        )
        
        # 3. Commit để lưu thay đổi
        self.db.commit()

    def set_area_auto(self, area_id: int, state: str, description: str) -> None:
        """Thực thi logic cập nhật trạng thái Auto."""
        # override_until = datetime.now() + timedelta(minutes=minutes)
        # override_str = override_until.strftime("%Y-%m-%d %H:%M:%S")

        # 1. Cập nhật hoặc Chèn mới trạng thái vào bảng area_status
        cur = self.db.execute("SELECT area_id FROM area_status WHERE area_id = ?", (area_id,))
        if cur.fetchone():
            self.db.execute(
                "UPDATE area_status SET override_until = ?, current_mode = ?, last_priority = ? WHERE area_id = ?",
                (None, state, 3, area_id),
            )
        else:
            self.db.execute(
                "INSERT INTO area_status (area_id, override_until, last_priority, current_mode) VALUES (?, ?, ?, ?)",
                (area_id, None, 3, state),
            )
        # 2. Ghi log vào bảng history_log
        self.db.execute(
            "INSERT INTO history_log (area_id, event_type, description) VALUES (?, ?, ?)",
            (
                area_id,
                "auto",
                f"Auto mode set to {state} for area. Detail: {description}",
            ),
        )
        
        # 3. Commit để lưu thay đổi
        self.db.commit()

    def get_override_status(self, area_id: int) -> Optional[Dict[str, Any]]:
        """Lấy trạng thái override hiện tại."""
        cur = self.db.execute("SELECT * FROM area_status WHERE area_id = ?", (area_id,))
        row = cur.fetchone()
        return dict(row) if row else None
    
    def get_area_by_device_ip(self, ip_address: str) -> Dict[str, Any]:
        """Return a dict with the area's id for a device IP, or empty dict if not found."""
        query = (
            "SELECT a.area_id AS area_id, a.* "
            "FROM devices d JOIN areas a ON d.area_id = a.area_id "
            "WHERE d.ip_address = ? LIMIT 1"
        )        
        cur = self.db.execute(query, (ip_address,))
        row = cur.fetchone()
        if not row:
            return {}
        return dict(row)

    def get_active_schedule(self, area_id: int) -> Dict[str, Any]:
        """Return the active schedule (as dict) for given area_id based on current local time/day.
        If multiple schedules match, return the first one found. If none, return empty dict.
        This method is tolerant to a few common schedule schema variants (columns names).
        """        
        cur = self.db.execute("SELECT * FROM schedules WHERE area_id = ?", (area_id,))
        rows = cur.fetchall()
        if not rows:
            return {}
        now = datetime.now()
        current_time = now.time()
        # Normalize weekday to 0-6 where Monday == 0
        python_weekday = now.weekday()
        # SQLite strftime('%w') uses 0=Sunday, but we will compare in normalized form

        def parse_days(value) -> List[int]:
            """Try to parse a schedule 'days' representation into list of weekdays 0-6 (Mon=0)."""
            if value is None:
                return []
            if isinstance(value, int):
                # Could be 0-6 (Mon-Sun?) or 1-7, try both
                if 0 <= value <= 6:
                    return [value]
                if 1 <= value <= 7:
                    # convert 1-7 (Sun=1?) Unclear; assume 1=Monday -> convert to 0-6
                    return [value - 1]
                return []
            s = str(value).strip()
            if not s:
                return []
            # comma-separated list e.g. "0,1,2" or "Mon,Tue"
            parts = [p.strip() for p in s.split(",") if p.strip()]
            result = []
            name_map = {
                "mon": 0,
                "monday": 0,
                "tue": 1,
                "tuesday": 1,
                "wed": 2,
                "wednesday": 2,
                "thu": 3,
                "thursday": 3,
                "fri": 4,
                "friday": 4,
                "sat": 5,
                "saturday": 5,
                "sun": 6,
                "sunday": 6,
            }
            for p in parts:
                if p.isdigit():
                    try:
                        n = int(p)
                        # If it's 0-6 assume Mon=0; if 1-7 assume 1=Monday
                        if 0 <= n <= 6:
                            result.append(n)
                        elif 1 <= n <= 7:
                            result.append(n - 1)
                    except ValueError:
                        continue
                else:
                    key = p.lower()
                    if key in name_map:
                        result.append(name_map[key])
            return sorted(set(result))

        def parse_time(val: Any) -> Optional[time]:
            if val is None:
                return None
            if isinstance(val, time):
                return val
            s = str(val).strip()
            for fmt in ("%H:%M:%S", "%H:%M"):
                try:
                    return datetime.strptime(s, fmt).time()
                except Exception:
                    continue
            # try extracting HH:MM at start
            try:
                parts = s.split(":")
                hh = int(parts[0])
                mm = int(parts[1]) if len(parts) > 1 else 0
                return time(hh, mm)
            except Exception:
                return None

        for row in rows:
            # Respect an 'enabled' or 'is_active' flag if present
            enabled = None
            for key in ("enabled", "is_active", "active"):
                if key in row.keys():
                    v = row[key]
                    if v is None:
                        enabled = None
                    else:
                        enabled = bool(v)
                    break
            if enabled is False:
                continue

            # Determine applicable days
            days = []
            for key in ("days", "days_of_week", "day_of_week", "day", "weekday"):
                if key in row.keys():
                    days = parse_days(row[key])
                    break

            if days and python_weekday not in days:
                continue

            # Start / end times
            start = None
            end = None
            for key in ("start_time", "start", "time_from"):
                if key in row.keys():
                    start = parse_time(row[key])
                    break
            for key in ("end_time", "end", "time_to"):
                if key in row.keys():
                    end = parse_time(row[key])
                    break

            # If no time constraints, then this schedule is active for the day
            if start is None and end is None:
                return dict(row)

            # If times exist, check if current_time is within the interval, handle overnight wrap
            if start is None or end is None:
                # If only one bound present, be conservative: require current time to be after start or before end
                if start and current_time >= start:
                    return dict(row)
                if end and current_time < end:
                    return dict(row)
                continue

            if start <= end:
                if start <= current_time < end:
                    return dict(row)
            else:
                # overnight schedule (e.g., 22:00 -> 06:00)
                if current_time >= start or current_time < end:
                    return dict(row)

        return {}

    def get_override_status(self, area_id: int) -> Dict[str, Any]:
        """Return override status for area_id, including 'override_until' and a boolean 'is_overridden'.
        If not found, return empty dict.
        """
        query = "SELECT * FROM area_status WHERE area_id = ? LIMIT 1"
        
        cur = self.db.execute(query, (area_id,))
        row = cur.fetchone()
        if not row:
            return {}
        result = dict(row)

        # Normalize and compute is_overridden if override_until exists
        override_until = result.get("override_until")
        if override_until:
            try:
                # Expect ISO or sqlite datetime string
                dt = (
                    datetime.fromisoformat(override_until)
                    if "T" in override_until
                    else datetime.strptime(override_until, "%Y-%m-%d %H:%M:%S")
                )
                result["is_overridden"] = dt > datetime.now()
                # also return parsed ISO string in a consistent format
                result["override_until"] = dt.isoformat(" ")
            except Exception:
                # If parsing fails, leave raw value and set is_overridden to False
                result["is_overridden"] = False
        else:
            result["is_overridden"] = False

        return result

    def get_config(self, area_id: int) -> Dict[str, Any]:
        """Return configuration parameters for an area as a dict.
        Expected keys: min_person, lux_threshold, off_delay. If not found, return empty dict.
        """
        query = "SELECT * FROM config_param WHERE area_id = ? LIMIT 1"
        
        cur = self.db.execute(query, (area_id,))
        row = cur.fetchone()
        if not row:
            return {}
        cfg = dict(row)

        # Attempt to ensure numeric fields are typed
        # lack of param override_timeout? 
        for key in ("min_person", "lux_threshold", "override_timeout", "off_delay"):
            if key in cfg and cfg[key] is not None:
                try:
                    # convert to int if it looks like an int otherwise float
                    val = cfg[key]
                    if isinstance(val, (int, float)):
                        cfg[key] = val
                    else:
                        sval = str(val)
                        if "." in sval:
                            cfg[key] = float(sval)
                        else:
                            cfg[key] = int(sval)
                except Exception:
                    pass
        return cfg

    def get_history_logs(self, area_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        """Return list of history log entries for an area, ordered by most recent first."""
        query = "SELECT * FROM history_log WHERE area_id = ? ORDER BY created_at DESC LIMIT ?"       
        
        cur = self.db.execute(query, (area_id, limit,))
        rows = cur.fetchall()
        return [dict(r) for r in rows]
    
    

