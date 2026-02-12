from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.mqtt_service import start_mqtt
from app.api.api import api_router 


@asynccontextmanager
async def lifespan(app: FastAPI):  
    print("Starting up services...")  
    # 0. Tạo tất cả các bảng trong cơ sở dữ liệu nếu chưa tồn tại
    # print("Initializing database...")
    # init_db()
    # print("Database tables created successfully!")
        
    # 2. Khởi chạy MQTT Client (Lắng nghe tín hiệu từ AI)
    try:
        start_mqtt()
        print("MQTT Service start listenting...")
    except Exception as e:
        print(f"Error when starting MQTT: {e}")
        
    yield
    print("Shutting down services...")


app = FastAPI(title="Campus Lighting System", lifespan=lifespan)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "Backend is running",
        "services": {
            "mqtt": "active"
        }
    }