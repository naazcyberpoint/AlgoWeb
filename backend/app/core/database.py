from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGO_URI)
    print(f"Connected to MongoDB Atlas: {settings.MONGO_DB_NAME}")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Closed MongoDB Atlas Connection")
