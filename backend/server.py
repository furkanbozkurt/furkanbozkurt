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
    role: str = "company"  # admin, taff_staff (TAFF personel), company (firma)
    company_id: Optional[str] = None  # Firma ID

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    company_id: Optional[str] = None
    approved: bool = False  # Admin onayı
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
    brand: str  # Brand name for now, will store as is
    model: str
    company_id: str  # Firma ID (zorunlu)
    fuel_status: str
    notes: Optional[str] = ""
    photos: List[VehiclePhoto] = []
    customer_email: Optional[str] = None
    km_start: int  # Starting kilometer
    receive_location: str  # Teslim alma noktası
    deliver_location: Optional[str] = None  # Will be set during delivery

class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    plate: str
    brand: str
    model: str
    company_id: str  # Firma ID
    fuel_status: str
    notes: str
    photos: List[VehiclePhoto]
    status: str  # received, in_testing, delivered
    received_at: str
    received_by: str
    delivered_at: Optional[str] = None
    delivered_by: Optional[str] = None
    customer_email: Optional[str] = None
    km_start: int
    km_end: Optional[int] = None
    total_km: Optional[int] = None
    receive_location: str
    deliver_location: Optional[str] = None
    test_drive_count: int = 0
    total_fuel_added: int = 0

class VehicleDeliver(BaseModel):
    notes: Optional[str] = ""
    km_end: int  # Ending kilometer
    deliver_location: str  # Teslim etme noktası

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

class BrandCreate(BaseModel):
    name: str

class Brand(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    created_at: str

class LocationCreate(BaseModel):
    name: str

class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    created_at: str

class CompanyCreate(BaseModel):
    name: str
    contact_person: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    contact_person: str
    phone: str
    email: str
    created_at: str

class TestDriveCreate(BaseModel):
    vehicle_id: str
    km_start: int
    km_end: int
    notes: Optional[str] = ""
    photos: List[str] = []
    fuel_added: int = 0  # Yakıt tutarı

class TestDrive(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vehicle_id: str
    user_id: str
    user_name: str
    km_start: int
    km_end: int
    km_driven: int
    notes: str
    photos: List[str]
    fuel_added: int
    created_at: str

class InterimReportCreate(BaseModel):
    vehicle_id: str
    report_type: str = "test_drive"  # test_drive, inspection
    notes: str
    photos: List[str] = []

class InterimReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vehicle_id: str
    user_id: str
    user_name: str
    report_type: str
    notes: str
    photos: List[str]
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
        
        # Ensure backward compatibility for existing users without company_name
        if "company_name" not in user:
            user["company_name"] = ""
            
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
        "company_name": user_data.company_name or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token({"sub": user_id})
    user_response = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        company_name=user_doc["company_name"],
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
        company_name=user.get("company_name", ""),
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# Admin: Get all users
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece yöneticiler kullanıcı listesini görebilir")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return [User(**u) for u in users]

# Admin: Update user role
@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece yöneticiler yetki değiştirebilir")
    
    if role not in ["admin", "taff_staff", "company"]:
        raise HTTPException(status_code=400, detail="Geçersiz rol")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    return {"message": "Kullanıcı yetkisi güncellendi"}

# Vehicle endpoints
@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "taff_staff"]:
        raise HTTPException(status_code=403, detail="Sadece TAFF personeli araç teslim alabilir")
    
    # Check if this plate has previous records and validate KM
    previous_vehicles = await db.vehicles.find(
        {"plate": vehicle_data.plate.upper()},
        {"_id": 0}
    ).sort("received_at", -1).limit(1).to_list(1)
    
    if previous_vehicles:
        last_vehicle = previous_vehicles[0]
        last_km = last_vehicle.get("km_end") or last_vehicle.get("km_start", 0)
        
        if vehicle_data.km_start <= last_km:
            raise HTTPException(
                status_code=400, 
                detail=f"Başlangıç KM ({vehicle_data.km_start}) önceki kayıttaki KM'den ({last_km}) büyük olmalıdır"
            )
    
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
        "customer_email": vehicle_data.customer_email,
        "km_start": vehicle_data.km_start,
        "km_end": None,
        "total_km": None,
        "receive_location": vehicle_data.receive_location,
        "deliver_location": None,
        "test_drive_count": 0,
        "total_fuel_added": 0,
        "company_name": vehicle_data.company  # Firma adı
    }
    
    await db.vehicles.insert_one(vehicle_doc)
    return Vehicle(**vehicle_doc)

@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "company":
        # Company users only see vehicles from their company
        company_name = current_user.get("company_name", "")
        vehicles = await db.vehicles.find(
            {"company_name": company_name},
            {"_id": 0}
        ).to_list(1000)
    else:
        # Staff and admin see all vehicles
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
    
    # Validate km_end is greater than km_start
    if deliver_data.km_end <= vehicle["km_start"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Bitiş KM ({deliver_data.km_end}) başlangıç KM'den ({vehicle['km_start']}) büyük olmalıdır"
        )
    
    total_km = deliver_data.km_end - vehicle["km_start"]
    
    update_data = {
        "status": "delivered",
        "delivered_at": datetime.now(timezone.utc).isoformat(),
        "delivered_by": current_user["id"],
        "km_end": deliver_data.km_end,
        "total_km": total_km,
        "deliver_location": deliver_data.deliver_location
    }
    
    if deliver_data.notes:
        update_data["notes"] = vehicle["notes"] + "\n\nTeslim Notu: " + deliver_data.notes
    
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": update_data})
    
    updated_vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    return Vehicle(**updated_vehicle)

