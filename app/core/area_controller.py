from __future__ import annotations
import threading
from typing import Any, Dict, Optional, List
import logging
from app.database import db
from app.database.repositories.area_repository import AreaRepository

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class AreaController:
    def __init__(self, area_repository: AreaRepository) -> None:
        self.repo = area_repository

    def get_config(self, area_id: int) -> Dict[str, Any]:
        """Get configuration for an area."""
        return self.repo.get_config(area_id)

    def get_all_areas_status(self) -> List[Dict[str, Any]]:
        """Get all areas with their status, current mode and config."""
        return self.repo.get_all_areas_status()

    def get_override_status(self, area_id: int) -> Dict[str, Any]:
        """Get override status for an area."""
        return self.repo.get_override_status(area_id)

    def update_area_status(self, area_id: int, current_mode: str, last_priority: int, override_until: datetime) -> None:
        """Update area status."""
        self.repo.update_area_status(area_id, current_mode, last_priority, override_until)

    def check_area_exists(self, area_id: int) -> bool:
        """Check if an area exists."""
        return self.repo.check_area_exists(area_id)