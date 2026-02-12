"""Device controller implementing the priority logic for controll device in area.
Provides:
- load_camera_topics()
- get_relays_for_area(area_id)
- get_device_by_ip(ip)
- get_device_by_topic(topic)
All methods return a dictionary describing the resulting action and metadata for the caller.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.database.repositories.device_repository import DeviceRepository

class DeviceController:
    def __init__(self, device_repository: DeviceRepository) -> None:
        self.repo = device_repository

    def load_camera_topics(self) -> List[str]:
        """Load camera topics and their ip addresses from devices table."""
        topics = self.repo.load_camera_topics()
        if not topics:
            return []   
        return self.repo.load_camera_topics()
    
    def get_relays_for_area(self, area_id: int) -> List[str]:
        relays = self.repo.get_relays_for_area(area_id)
        if not relays:
            return []   
        return self.repo.get_relays_for_area(area_id)
    
    def get_device_by_ip(self, ip: str) -> Optional[Dict[str, Any]]:
        devices = self.repo.get_device_by_ip(ip)
        if not devices:
            return None
        return self.repo.get_device_by_ip(ip)
    
    def get_device_by_topic(self, topic: str) -> Optional[Dict[str, Any]]:
        devices = self.repo.get_device_by_topic(topic)
        if not devices:
            return None
        return self.repo.get_device_by_topic(topic)


    