@api_router.get("/")
async def root():
    return {"message": "TAFF OTOPARK API"}

# Brands endpoints
@api_router.post("/brands", response_model=Brand)
async def create_brand(brand_data: BrandCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece yöneticiler marka ekleyebilir")
    
    # Check if brand already exists
    existing = await db.brands.find_one({"name": brand_data.name}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Bu marka zaten mevcut")
    
    brand_id = str(uuid.uuid4())
    brand_doc = {
        "id": brand_id,
        "name": brand_data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.brands.insert_one(brand_doc)
    return Brand(**brand_doc)

@api_router.get("/brands", response_model=List[Brand])
async def get_brands():
    brands = await db.brands.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return [Brand(**b) for b in brands]

@api_router.delete("/brands/{brand_id}")
async def delete_brand(brand_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece yöneticiler marka silebilir")
    
    result = await db.brands.delete_one({"id": brand_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Marka bulunamadı")
    
    return {"message": "Marka silindi"}

# Locations endpoints
@api_router.post("/locations", response_model=Location)
async def create_location(location_data: LocationCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece yöneticiler lokasyon ekleyebilir")
    
    # Check if location already exists
    existing = await db.locations.find_one({"name": location_data.name}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Bu lokasyon zaten mevcut")
    
    location_id = str(uuid.uuid4())
    location_doc = {
        "id": location_id,
        "name": location_data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.locations.insert_one(location_doc)
    return Location(**location_doc)

@api_router.get("/locations", response_model=List[Location])
async def get_locations():
    locations = await db.locations.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return [Location(**l) for l in locations]

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece yöneticiler lokasyon silebilir")
    
    result = await db.locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lokasyon bulunamadı")
    
    return {"message": "Lokasyon silindi"}

# Fuel Records endpoints
@api_router.post("/fuel-records", response_model=FuelRecord)
async def create_fuel_record(fuel_data: FuelRecordCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "taff_staff"]:
        raise HTTPException(status_code=403, detail="Sadece TAFF personeli yakıt kaydı ekleyebilir")
    
    # Verify vehicle exists and is received
    vehicle = await db.vehicles.find_one({"id": fuel_data.vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    if vehicle["status"] != "received":
        raise HTTPException(status_code=400, detail="Sadece teslimdeki araçlara yakıt eklenebilir")
    
    record_id = str(uuid.uuid4())
    fuel_doc = {
        "id": record_id,
        "vehicle_id": fuel_data.vehicle_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "amount": fuel_data.amount,
        "photos": fuel_data.photos,
        "notes": fuel_data.notes or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.fuel_records.insert_one(fuel_doc)
    return FuelRecord(**fuel_doc)

@api_router.get("/fuel-records/vehicle/{vehicle_id}", response_model=List[FuelRecord])
async def get_vehicle_fuel_records(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    fuel_records = await db.fuel_records.find(
        {"vehicle_id": vehicle_id},
        {"_id": 0}
    ).to_list(1000)
    return [FuelRecord(**r) for r in fuel_records]

# Test Drives endpoints
@api_router.post("/test-drives", response_model=TestDrive)
async def create_test_drive(test_data: TestDriveCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "taff_staff"]:
        raise HTTPException(status_code=403, detail="Sadece TAFF personeli test sürüşü yapabilir")
    
    vehicle = await db.vehicles.find_one({"id": test_data.vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    if vehicle["status"] == "delivered":
        raise HTTPException(status_code=400, detail="Teslim edilmiş araçta test sürüşü yapılamaz")
    
    # Validate KM
    last_km = vehicle.get("km_end") or vehicle.get("km_start", 0)
    # Get last test drive KM if exists
    last_test = await db.test_drives.find(
        {"vehicle_id": test_data.vehicle_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(1).to_list(1)
    
    if last_test:
        last_km = last_test[0]["km_end"]
    
    if test_data.km_start < last_km:
        raise HTTPException(status_code=400, detail=f"Başlangıç KM son kayıttan ({last_km}) düşük olamaz")
    
    if test_data.km_end <= test_data.km_start:
        raise HTTPException(status_code=400, detail="Bitiş KM başlangıç KM'den büyük olmalıdır")
    
    test_id = str(uuid.uuid4())
    km_driven = test_data.km_end - test_data.km_start
    
    test_doc = {
        "id": test_id,
        "vehicle_id": test_data.vehicle_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "km_start": test_data.km_start,
        "km_end": test_data.km_end,
        "km_driven": km_driven,
        "notes": test_data.notes or "",
        "photos": test_data.photos,
        "fuel_added": test_data.fuel_added,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.test_drives.insert_one(test_doc)
    
    # Update vehicle status and counters
    await db.vehicles.update_one(
        {"id": test_data.vehicle_id},
        {
            "$set": {"status": "in_testing"},
            "$inc": {
                "test_drive_count": 1,
                "total_fuel_added": test_data.fuel_added
            }
        }
    )
    
    return TestDrive(**test_doc)

@api_router.get("/test-drives/vehicle/{vehicle_id}", response_model=List[TestDrive])
async def get_vehicle_test_drives(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    # Only admin and taff_staff can see test drives
    if current_user["role"] not in ["admin", "taff_staff"]:
        raise HTTPException(status_code=403, detail="Bu bilgilere erişim yetkiniz yok")
    
    test_drives = await db.test_drives.find(
        {"vehicle_id": vehicle_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    return [TestDrive(**td) for td in test_drives]

# Interim Reports endpoints
@api_router.post("/interim-reports", response_model=InterimReport)
async def create_interim_report(report_data: InterimReportCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "taff_staff"]:
        raise HTTPException(status_code=403, detail="Sadece TAFF personeli ara rapor oluşturabilir")
    
    vehicle = await db.vehicles.find_one({"id": report_data.vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    report_id = str(uuid.uuid4())
    report_doc = {
        "id": report_id,
        "vehicle_id": report_data.vehicle_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "report_type": report_data.report_type,
        "notes": report_data.notes,
        "photos": report_data.photos,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.interim_reports.insert_one(report_doc)
    return InterimReport(**report_doc)

@api_router.get("/interim-reports/vehicle/{vehicle_id}", response_model=List[InterimReport])
async def get_vehicle_interim_reports(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    # Only admin and taff_staff can see interim reports
    if current_user["role"] not in ["admin", "taff_staff"]:
        raise HTTPException(status_code=403, detail="Bu bilgilere erişim yetkiniz yok")
    
    reports = await db.interim_reports.find(
        {"vehicle_id": vehicle_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    return [InterimReport(**r) for r in reports]

# Final Report (PDF) endpoint
@api_router.get("/vehicles/{vehicle_id}/final-report")
async def get_final_report(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    # Get all related data
    test_drives = await db.test_drives.find(
        {"vehicle_id": vehicle_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    fuel_records = await db.fuel_records.find(
        {"vehicle_id": vehicle_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    # Calculate totals
    total_test_km = sum(td["km_driven"] for td in test_drives)
    total_fuel = sum(fr["amount"] for fr in fuel_records) + sum(td.get("fuel_added", 0) for td in test_drives)
    
    return {
        "vehicle": vehicle,
        "test_drives": test_drives,
        "fuel_records": fuel_records,
        "summary": {
            "total_test_drives": len(test_drives),
            "total_test_km": total_test_km,
            "total_fuel_spent": total_fuel,
            "initial_km": vehicle["km_start"],
            "final_km": vehicle.get("km_end"),
            "total_km": vehicle.get("total_km", 0)
        }
    }

@api_router.get("/reports/user-summary")
async def get_user_summary(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece yöneticiler raporları görüntüleyebilir")
    
    # Get all delivered vehicles
    vehicles = await db.vehicles.find({"status": "delivered"}, {"_id": 0}).to_list(10000)
    
    # Group by user
    user_stats = {}
    for vehicle in vehicles:
        user_id = vehicle["received_by"]
        if user_id not in user_stats:
            # Get user info
            user = await db.users.find_one({"id": user_id}, {"_id": 0})
            user_stats[user_id] = {
                "user_id": user_id,
                "user_name": user["name"] if user else "Bilinmeyen",
                "total_vehicles": 0,
                "total_km": 0,
                "vehicles": []
            }
        
        user_stats[user_id]["total_vehicles"] += 1
        user_stats[user_id]["total_km"] += vehicle.get("total_km", 0) or 0
        
        # Get fuel records for this vehicle
        fuel_records = await db.fuel_records.find(
            {"vehicle_id": vehicle["id"]},
            {"_id": 0}
        ).to_list(1000)
        
        total_fuel = sum(r["amount"] for r in fuel_records)
        
        user_stats[user_id]["vehicles"].append({
            "plate": vehicle["plate"],
            "brand": vehicle["brand"],
            "model": vehicle["model"],
            "km_start": vehicle.get("km_start", 0),
            "km_end": vehicle.get("km_end", 0),
            "total_km": vehicle.get("total_km", 0),
            "total_fuel": total_fuel,
            "fuel_count": len(fuel_records),
            "received_at": vehicle["received_at"],
            "delivered_at": vehicle["delivered_at"]
        })
    
    # Get total fuel per user
    for user_id in user_stats:
        fuel_records = await db.fuel_records.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(10000)
        user_stats[user_id]["total_fuel"] = sum(r["amount"] for r in fuel_records)
        user_stats[user_id]["fuel_count"] = len(fuel_records)
    
    return list(user_stats.values())

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