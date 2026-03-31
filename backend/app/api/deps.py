from fastapi import Depends
from sqlite3 import Connection
from app.database.db import get_db_connection
from app.database.repositories.area_repository import AreaRepository
from app.database.repositories.device_repository import DeviceRepository

def get_area_repo(db: Connection = Depends(get_db_connection)) -> AreaRepository:
    return AreaRepository(db)

def get_device_repo(db: Connection = Depends(get_db_connection)) -> DeviceRepository:
    return DeviceRepository(db)