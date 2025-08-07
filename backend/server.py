from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Models
class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CompanyCreate(BaseModel):
    name: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Login ID
    name: str
    role: str  # "admin", "manager", "employee"
    company_id: Optional[str] = None
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None

class UserCreate(BaseModel):
    user_id: str
    name: str
    role: str
    password: str
    company_id: Optional[str] = None

class UserLogin(BaseModel):
    user_id: str
    password: str

class UserResponse(BaseModel):
    id: str
    user_id: str
    name: str
    role: str
    company_id: Optional[str] = None
    created_at: datetime

class PaymentEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    client_name: str
    invoice_number: str
    amount: float
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_validated: bool = False
    validated_at: Optional[datetime] = None
    validated_by: Optional[str] = None

class PaymentEntryCreate(BaseModel):
    company_id: str
    client_name: str
    invoice_number: str
    amount: float

class PaymentEntryResponse(BaseModel):
    id: str
    company_id: str
    company_name: Optional[str] = None
    client_name: str
    invoice_number: str
    amount: float
    created_by: str
    created_by_name: Optional[str] = None
    created_at: datetime
    is_validated: bool
    validated_at: Optional[datetime]
    validated_by: Optional[str]
    validated_by_name: Optional[str]

class Reminder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_entry_id: str
    triggered_by: str
    triggered_at: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None

class ReminderCreate(BaseModel):
    payment_entry_id: str
    note: Optional[str] = None

