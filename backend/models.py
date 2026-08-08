"""Pydantic models for YourFleetAI v2 — multi-tenant, all modules."""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone, date
import uuid


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Base(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uid)
    company_id: str
    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


# ---------- Auth / Tenant ----------
class Company(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    gstin: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    plan: Literal["trial", "starter", "growth", "pro", "enterprise"] = "trial"
    trial_ends_at: str = Field(default_factory=lambda: (datetime.now(timezone.utc)).isoformat())
    created_at: str = Field(default_factory=_now)


class User(BaseModel):
    id: str = Field(default_factory=_uid)
    company_id: str
    name: str
    email: EmailStr
    password_hash: str
    role: Literal["owner", "manager", "accountant", "dispatcher", "driver", "viewer"] = "owner"
    active: bool = True
    created_at: str = Field(default_factory=_now)


class RegisterIn(BaseModel):
    company_name: str
    name: str
    email: EmailStr
    password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class InviteIn(BaseModel):
    name: str
    email: EmailStr
    role: Literal["owner", "manager", "accountant", "dispatcher", "driver", "viewer"] = "viewer"
    password: str


# ---------- Fleet master ----------
class Truck(Base):
    reg_number: str  # e.g. MH12AB1234
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    truck_type: Optional[str] = None  # 6-wheeler, 10-wheeler, etc.
    capacity_tons: Optional[float] = None
    ownership: Literal["owned", "leased", "attached"] = "owned"
    status: Literal["active", "idle", "in_maintenance", "retired"] = "active"
    current_odometer: Optional[float] = 0
    notes: Optional[str] = None


class Driver(Base):
    name: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[str] = None
    address: Optional[str] = None
    salary: Optional[float] = 0
    status: Literal["active", "inactive"] = "active"
    assigned_truck_id: Optional[str] = None


class Staff(Base):
    name: str
    role: str  # accountant / dispatcher / cleaner etc.
    phone: Optional[str] = None
    salary: Optional[float] = 0
    joining_date: Optional[str] = None
    status: Literal["active", "inactive"] = "active"


class Trip(Base):
    truck_id: str
    driver_id: Optional[str] = None
    from_location: str
    to_location: str
    start_date: str
    end_date: Optional[str] = None
    distance_km: Optional[float] = 0
    freight_amount: float = 0
    advance: float = 0
    balance: float = 0
    status: Literal["planned", "in_transit", "delivered", "cancelled"] = "planned"
    customer_id: Optional[str] = None
    goods: Optional[str] = None
    weight_tons: Optional[float] = None
    lr_number: Optional[str] = None
    pod_url: Optional[str] = None
    notes: Optional[str] = None


class FuelEntry(Base):
    truck_id: str
    driver_id: Optional[str] = None
    trip_id: Optional[str] = None
    date: str
    liters: float
    rate_per_liter: float
    total_cost: float
    odometer: Optional[float] = None
    location: Optional[str] = None
    mileage: Optional[float] = None  # km/L computed
    anomaly: bool = False
    notes: Optional[str] = None


class MaintenanceEntry(Base):
    truck_id: str
    date: str
    type: Literal["service", "tyres", "oil", "repair", "other"] = "service"
    description: str
    cost: float
    odometer: Optional[float] = None
    vendor: Optional[str] = None
    next_service_km: Optional[float] = None


class Contract(Base):
    truck_id: str
    customer_id: Optional[str] = None
    title: str
    start_date: str
    end_date: Optional[str] = None
    monthly_amount: float
    investment: Optional[float] = 0
    status: Literal["active", "paused", "closed"] = "active"
    notes: Optional[str] = None


class ContractPayment(Base):
    contract_id: str
    date: str
    amount: float
    mode: Literal["cash", "bank", "upi", "cheque"] = "bank"
    notes: Optional[str] = None


class FastagEntry(Base):
    truck_id: str
    date: str
    type: Literal["recharge", "toll"] = "recharge"
    amount: float
    location: Optional[str] = None
    notes: Optional[str] = None


class ComplianceDoc(Base):
    truck_id: Optional[str] = None
    driver_id: Optional[str] = None
    doc_type: Literal["rc", "insurance", "puc", "permit", "fitness", "road_tax", "license", "other"]
    number: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: str
    file_url: Optional[str] = None
    notes: Optional[str] = None


class Customer(Base):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    type: Literal["consignor", "broker", "customer"] = "customer"


class InvoiceItem(BaseModel):
    description: str
    quantity: float = 1
    rate: float
    amount: float


class Invoice(Base):
    invoice_number: str
    customer_id: str
    trip_id: Optional[str] = None
    contract_id: Optional[str] = None
    issue_date: str
    due_date: str
    items: List[InvoiceItem] = []
    subtotal: float = 0
    cgst: float = 0
    sgst: float = 0
    igst: float = 0
    total: float = 0
    amount_paid: float = 0
    status: Literal["draft", "sent", "partial", "paid", "overdue"] = "draft"
    notes: Optional[str] = None


class OtherIncome(Base):
    month: str  # YYYY-MM
    date: str
    source: str
    amount: float
    notes: Optional[str] = None


class OtherExpense(Base):
    month: str
    date: str
    category: str
    amount: float
    notes: Optional[str] = None
