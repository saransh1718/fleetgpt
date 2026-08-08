"""YourFleetAI v2 backend — multi-tenant SaaS for Indian fleets.
All routes prefixed with /api. Auth via JWT bearer. Company-scoped queries.
"""
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Dict

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

from models import (
    Company, User, RegisterIn, LoginIn, InviteIn,
    Truck, Driver, Staff, Trip, FuelEntry, MaintenanceEntry,
    Contract, ContractPayment, FastagEntry, ComplianceDoc,
    Customer, Invoice, InvoiceItem, OtherIncome, OtherExpense,
)
from auth import hash_password, verify_password, create_token, get_current_user
from ai_service import claude_summary, gemini_flash

# --- Mongo ---
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="YourFleetAI v2 API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("yourfleetai")


def _strip_mongo(d: Optional[dict]) -> Optional[dict]:
    if d is None:
        return None
    d.pop("_id", None)
    return d


async def _company_scope(user: dict, extra: Optional[dict] = None) -> dict:
    q = {"company_id": user["company_id"]}
    if extra:
        q.update(extra)
    return q


# ============================================================
# AUTH
# ============================================================
@api.post("/auth/register")
async def register(body: RegisterIn):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(400, "Email already registered")
    company = Company(
        name=body.company_name,
        trial_ends_at=(datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
    )
    await db.companies.insert_one(company.model_dump())
    user = User(
        company_id=company.id,
        name=body.name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role="owner",
    )
    await db.users.insert_one(user.model_dump())
    token = create_token(user.id, company.id, user.role)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}, "company": company.model_dump()}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = _strip_mongo(await db.users.find_one({"email": body.email.lower()}))
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    company = _strip_mongo(await db.companies.find_one({"id": user["company_id"]}))
    token = create_token(user["id"], user["company_id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}, "company": company}


@api.get("/auth/me")
async def me(u: dict = Depends(get_current_user)):
    user = _strip_mongo(await db.users.find_one({"id": u["user_id"]}))
    company = _strip_mongo(await db.companies.find_one({"id": u["company_id"]}))
    if not user:
        raise HTTPException(404, "User not found")
    user.pop("password_hash", None)
    return {"user": user, "company": company}


# ============================================================
# TEAM (invites)
# ============================================================
@api.get("/team")
async def team_list(u: dict = Depends(get_current_user)):
    items = await db.users.find({"company_id": u["company_id"]}, {"_id": 0, "password_hash": 0}).to_list(500)
    return items


@api.post("/team/invite")
async def team_invite(body: InviteIn, u: dict = Depends(get_current_user)):
    if u["role"] not in ("owner", "manager"):
        raise HTTPException(403, "Forbidden")
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(400, "Email already exists")
    new_user = User(
        company_id=u["company_id"],
        name=body.name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role=body.role,
    )
    await db.users.insert_one(new_user.model_dump())
    d = new_user.model_dump()
    d.pop("password_hash")
    return d


# ============================================================
# GENERIC CRUD helper
# ============================================================
def make_crud(name: str, collection: str, Model):
    r = APIRouter(prefix=f"/{name}", tags=[name])

    @r.get("")
    async def list_all(u: dict = Depends(get_current_user), q: Optional[str] = None, limit: int = 500):
        query = {"company_id": u["company_id"]}
        docs = await db[collection].find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
        if q:
            ql = q.lower()
            docs = [d for d in docs if any(ql in str(v).lower() for v in d.values())]
        return docs

    @r.post("")
    async def create(payload: Dict[str, Any], u: dict = Depends(get_current_user)):
        payload["company_id"] = u["company_id"]
        obj = Model(**payload)
        await db[collection].insert_one(obj.model_dump())
        return obj.model_dump()

    @r.get("/{item_id}")
    async def get_one(item_id: str, u: dict = Depends(get_current_user)):
        doc = _strip_mongo(await db[collection].find_one({"id": item_id, "company_id": u["company_id"]}))
        if not doc:
            raise HTTPException(404, "Not found")
        return doc

    @r.put("/{item_id}")
    async def update(item_id: str, payload: Dict[str, Any], u: dict = Depends(get_current_user)):
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        payload.pop("id", None)
        payload.pop("company_id", None)
        res = await db[collection].update_one(
            {"id": item_id, "company_id": u["company_id"]}, {"$set": payload}
        )
        if not res.matched_count:
            raise HTTPException(404, "Not found")
        return _strip_mongo(await db[collection].find_one({"id": item_id}))

    @r.delete("/{item_id}")
    async def delete(item_id: str, u: dict = Depends(get_current_user)):
        await db[collection].delete_one({"id": item_id, "company_id": u["company_id"]})
        return {"ok": True}

    return r


# Register CRUD routes for all master modules
api.include_router(make_crud("trucks", "trucks", Truck))
api.include_router(make_crud("drivers", "drivers", Driver))
api.include_router(make_crud("staff", "staff", Staff))
api.include_router(make_crud("maintenance", "maintenance", MaintenanceEntry))
api.include_router(make_crud("contracts", "contracts", Contract))
api.include_router(make_crud("contract_payments", "contract_payments", ContractPayment))
api.include_router(make_crud("fastag", "fastag", FastagEntry))
api.include_router(make_crud("compliance", "compliance", ComplianceDoc))
api.include_router(make_crud("customers", "customers", Customer))
api.include_router(make_crud("other_income", "other_income", OtherIncome))
api.include_router(make_crud("other_expense", "other_expense", OtherExpense))


# ============================================================
# TRIPS (custom: auto-generate LR number)
# ============================================================
@api.get("/trips")
async def trips_list(u: dict = Depends(get_current_user)):
    return await db.trips.find({"company_id": u["company_id"]}, {"_id": 0}).sort("start_date", -1).to_list(1000)


@api.post("/trips")
async def trips_create(payload: Dict[str, Any], u: dict = Depends(get_current_user)):
    payload["company_id"] = u["company_id"]
    if not payload.get("lr_number"):
        count = await db.trips.count_documents({"company_id": u["company_id"]})
        payload["lr_number"] = f"LR-{datetime.now().year}-{count + 1:05d}"
    payload["balance"] = float(payload.get("freight_amount", 0)) - float(payload.get("advance", 0))
    obj = Trip(**payload)
    await db.trips.insert_one(obj.model_dump())
    return obj.model_dump()


@api.put("/trips/{trip_id}")
async def trips_update(trip_id: str, payload: Dict[str, Any], u: dict = Depends(get_current_user)):
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "freight_amount" in payload or "advance" in payload:
        current = await db.trips.find_one({"id": trip_id, "company_id": u["company_id"]})
        if current:
            f = float(payload.get("freight_amount", current.get("freight_amount", 0)))
            a = float(payload.get("advance", current.get("advance", 0)))
            payload["balance"] = f - a
    payload.pop("id", None); payload.pop("company_id", None)
    await db.trips.update_one({"id": trip_id, "company_id": u["company_id"]}, {"$set": payload})
    return _strip_mongo(await db.trips.find_one({"id": trip_id}))


@api.delete("/trips/{trip_id}")
async def trips_delete(trip_id: str, u: dict = Depends(get_current_user)):
    await db.trips.delete_one({"id": trip_id, "company_id": u["company_id"]})
    return {"ok": True}


@api.get("/trips/{trip_id}/lr")
async def trips_lr(trip_id: str, u: dict = Depends(get_current_user)):
    trip = _strip_mongo(await db.trips.find_one({"id": trip_id, "company_id": u["company_id"]}))
    if not trip:
        raise HTTPException(404, "Trip not found")
    truck = _strip_mongo(await db.trucks.find_one({"id": trip["truck_id"]})) or {}
    driver = _strip_mongo(await db.drivers.find_one({"id": trip.get("driver_id")})) if trip.get("driver_id") else None
    customer = _strip_mongo(await db.customers.find_one({"id": trip.get("customer_id")})) if trip.get("customer_id") else None
    company = _strip_mongo(await db.companies.find_one({"id": u["company_id"]})) or {}
    return {"trip": trip, "truck": truck, "driver": driver, "customer": customer, "company": company}


# ============================================================
# FUEL (custom: mileage + anomaly)
# ============================================================
@api.get("/fuel")
async def fuel_list(u: dict = Depends(get_current_user)):
    return await db.fuel.find({"company_id": u["company_id"]}, {"_id": 0}).sort("date", -1).to_list(1000)


@api.post("/fuel")
async def fuel_create(payload: Dict[str, Any], u: dict = Depends(get_current_user)):
    payload["company_id"] = u["company_id"]
    # Compute mileage vs prior entry
    prior = await db.fuel.find_one(
        {"company_id": u["company_id"], "truck_id": payload["truck_id"]},
        sort=[("date", -1)],
    )
    if prior and payload.get("odometer") and prior.get("odometer") and payload.get("liters"):
        dist = float(payload["odometer"]) - float(prior["odometer"])
        if dist > 0 and float(payload["liters"]) > 0:
            payload["mileage"] = round(dist / float(payload["liters"]), 2)
            # Anomaly: mileage < 3 km/L or > 12 km/L for truck is suspicious
            if payload["mileage"] < 3 or payload["mileage"] > 12:
                payload["anomaly"] = True
    payload["total_cost"] = float(payload.get("liters", 0)) * float(payload.get("rate_per_liter", 0))
    obj = FuelEntry(**payload)
    await db.fuel.insert_one(obj.model_dump())
    return obj.model_dump()


@api.put("/fuel/{fid}")
async def fuel_update(fid: str, payload: Dict[str, Any], u: dict = Depends(get_current_user)):
    payload.pop("id", None); payload.pop("company_id", None)
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "liters" in payload and "rate_per_liter" in payload:
        payload["total_cost"] = float(payload["liters"]) * float(payload["rate_per_liter"])
    await db.fuel.update_one({"id": fid, "company_id": u["company_id"]}, {"$set": payload})
    return _strip_mongo(await db.fuel.find_one({"id": fid}))


@api.delete("/fuel/{fid}")
async def fuel_delete(fid: str, u: dict = Depends(get_current_user)):
    await db.fuel.delete_one({"id": fid, "company_id": u["company_id"]})
    return {"ok": True}


# ============================================================
# INVOICES (custom: totals + numbering)
# ============================================================
@api.get("/invoices")
async def inv_list(u: dict = Depends(get_current_user)):
    return await db.invoices.find({"company_id": u["company_id"]}, {"_id": 0}).sort("issue_date", -1).to_list(1000)


@api.post("/invoices")
async def inv_create(payload: Dict[str, Any], u: dict = Depends(get_current_user)):
    payload["company_id"] = u["company_id"]
    if not payload.get("invoice_number"):
        count = await db.invoices.count_documents({"company_id": u["company_id"]})
        payload["invoice_number"] = f"INV-{datetime.now().year}-{count + 1:05d}"
    items = payload.get("items", [])
    subtotal = sum(float(i.get("amount", 0)) for i in items)
    gst_rate = float(payload.get("gst_rate", 5))  # default 5% for transport
    interstate = bool(payload.get("interstate", False))
    payload["subtotal"] = round(subtotal, 2)
    if interstate:
        payload["igst"] = round(subtotal * gst_rate / 100, 2)
        payload["cgst"] = 0
        payload["sgst"] = 0
    else:
        payload["cgst"] = round(subtotal * gst_rate / 200, 2)
        payload["sgst"] = round(subtotal * gst_rate / 200, 2)
        payload["igst"] = 0
    payload["total"] = round(payload["subtotal"] + payload["cgst"] + payload["sgst"] + payload["igst"], 2)
    obj = Invoice(**{k: v for k, v in payload.items() if k in Invoice.model_fields})
    await db.invoices.insert_one(obj.model_dump())
    return obj.model_dump()


@api.put("/invoices/{iid}")
async def inv_update(iid: str, payload: Dict[str, Any], u: dict = Depends(get_current_user)):
    payload.pop("id", None); payload.pop("company_id", None)
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.invoices.update_one({"id": iid, "company_id": u["company_id"]}, {"$set": payload})
    return _strip_mongo(await db.invoices.find_one({"id": iid}))


@api.delete("/invoices/{iid}")
async def inv_delete(iid: str, u: dict = Depends(get_current_user)):
    await db.invoices.delete_one({"id": iid, "company_id": u["company_id"]})
    return {"ok": True}


@api.get("/invoices/aging/report")
async def inv_aging(u: dict = Depends(get_current_user)):
    invs = await db.invoices.find({"company_id": u["company_id"]}, {"_id": 0}).to_list(1000)
    today = datetime.now(timezone.utc).date()
    buckets = {"current": 0.0, "30": 0.0, "60": 0.0, "90": 0.0, "90+": 0.0}
    for i in invs:
        if i["status"] == "paid":
            continue
        outstanding = float(i["total"]) - float(i.get("amount_paid", 0))
        try:
            due = datetime.fromisoformat(i["due_date"]).date()
        except Exception:
            continue
        days = (today - due).days
        if days <= 0:
            buckets["current"] += outstanding
        elif days <= 30:
            buckets["30"] += outstanding
        elif days <= 60:
            buckets["60"] += outstanding
        elif days <= 90:
            buckets["90"] += outstanding
        else:
            buckets["90+"] += outstanding
    return buckets


# ============================================================
# DASHBOARD
# ============================================================
@api.get("/dashboard/summary")
async def dashboard(u: dict = Depends(get_current_user)):
    company_id = u["company_id"]
    trucks = await db.trucks.count_documents({"company_id": company_id})
    active_trucks = await db.trucks.count_documents({"company_id": company_id, "status": "active"})
    drivers = await db.drivers.count_documents({"company_id": company_id})
    trips_month = await db.trips.count_documents({
        "company_id": company_id,
        "start_date": {"$gte": datetime.now(timezone.utc).replace(day=1).date().isoformat()},
    })
    # Revenue this month
    trips_docs = await db.trips.find({"company_id": company_id}, {"_id": 0}).to_list(2000)
    now = datetime.now(timezone.utc)
    month_key = f"{now.year:04d}-{now.month:02d}"
    revenue_month = sum(float(t.get("freight_amount", 0)) for t in trips_docs if t.get("start_date", "").startswith(month_key))
    fuel_docs = await db.fuel.find({"company_id": company_id}, {"_id": 0}).to_list(2000)
    fuel_month = sum(float(f.get("total_cost", 0)) for f in fuel_docs if f.get("date", "").startswith(month_key))
    # Expiring compliance in next 30 days
    soon = (now + timedelta(days=30)).date().isoformat()
    today = now.date().isoformat()
    compliance_docs = await db.compliance.find({"company_id": company_id}, {"_id": 0}).to_list(500)
    expiring = [c for c in compliance_docs if today <= c.get("expiry_date", "") <= soon]
    expired = [c for c in compliance_docs if c.get("expiry_date", "") < today]
    # Receivables outstanding
    invs = await db.invoices.find({"company_id": company_id}, {"_id": 0}).to_list(1000)
    receivables = sum(float(i["total"]) - float(i.get("amount_paid", 0)) for i in invs if i["status"] != "paid")
    # FASTag balance (rough): recharges - tolls per truck
    fastag_docs = await db.fastag.find({"company_id": company_id}, {"_id": 0}).to_list(2000)
    fastag_by_truck = {}
    for f in fastag_docs:
        tid = f["truck_id"]
        fastag_by_truck.setdefault(tid, 0)
        fastag_by_truck[tid] += float(f["amount"]) if f["type"] == "recharge" else -float(f["amount"])
    low_fastag = [{"truck_id": t, "balance": b} for t, b in fastag_by_truck.items() if b < 1000]
    return {
        "trucks_total": trucks,
        "trucks_active": active_trucks,
        "drivers_total": drivers,
        "trips_this_month": trips_month,
        "revenue_this_month": revenue_month,
        "fuel_this_month": fuel_month,
        "expiring_docs": expiring[:10],
        "expired_docs": expired[:10],
        "receivables_outstanding": receivables,
        "low_fastag_trucks": low_fastag[:10],
    }


@api.get("/dashboard/monthly_pnl")
async def monthly_pnl(u: dict = Depends(get_current_user), months: int = 6):
    company_id = u["company_id"]
    now = datetime.now(timezone.utc)
    keys = []
    for i in range(months - 1, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12; y -= 1
        keys.append(f"{y:04d}-{m:02d}")
    trips = await db.trips.find({"company_id": company_id}, {"_id": 0}).to_list(5000)
    fuel = await db.fuel.find({"company_id": company_id}, {"_id": 0}).to_list(5000)
    maint = await db.maintenance.find({"company_id": company_id}, {"_id": 0}).to_list(5000)
    result = []
    for k in keys:
        rev = sum(float(t.get("freight_amount", 0)) for t in trips if t.get("start_date", "").startswith(k))
        fu = sum(float(f.get("total_cost", 0)) for f in fuel if f.get("date", "").startswith(k))
        mn = sum(float(m.get("cost", 0)) for m in maint if m.get("date", "").startswith(k))
        result.append({"month": k, "revenue": rev, "fuel": fu, "maintenance": mn, "profit": rev - fu - mn})
    return result


# ============================================================
# ACCOUNTING (per-month full P&L)
# ============================================================
@api.get("/accounting/{month}")
async def accounting_month(month: str, u: dict = Depends(get_current_user)):
    cid = u["company_id"]
    trips = await db.trips.find({"company_id": cid}, {"_id": 0}).to_list(5000)
    fuel = await db.fuel.find({"company_id": cid}, {"_id": 0}).to_list(5000)
    maint = await db.maintenance.find({"company_id": cid}, {"_id": 0}).to_list(5000)
    fastag = await db.fastag.find({"company_id": cid}, {"_id": 0}).to_list(5000)
    contract_pay = await db.contract_payments.find({"company_id": cid}, {"_id": 0}).to_list(5000)
    contracts = await db.contracts.find({"company_id": cid}, {"_id": 0}).to_list(500)
    drivers = await db.drivers.find({"company_id": cid}, {"_id": 0}).to_list(500)
    staff = await db.staff.find({"company_id": cid}, {"_id": 0}).to_list(500)
    other_inc = await db.other_income.find({"company_id": cid, "month": month}, {"_id": 0}).to_list(500)
    other_exp = await db.other_expense.find({"company_id": cid, "month": month}, {"_id": 0}).to_list(500)

    trip_rev = sum(float(t.get("freight_amount", 0)) for t in trips if t.get("start_date", "").startswith(month))
    contract_rev = sum(float(p.get("amount", 0)) for p in contract_pay if p.get("date", "").startswith(month))
    other_income_total = sum(float(o.get("amount", 0)) for o in other_inc)

    fuel_cost = sum(float(f.get("total_cost", 0)) for f in fuel if f.get("date", "").startswith(month))
    maint_cost = sum(float(m.get("cost", 0)) for m in maint if m.get("date", "").startswith(month))
    toll_cost = sum(float(t.get("amount", 0)) for t in fastag if t.get("date", "").startswith(month) and t.get("type") == "toll")
    driver_sal = sum(float(d.get("salary", 0)) for d in drivers if d.get("status") == "active")
    staff_sal = sum(float(s.get("salary", 0)) for s in staff if s.get("status") == "active")
    contract_inv = sum(float(c.get("investment", 0)) for c in contracts)
    other_exp_total = sum(float(o.get("amount", 0)) for o in other_exp)

    total_income = trip_rev + contract_rev + other_income_total
    total_expense = fuel_cost + maint_cost + toll_cost + driver_sal + staff_sal + other_exp_total
    return {
        "month": month,
        "income": {
            "trip_revenue": trip_rev,
            "contract_payments": contract_rev,
            "other_income": other_income_total,
            "total": total_income,
        },
        "expense": {
            "fuel": fuel_cost,
            "maintenance": maint_cost,
            "toll": toll_cost,
            "driver_salaries": driver_sal,
            "staff_salaries": staff_sal,
            "contract_investment": contract_inv,
            "other_expenses": other_exp_total,
            "total": total_expense,
        },
        "profit": total_income - total_expense,
        "other_income_entries": other_inc,
        "other_expense_entries": other_exp,
    }


# ============================================================
# AI INSIGHTS
# ============================================================
class AIRequest(BaseModel):
    prompt: Optional[str] = None


@api.post("/ai/monthly_summary")
async def ai_monthly_summary(u: dict = Depends(get_current_user)):
    cid = u["company_id"]
    now = datetime.now(timezone.utc)
    month = f"{now.year:04d}-{now.month:02d}"
    # Get pnl
    pnl = await accounting_month(month, u)
    company = _strip_mongo(await db.companies.find_one({"id": cid})) or {}
    system = (
        "You are the AI CFO for an Indian trucking business. Write a warm, "
        "insightful monthly business summary in plain English (~200 words). "
        "Highlight the top 2 wins, top 2 risks, and one specific action. "
        "Use INR ₹ format. No markdown headers, just crisp paragraphs."
    )
    prompt = (
        f"Company: {company.get('name', 'Fleet')}\n"
        f"Month: {month}\n"
        f"Income breakdown: {pnl['income']}\n"
        f"Expense breakdown: {pnl['expense']}\n"
        f"Net Profit: ₹{pnl['profit']:.0f}\n"
    )
    try:
        text = await claude_summary(system, prompt, f"ai-summary-{cid}-{month}")
    except Exception as e:
        log.exception("Claude failed")
        raise HTTPException(500, f"AI summary failed: {e}")
    return {"summary": text, "month": month, "pnl": pnl}


@api.get("/ai/truck_profitability")
async def truck_profitability(u: dict = Depends(get_current_user)):
    cid = u["company_id"]
    trucks = await db.trucks.find({"company_id": cid}, {"_id": 0}).to_list(500)
    trips = await db.trips.find({"company_id": cid}, {"_id": 0}).to_list(5000)
    fuel = await db.fuel.find({"company_id": cid}, {"_id": 0}).to_list(5000)
    maint = await db.maintenance.find({"company_id": cid}, {"_id": 0}).to_list(5000)
    result = []
    for t in trucks:
        tid = t["id"]
        rev = sum(float(tp.get("freight_amount", 0)) for tp in trips if tp.get("truck_id") == tid)
        km = sum(float(tp.get("distance_km", 0)) for tp in trips if tp.get("truck_id") == tid)
        fu = sum(float(f.get("total_cost", 0)) for f in fuel if f.get("truck_id") == tid)
        mn = sum(float(m.get("cost", 0)) for m in maint if m.get("truck_id") == tid)
        profit = rev - fu - mn
        result.append({
            "truck_id": tid,
            "reg_number": t.get("reg_number"),
            "revenue": rev,
            "fuel": fu,
            "maintenance": mn,
            "profit": profit,
            "km": km,
            "profit_per_km": (profit / km) if km else 0,
        })
    result.sort(key=lambda x: x["profit"], reverse=True)
    return result


@api.get("/ai/fuel_anomalies")
async def fuel_anomalies(u: dict = Depends(get_current_user)):
    cid = u["company_id"]
    anomalies = await db.fuel.find({"company_id": cid, "anomaly": True}, {"_id": 0}).sort("date", -1).to_list(200)
    return anomalies


@api.post("/ai/quick_alert")
async def ai_quick_alert(body: AIRequest, u: dict = Depends(get_current_user)):
    """Gemini 3 Flash — fast contextual answer/alert for the fleet."""
    system = "You are the on-call AI ops assistant for an Indian trucking business. Reply in 1-2 tight sentences."
    try:
        text = await gemini_flash(system, body.prompt or "Give me a quick fleet ops tip", f"gemini-{u['company_id']}")
    except Exception as e:
        raise HTTPException(500, f"Gemini failed: {e}")
    return {"answer": text}


# ============================================================
# PUBLIC TRACKING (no auth)
# ============================================================
@api.get("/public/track/{lr_number}")
async def public_track(lr_number: str):
    trip = _strip_mongo(await db.trips.find_one({"lr_number": lr_number}))
    if not trip:
        raise HTTPException(404, "LR not found")
    truck = _strip_mongo(await db.trucks.find_one({"id": trip["truck_id"]})) if trip.get("truck_id") else None
    driver = None
    if trip.get("driver_id"):
        d = _strip_mongo(await db.drivers.find_one({"id": trip["driver_id"]}))
        if d:
            driver = {"name": d.get("name"), "phone": d.get("phone")}
    company = _strip_mongo(await db.companies.find_one({"id": trip["company_id"]}))
    return {
        "lr_number": trip["lr_number"],
        "from": trip["from_location"],
        "to": trip["to_location"],
        "status": trip["status"],
        "start_date": trip["start_date"],
        "end_date": trip.get("end_date"),
        "goods": trip.get("goods"),
        "weight_tons": trip.get("weight_tons"),
        "truck_reg": truck.get("reg_number") if truck else None,
        "driver": driver,
        "carrier": company.get("name") if company else None,
    }


# ============================================================
# SEED demo data
# ============================================================
@app.on_event("startup")
async def seed_demo():
    if await db.users.find_one({"email": "demo@yourfleetai.com"}):
        return
    company = Company(name="Demo Transport Co.", gstin="27ABCDE1234F1Z5",
                      address="Mumbai, Maharashtra", phone="+91-9876543210",
                      trial_ends_at=(datetime.now(timezone.utc) + timedelta(days=14)).isoformat())
    await db.companies.insert_one(company.model_dump())
    owner = User(company_id=company.id, name="Demo Owner", email="demo@yourfleetai.com",
                 password_hash=hash_password("Demo@123"), role="owner")
    await db.users.insert_one(owner.model_dump())
    # 3 trucks
    trucks = [
        Truck(company_id=company.id, reg_number="MH12AB1234", make="Tata", model="Signa 4025", year=2022, truck_type="10-wheeler", capacity_tons=25, current_odometer=145000),
        Truck(company_id=company.id, reg_number="MH14CD5678", make="Ashok Leyland", model="U-3718", year=2021, truck_type="12-wheeler", capacity_tons=28, current_odometer=210000),
        Truck(company_id=company.id, reg_number="GJ01EF9012", make="BharatBenz", model="3123R", year=2023, truck_type="14-wheeler", capacity_tons=30, current_odometer=68000, status="idle"),
    ]
    for t in trucks:
        await db.trucks.insert_one(t.model_dump())
    # 2 drivers
    drivers = [
        Driver(company_id=company.id, name="Ramesh Kumar", phone="+91-9111111111", license_number="MH1420190001234", license_expiry="2027-05-15", salary=25000, assigned_truck_id=trucks[0].id),
        Driver(company_id=company.id, name="Sunil Yadav", phone="+91-9222222222", license_number="MH1420180002345", license_expiry="2026-08-20", salary=27000, assigned_truck_id=trucks[1].id),
    ]
    for d in drivers:
        await db.drivers.insert_one(d.model_dump())
    # Customer
    cust = Customer(company_id=company.id, name="Reliance Retail Ltd.", contact_person="Amit Shah",
                    phone="+91-9333333333", email="amit@reliance.com", gstin="27AABCR1234R1ZS",
                    type="customer")
    await db.customers.insert_one(cust.model_dump())
    # 3 trips
    today = datetime.now(timezone.utc)
    trips = [
        Trip(company_id=company.id, truck_id=trucks[0].id, driver_id=drivers[0].id, customer_id=cust.id,
             from_location="Mumbai", to_location="Delhi", start_date=(today - timedelta(days=5)).date().isoformat(),
             end_date=(today - timedelta(days=3)).date().isoformat(), distance_km=1400, freight_amount=85000,
             advance=25000, balance=60000, status="delivered", goods="Electronics", weight_tons=22, lr_number="LR-2026-00001"),
        Trip(company_id=company.id, truck_id=trucks[1].id, driver_id=drivers[1].id, customer_id=cust.id,
             from_location="Ahmedabad", to_location="Bangalore", start_date=today.date().isoformat(),
             distance_km=1500, freight_amount=95000, advance=30000, balance=65000, status="in_transit",
             goods="FMCG", weight_tons=25, lr_number="LR-2026-00002"),
        Trip(company_id=company.id, truck_id=trucks[0].id, driver_id=drivers[0].id, customer_id=cust.id,
             from_location="Pune", to_location="Chennai", start_date=(today - timedelta(days=20)).date().isoformat(),
             end_date=(today - timedelta(days=18)).date().isoformat(), distance_km=1200, freight_amount=72000,
             advance=20000, balance=52000, status="delivered", goods="Textiles", weight_tons=20, lr_number="LR-2026-00003"),
    ]
    for tr in trips:
        await db.trips.insert_one(tr.model_dump())
    # Fuel
    fuel_entries = [
        FuelEntry(company_id=company.id, truck_id=trucks[0].id, driver_id=drivers[0].id,
                  date=(today - timedelta(days=5)).date().isoformat(), liters=200, rate_per_liter=95,
                  total_cost=19000, odometer=144000, location="Mumbai", mileage=5.5),
        FuelEntry(company_id=company.id, truck_id=trucks[0].id, driver_id=drivers[0].id,
                  date=(today - timedelta(days=3)).date().isoformat(), liters=180, rate_per_liter=96,
                  total_cost=17280, odometer=145000, location="Delhi", mileage=5.5),
        FuelEntry(company_id=company.id, truck_id=trucks[1].id, driver_id=drivers[1].id,
                  date=today.date().isoformat(), liters=220, rate_per_liter=95.5,
                  total_cost=21010, odometer=210000, location="Ahmedabad", mileage=5.2),
    ]
    for f in fuel_entries:
        await db.fuel.insert_one(f.model_dump())
    # Maintenance
    m = MaintenanceEntry(company_id=company.id, truck_id=trucks[0].id,
                         date=(today - timedelta(days=10)).date().isoformat(), type="service",
                         description="Full service + oil change", cost=8500, odometer=143500)
    await db.maintenance.insert_one(m.model_dump())
    # FASTag
    ft = [
        FastagEntry(company_id=company.id, truck_id=trucks[0].id,
                    date=(today - timedelta(days=15)).date().isoformat(), type="recharge", amount=5000),
        FastagEntry(company_id=company.id, truck_id=trucks[0].id,
                    date=(today - timedelta(days=5)).date().isoformat(), type="toll", amount=1200, location="Mumbai-Delhi Expy"),
        FastagEntry(company_id=company.id, truck_id=trucks[1].id,
                    date=today.date().isoformat(), type="recharge", amount=3000),
    ]
    for f in ft:
        await db.fastag.insert_one(f.model_dump())
    # Compliance docs (some expiring soon)
    comps = [
        ComplianceDoc(company_id=company.id, truck_id=trucks[0].id, doc_type="rc", number="MH12AB1234-RC",
                      expiry_date=(today + timedelta(days=200)).date().isoformat()),
        ComplianceDoc(company_id=company.id, truck_id=trucks[0].id, doc_type="insurance", number="INS-2024-001",
                      expiry_date=(today + timedelta(days=25)).date().isoformat()),
        ComplianceDoc(company_id=company.id, truck_id=trucks[1].id, doc_type="puc", number="PUC-1234",
                      expiry_date=(today + timedelta(days=10)).date().isoformat()),
        ComplianceDoc(company_id=company.id, truck_id=trucks[2].id, doc_type="permit", number="PRM-99",
                      expiry_date=(today - timedelta(days=5)).date().isoformat()),
    ]
    for c in comps:
        await db.compliance.insert_one(c.model_dump())
    # Invoice
    inv = Invoice(company_id=company.id, invoice_number="INV-2026-00001", customer_id=cust.id,
                  trip_id=trips[0].id, issue_date=today.date().isoformat(),
                  due_date=(today + timedelta(days=30)).date().isoformat(),
                  items=[InvoiceItem(description="Freight Mumbai to Delhi (LR-2026-00001)", quantity=1, rate=85000, amount=85000)],
                  subtotal=85000, cgst=2125, sgst=2125, igst=0, total=89250, status="sent")
    await db.invoices.insert_one(inv.model_dump())
    log.info("Seeded demo company + user demo@yourfleetai.com / Demo@123")


# ---- register + CORS ----
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db():
    client.close()
