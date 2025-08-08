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
import random
import string

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
SECRET_KEY = "paytrack-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

def generate_user_id():
    """Generate a random 6-character user ID"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# Models
class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CompanyCreate(BaseModel):
    name: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Auto-generated login ID
    identifiant: str  # Display name
    role: str  # "admin", "manager", "employee"
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None

class UserCreate(BaseModel):
    identifiant: str
    role: str
    password: str

class UserUpdate(BaseModel):
    identifiant: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    user_id: str
    password: str

class UserResponse(BaseModel):
    id: str
    user_id: str
    identifiant: str
    role: str
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

class AnalyticsData(BaseModel):
    total_entries: int
    validated_entries: int
    pending_entries: int
    total_amount: float
    validated_amount: float
    pending_amount: float
    by_company: List[dict]
    by_employee: List[dict]
    by_month: List[dict]

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
            raise HTTPException(status_code=401, detail="Token invalide")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    user_doc = await db.users.find_one({"id": user_id})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    
    return User(**user_doc)

# Routes
@api_router.post("/login", response_model=Token)
async def login(user_login: UserLogin):
    user_doc = await db.users.find_one({"user_id": user_login.user_id})
    if not user_doc or not verify_password(user_login.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    
    # Handle migration for old users without identifiant field
    if "identifiant" not in user_doc:
        user_doc["identifiant"] = user_doc.get("name", user_doc["user_id"])
        await db.users.update_one(
            {"user_id": user_login.user_id},
            {"$set": {"identifiant": user_doc["identifiant"]}}
        )
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    user_response = UserResponse(
        id=user.id,
        user_id=user.user_id,
        identifiant=user.identifiant,
        role=user.role,
        created_at=user.created_at
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        user_id=current_user.user_id,
        identifiant=current_user.identifiant,
        role=current_user.role,
        created_at=current_user.created_at
    )

# Company routes
@api_router.post("/companies", response_model=Company)
async def create_company(company: CompanyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seuls les admins et managers peuvent créer des entreprises")
    
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
        raise HTTPException(status_code=403, detail="Les employés ne peuvent pas créer d'utilisateurs")
    if current_user.role == "manager" and user_create.role != "employee":
        raise HTTPException(status_code=403, detail="Les managers ne peuvent créer que des employés")
    
    # Generate unique user_id
    user_id = generate_user_id()
    while await db.users.find_one({"user_id": user_id}):
        user_id = generate_user_id()
    
    user_obj = User(
        user_id=user_id,
        identifiant=user_create.identifiant,
        role=user_create.role,
        password_hash=get_password_hash(user_create.password),
        created_by=current_user.id
    )
    await db.users.insert_one(user_obj.dict())
    
    return UserResponse(
        id=user_obj.id,
        user_id=user_obj.user_id,
        identifiant=user_obj.identifiant,
        role=user_obj.role,
        created_at=user_obj.created_at
    )

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seuls les admins et managers peuvent voir les utilisateurs")
    
    query = {}
    if current_user.role == "manager":
        # Managers can only see employees
        query = {"role": "employee"}
    
    users = await db.users.find(query).to_list(1000)
    result = []
    for user in users:
        # Handle migration for old users without identifiant field
        identifiant = user.get("identifiant", user.get("name", user.get("user_id", "Unknown")))
        
        result.append(UserResponse(
            id=user["id"],
            user_id=user["user_id"],
            identifiant=identifiant,
            role=user["role"],
            created_at=user["created_at"]
        ))
    
    return result

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seuls les admins peuvent modifier les utilisateurs")
    
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    update_data = {}
    if user_update.identifiant:
        update_data["identifiant"] = user_update.identifiant
    if user_update.password:
        update_data["password_hash"] = get_password_hash(user_update.password)
    if user_update.role:
        update_data["role"] = user_update.role
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
        updated_user = await db.users.find_one({"id": user_id})
        return UserResponse(
            id=updated_user["id"],
            user_id=updated_user["user_id"],
            identifiant=updated_user["identifiant"],
            role=updated_user["role"],
            created_at=updated_user["created_at"]
        )
    
    return UserResponse(
        id=user_doc["id"],
        user_id=user_doc["user_id"],
        identifiant=user_doc["identifiant"],
        role=user_doc["role"],
        created_at=user_doc["created_at"]
    )

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
async def get_payment_entries(validated_only: bool = False, current_user: User = Depends(get_current_user)):
    # Build query based on validated_only parameter
    query = {}
    if validated_only:
        query = {"is_validated": True}
    
    entries = await db.payment_entries.find(query).to_list(1000)
    
    # Get related data for response
    result = []
    for entry in entries:
        # Get company name
        company = await db.companies.find_one({"id": entry["company_id"]})
        company_name = company["name"] if company else "Entreprise inconnue"
        
        # Get creator name with fallback handling
        creator = await db.users.find_one({"id": entry["created_by"]})
        if creator:
            created_by_name = creator.get("identifiant", creator.get("name", creator.get("user_id", "Utilisateur inconnu")))
        else:
            created_by_name = "Utilisateur inconnu"
        
        # Get validator name if validated with fallback handling
        validated_by_name = None
        if entry.get("validated_by"):
            validator = await db.users.find_one({"id": entry["validated_by"]})
            if validator:
                validated_by_name = validator.get("identifiant", validator.get("name", validator.get("user_id", "Validateur inconnu")))
        
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

@api_router.post("/payment-entries/{entry_id}/validate")
async def validate_payment_entry(entry_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Seuls les managers et admins peuvent valider les entrées")
    
    entry = await db.payment_entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entrée de paiement non trouvée")
    
    if entry["is_validated"]:
        raise HTTPException(status_code=400, detail="Entrée déjà validée")
    
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
    
    return {"message": "Entrée validée avec succès"}

@api_router.put("/payment-entries/{entry_id}")
async def update_payment_entry(entry_id: str, entry_update: PaymentEntryCreate, current_user: User = Depends(get_current_user)):
    entry = await db.payment_entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entrée de paiement non trouvée")
    
    if entry["is_validated"]:
        raise HTTPException(status_code=400, detail="Impossible de modifier une entrée validée")
    
    await db.payment_entries.update_one(
        {"id": entry_id},
        {
            "$set": {
                "company_id": entry_update.company_id,
                "client_name": entry_update.client_name,
                "invoice_number": entry_update.invoice_number,
                "amount": entry_update.amount
            }
        }
    )
    
    return {"message": "Entrée modifiée avec succès"}

@api_router.delete("/payment-entries/{entry_id}")
async def delete_payment_entry(entry_id: str, current_user: User = Depends(get_current_user)):
    entry = await db.payment_entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entrée de paiement non trouvée")
    
    if entry["is_validated"]:
        raise HTTPException(status_code=400, detail="Impossible de supprimer une entrée validée")
    
    await db.payment_entries.delete_one({"id": entry_id})
    return {"message": "Entrée supprimée avec succès"}

# Reminder routes
@api_router.post("/reminders", response_model=Reminder)
async def create_reminder(reminder: ReminderCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Seuls les managers et admins peuvent créer des rappels")
    
    # Check if payment entry exists and is not validated
    entry = await db.payment_entries.find_one({"id": reminder.payment_entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entrée de paiement non trouvée")
    
    if entry["is_validated"]:
        raise HTTPException(status_code=400, detail="Impossible de créer un rappel pour une entrée validée")
    
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
        raise HTTPException(status_code=403, detail="Seuls les managers et admins peuvent voir les rappels")
    
    reminders = await db.reminders.find({"payment_entry_id": payment_entry_id}).to_list(1000)
    
    result = []
    for reminder in reminders:
        # Get triggered by user name
        user = await db.users.find_one({"id": reminder["triggered_by"]})
        triggered_by_name = user["identifiant"] if user else None
        
        result.append(ReminderResponse(
            id=reminder["id"],
            payment_entry_id=reminder["payment_entry_id"],
            triggered_by=reminder["triggered_by"],
            triggered_by_name=triggered_by_name,
            triggered_at=reminder["triggered_at"],
            note=reminder.get("note")
        ))
    
    return result

# Analytics route
@api_router.get("/analytics", response_model=AnalyticsData)
async def get_analytics(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seuls les admins peuvent voir les analyses")
    
    # Get all entries
    all_entries = await db.payment_entries.find().to_list(1000)
    
    # Basic stats
    total_entries = len(all_entries)
    validated_entries = len([e for e in all_entries if e["is_validated"]])
    pending_entries = total_entries - validated_entries
    total_amount = sum(e["amount"] for e in all_entries)
    validated_amount = sum(e["amount"] for e in all_entries if e["is_validated"])
    pending_amount = total_amount - validated_amount
    
    # Get company data for grouping
    companies = await db.companies.find().to_list(1000)
    company_map = {c["id"]: c["name"] for c in companies}
    
    # Get user data for grouping
    users = await db.users.find().to_list(1000)
    user_map = {u["id"]: u["identifiant"] for u in users}
    
    # Group by company
    by_company = {}
    for entry in all_entries:
        company_name = company_map.get(entry["company_id"], "Entreprise inconnue")
        if company_name not in by_company:
            by_company[company_name] = {"count": 0, "amount": 0, "validated": 0}
        by_company[company_name]["count"] += 1
        by_company[company_name]["amount"] += entry["amount"]
        if entry["is_validated"]:
            by_company[company_name]["validated"] += 1
    
    # Group by employee
    by_employee = {}
    for entry in all_entries:
        employee_name = user_map.get(entry["created_by"], "Employé inconnu")
        if employee_name not in by_employee:
            by_employee[employee_name] = {"count": 0, "amount": 0, "validated": 0}
        by_employee[employee_name]["count"] += 1
        by_employee[employee_name]["amount"] += entry["amount"]
        if entry["is_validated"]:
            by_employee[employee_name]["validated"] += 1
    
    # Group by month
    by_month = {}
    for entry in all_entries:
        month_key = entry["created_at"].strftime("%Y-%m")
        if month_key not in by_month:
            by_month[month_key] = {"count": 0, "amount": 0, "validated": 0}
        by_month[month_key]["count"] += 1
        by_month[month_key]["amount"] += entry["amount"]
        if entry["is_validated"]:
            by_month[month_key]["validated"] += 1
    
    # Convert to lists for response
    by_company_list = [{"name": k, **v} for k, v in by_company.items()]
    by_employee_list = [{"name": k, **v} for k, v in by_employee.items()]
    by_month_list = [{"name": k, **v} for k, v in by_month.items()]
    
    return AnalyticsData(
        total_entries=total_entries,
        validated_entries=validated_entries,
        pending_entries=pending_entries,
        total_amount=total_amount,
        validated_amount=validated_amount,
        pending_amount=pending_amount,
        by_company=by_company_list,
        by_employee=by_employee_list,
        by_month=by_month_list
    )

# Initialize default admin user (only accessible once)
@api_router.post("/init")
async def initialize_system():
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Système déjà initialisé")
    
    admin_user = User(
        user_id="ADMIN1",
        identifiant="Administrateur",
        role="admin",
        password_hash=get_password_hash("admin123")
    )
    await db.users.insert_one(admin_user.dict())
    return {
        "message": "Système initialisé avec succès",
        "user_id": "ADMIN1",
        "password": "admin123",
        "identifiant": "Administrateur"
    }

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