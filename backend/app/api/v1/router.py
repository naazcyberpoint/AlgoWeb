from fastapi import APIRouter

api_v1_router = APIRouter()

@api_v1_router.get("/status", tags=["System"])
async def get_v1_status():
    return {"status": "V1 Router Initialized", "trading_engine": "standby"}
