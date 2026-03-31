from fastapi import APIRouter
from .endpoints import area as area_module

api_router = APIRouter()

api_router.include_router(area_module.router, prefix="/areas", tags=["areas"])