class ReminderResponse(BaseModel):
    id: str
    payment_entry_id: str
    triggered_by: str
    triggered_by_name: Optional[str] = None
    triggered_at: datetime
    note: Optional[str]

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_doc = await db.users.find_one({"id": user_id})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# Routes
@api_router.post("/login", response_model=Token)
async def login(user_login: UserLogin):
    user_doc = await db.users.find_one({"user_id": user_login.user_id})
    if not user_doc or not verify_password(user_login.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    user_response = UserResponse(
        id=user.id,
        user_id=user.user_id,
        name=user.name,
        role=user.role,
        company_id=user.company_id,
        created_at=user.created_at
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        user_id=current_user.user_id,
        name=current_user.name,
        role=current_user.role,
        company_id=current_user.company_id,
        created_at=current_user.created_at
    )

# Company routes
@api_router.post("/companies", response_model=Company)
async def create_company(company: CompanyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create companies")
    
    company_obj = Company(name=company.name)
    await db.companies.insert_one(company_obj.dict())
    return company_obj

@api_router.get("/companies", response_model=List[Company])
async def get_companies(current_user: User = Depends(get_current_user)):
    companies = await db.companies.find().to_list(1000)
    return [Company(**company) for company in companies]

# User routes
@api_router.post("/users", response_model=UserResponse)
async def create_user(user_create: UserCreate, current_user: User = Depends(get_current_user)):
    # Permission check
    if current_user.role == "employee":
        raise HTTPException(status_code=403, detail="Employees cannot create users")
    if current_user.role == "manager" and user_create.role != "employee":
        raise HTTPException(status_code=403, detail="Managers can only create employees")
    
    # Check if user_id already exists
    existing_user = await db.users.find_one({"user_id": user_create.user_id})
    if existing_user:
        raise HTTPException(status_code=400, detail="User ID already exists")
    
    user_obj = User(
        user_id=user_create.user_id,
        name=user_create.name,
        role=user_create.role,
        company_id=user_create.company_id,
        password_hash=get_password_hash(user_create.password),
        created_by=current_user.id
    )
    await db.users.insert_one(user_obj.dict())
    
    return UserResponse(
        id=user_obj.id,
        user_id=user_obj.user_id,
        name=user_obj.name,
        role=user_obj.role,
        company_id=user_obj.company_id,
        created_at=user_obj.created_at
    )

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only admins and managers can view users")
    
    query = {}
    if current_user.role == "manager":
        # Managers can only see employees
        query = {"role": "employee"}
    
    users = await db.users.find(query).to_list(1000)
    return [UserResponse(
        id=user["id"],
        user_id=user["user_id"],
        name=user["name"],
        role=user["role"],
        company_id=user.get("company_id"),
        created_at=user["created_at"]
    ) for user in users]

# Payment Entry routes
@api_router.post("/payment-entries", response_model=PaymentEntry)
async def create_payment_entry(entry: PaymentEntryCreate, current_user: User = Depends(get_current_user)):
    entry_obj = PaymentEntry(
        company_id=entry.company_id,
        client_name=entry.client_name,
        invoice_number=entry.invoice_number,
        amount=entry.amount,
        created_by=current_user.id
    )
    await db.payment_entries.insert_one(entry_obj.dict())
    return entry_obj

@api_router.get("/payment-entries", response_model=List[PaymentEntryResponse])
async def get_payment_entries(current_user: User = Depends(get_current_user)):
    # Build query based on user role
    query = {}
    if current_user.role == "employee":
        query = {"created_by": current_user.id}
    # Managers and admins can see all entries
    
    entries = await db.payment_entries.find(query).to_list(1000)
    
    # Get related data for response
    result = []
    for entry in entries:
        # Get company name
        company = await db.companies.find_one({"id": entry["company_id"]})
        company_name = company["name"] if company else None
        
        # Get creator name
        creator = await db.users.find_one({"id": entry["created_by"]})
        created_by_name = creator["name"] if creator else None
        
        # Get validator name if validated
        validated_by_name = None
        if entry.get("validated_by"):
            validator = await db.users.find_one({"id": entry["validated_by"]})
            validated_by_name = validator["name"] if validator else None
        
        result.append(PaymentEntryResponse(
            id=entry["id"],
            company_id=entry["company_id"],
            company_name=company_name,
            client_name=entry["client_name"],
            invoice_number=entry["invoice_number"],
            amount=entry["amount"],
            created_by=entry["created_by"],
            created_by_name=created_by_name,
            created_at=entry["created_at"],
            is_validated=entry["is_validated"],
            validated_at=entry.get("validated_at"),
            validated_by=entry.get("validated_by"),
            validated_by_name=validated_by_name
        ))
    
    return result

@api_router.get("/payment-entries/pending", response_model=List[PaymentEntryResponse])
async def get_pending_payment_entries(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Only managers and admins can view pending entries")
    
    entries = await db.payment_entries.find({"is_validated": False}).to_list(1000)
    
    # Get related data for response
    result = []
    for entry in entries:
        # Get company name
        company = await db.companies.find_one({"id": entry["company_id"]})
        company_name = company["name"] if company else None
        
        # Get creator name
        creator = await db.users.find_one({"id": entry["created_by"]})
        created_by_name = creator["name"] if creator else None
        
        result.append(PaymentEntryResponse(
            id=entry["id"],
            company_id=entry["company_id"],
            company_name=company_name,
            client_name=entry["client_name"],
            invoice_number=entry["invoice_number"],
            amount=entry["amount"],
            created_by=entry["created_by"],
            created_by_name=created_by_name,
            created_at=entry["created_at"],
            is_validated=entry["is_validated"],
            validated_at=entry.get("validated_at"),
            validated_by=entry.get("validated_by"),
            validated_by_name=None
        ))
    
    return result

@api_router.post("/payment-entries/{entry_id}/validate")
async def validate_payment_entry(entry_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Only managers and admins can validate entries")
    
    entry = await db.payment_entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Payment entry not found")
    
    if entry["is_validated"]:
        raise HTTPException(status_code=400, detail="Entry already validated")
    
    await db.payment_entries.update_one(
        {"id": entry_id},
        {
            "$set": {
                "is_validated": True,
                "validated_at": datetime.utcnow(),
                "validated_by": current_user.id
            }
        }
    )
    
    return {"message": "Entry validated successfully"}

@api_router.delete("/payment-entries/{entry_id}")
async def delete_payment_entry(entry_id: str, current_user: User = Depends(get_current_user)):
    entry = await db.payment_entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Payment entry not found")
    
    # Only creator can delete, and only if not validated
    if entry["created_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own entries")
    
    if entry["is_validated"]:
        raise HTTPException(status_code=400, detail="Cannot delete validated entries")
    
    await db.payment_entries.delete_one({"id": entry_id})
    return {"message": "Entry deleted successfully"}

# Reminder routes
@api_router.post("/reminders", response_model=Reminder)
async def create_reminder(reminder: ReminderCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Only managers and admins can create reminders")
    
    # Check if payment entry exists and is not validated
    entry = await db.payment_entries.find_one({"id": reminder.payment_entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Payment entry not found")
    
    if entry["is_validated"]:
        raise HTTPException(status_code=400, detail="Cannot create reminder for validated entry")
    
    reminder_obj = Reminder(
        payment_entry_id=reminder.payment_entry_id,
        triggered_by=current_user.id,
        note=reminder.note
    )
    await db.reminders.insert_one(reminder_obj.dict())
    return reminder_obj

@api_router.get("/reminders/{payment_entry_id}", response_model=List[ReminderResponse])
async def get_reminders_for_entry(payment_entry_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Only managers and admins can view reminders")
    
    reminders = await db.reminders.find({"payment_entry_id": payment_entry_id}).to_list(1000)
    
    result = []
    for reminder in reminders:
        # Get triggered by user name
        user = await db.users.find_one({"id": reminder["triggered_by"]})
        triggered_by_name = user["name"] if user else None
        
        result.append(ReminderResponse(
            id=reminder["id"],
            payment_entry_id=reminder["payment_entry_id"],
            triggered_by=reminder["triggered_by"],
            triggered_by_name=triggered_by_name,
            triggered_at=reminder["triggered_at"],
            note=reminder.get("note")
        ))
    
    return result

# Initialize default admin user
@api_router.post("/init-admin")
async def init_admin():
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        return {"message": "Admin already exists"}
    
    admin_user = User(
        user_id="admin",
        name="System Administrator",
        role="admin",
        password_hash=get_password_hash("admin123"),
        company_id=None
    )
    await db.users.insert_one(admin_user.dict())
    return {"message": "Default admin created", "user_id": "admin", "password": "admin123"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()