from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "staff"  # staff or customer

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class VehiclePhoto(BaseModel):
    category: str  # general, dashboard, seats, hood, coolant
    url: str

class VehicleCreate(BaseModel):
    plate: str
    brand: str
    model: str
    company: str
    fuel_status: str
    notes: Optional[str] = ""
    photos: List[VehiclePhoto] = []
    customer_email: Optional[str] = None
    km_start: int  # Starting kilometer

class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    plate: str
    brand: str
    model: str
    company: str
    fuel_status: str
    notes: str
    photos: List[VehiclePhoto]
    status: str  # received, delivered
    received_at: str
    received_by: str
    delivered_at: Optional[str] = None
    delivered_by: Optional[str] = None
    customer_email: Optional[str] = None
    km_start: int
    km_end: Optional[int] = None
    total_km: Optional[int] = None

class VehicleDeliver(BaseModel):
    notes: Optional[str] = ""
    km_end: int  # Ending kilometer

class FuelRecordCreate(BaseModel):
    vehicle_id: str
    amount: int  # 250, 500, 1000, 1500, 2000, or custom
    photos: List[str] = []  # Fuel receipt photos
    notes: Optional[str] = ""

class FuelRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vehicle_id: str
    user_id: str
    user_name: str
    amount: int
    photos: List[str]
    notes: str
    created_at: str

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token geçersiz")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token geçersiz")

# Auth endpoints
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kullanımda")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_pw,
        "name": user_data.name,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token({"sub": user_id})
    user_response = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        created_at=user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
    
    access_token = create_access_token({"sub": user["id"]})
    user_response = User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# Vehicle endpoints
@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "staff":
        raise HTTPException(status_code=403, detail="Sadece personel araç teslim alabilir")
    
    vehicle_id = str(uuid.uuid4())
    vehicle_doc = {
        "id": vehicle_id,
        "plate": vehicle_data.plate.upper(),
        "brand": vehicle_data.brand,
        "model": vehicle_data.model,
        "company": vehicle_data.company,
        "fuel_status": vehicle_data.fuel_status,
        "notes": vehicle_data.notes or "",
        "photos": [p.model_dump() for p in vehicle_data.photos],
        "status": "received",
        "received_at": datetime.now(timezone.utc).isoformat(),
        "received_by": current_user["id"],
        "delivered_at": None,
        "delivered_by": None,
        "customer_email": vehicle_data.customer_email
    }
    
    await db.vehicles.insert_one(vehicle_doc)
    return Vehicle(**vehicle_doc)

@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "customer":
        # Customers only see their own vehicles
        vehicles = await db.vehicles.find(
            {"customer_email": current_user["email"]},
            {"_id": 0}
        ).to_list(1000)
    else:
        # Staff see all vehicles
        vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    
    return [Vehicle(**v) for v in vehicles]

@api_router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    # Check authorization
    if current_user["role"] == "customer" and vehicle.get("customer_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Bu aracı görüntüleme yetkiniz yok")
    
    return Vehicle(**vehicle)

@api_router.put("/vehicles/{vehicle_id}/deliver", response_model=Vehicle)
async def deliver_vehicle(vehicle_id: str, deliver_data: VehicleDeliver, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "staff":
        raise HTTPException(status_code=403, detail="Sadece personel araç teslim edebilir")
    
    vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    if vehicle["status"] == "delivered":
        raise HTTPException(status_code=400, detail="Bu araç zaten teslim edilmiş")
    
    update_data = {
        "status": "delivered",
        "delivered_at": datetime.now(timezone.utc).isoformat(),
        "delivered_by": current_user["id"]
    }
    
    if deliver_data.notes:
        update_data["notes"] = vehicle["notes"] + "\n\nTeslim Notu: " + deliver_data.notes
    
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": update_data})
    
    updated_vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    return Vehicle(**updated_vehicle)

@api_router.get("/")
async def root():
    return {"message": "ValetPro API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()