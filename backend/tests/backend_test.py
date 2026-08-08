"""YourFleetAI v2 backend regression tests."""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to reading frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@yourfleetai.com"
DEMO_PASS = "Demo@123"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and data["user"]["email"] == DEMO_EMAIL
    return data["token"]


@pytest.fixture(scope="session")
def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# --- Auth ---
class TestAuth:
    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me(self, headers):
        r = requests.get(f"{API}/auth/me", headers=headers, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j["user"]["email"] == DEMO_EMAIL
        assert j["company"]["name"] == "Demo Transport Co."

    def test_register_new_company(self):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "company_name": "TEST_Company",
            "name": "TEST_User",
            "email": email,
            "password": "Test@1234",
        }, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "token" in j and j["user"]["email"] == email
        assert j["company"]["plan"] == "trial"


# --- Dashboard ---
class TestDashboard:
    def test_summary(self, headers):
        r = requests.get(f"{API}/dashboard/summary", headers=headers, timeout=15)
        assert r.status_code == 200
        j = r.json()
        for k in ("trucks_total", "drivers_total", "receivables_outstanding", "expiring_docs", "expired_docs"):
            assert k in j
        assert j["trucks_total"] >= 3

    def test_monthly_pnl(self, headers):
        r = requests.get(f"{API}/dashboard/monthly_pnl", headers=headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --- CRUD Trucks ---
class TestTrucksCRUD:
    def test_list(self, headers):
        r = requests.get(f"{API}/trucks", headers=headers, timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_full_lifecycle(self, headers):
        reg = f"TEST{uuid.uuid4().hex[:4].upper()}"
        # create
        r = requests.post(f"{API}/trucks", headers=headers, json={
            "reg_number": reg, "make": "Tata", "model": "Test",
            "year": 2024, "truck_type": "10-wheeler", "capacity_tons": 20,
        }, timeout=15)
        assert r.status_code == 200, r.text
        tid = r.json()["id"]
        # get
        r = requests.get(f"{API}/trucks/{tid}", headers=headers, timeout=15)
        assert r.status_code == 200 and r.json()["reg_number"] == reg
        # update
        r = requests.put(f"{API}/trucks/{tid}", headers=headers, json={"status": "idle"}, timeout=15)
        assert r.status_code == 200 and r.json()["status"] == "idle"
        # delete
        r = requests.delete(f"{API}/trucks/{tid}", headers=headers, timeout=15)
        assert r.status_code == 200
        r = requests.get(f"{API}/trucks/{tid}", headers=headers, timeout=15)
        assert r.status_code == 404


# --- Trips (auto lr, balance) ---
class TestTrips:
    def test_create_auto_lr_balance(self, headers):
        trucks = requests.get(f"{API}/trucks", headers=headers, timeout=15).json()
        tid = trucks[0]["id"]
        r = requests.post(f"{API}/trips", headers=headers, json={
            "truck_id": tid, "from_location": "TestA", "to_location": "TestB",
            "start_date": "2026-01-15", "freight_amount": 50000, "advance": 15000,
            "distance_km": 1000, "status": "planned",
        }, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["lr_number"].startswith("LR-")
        assert j["balance"] == 35000
        # cleanup
        requests.delete(f"{API}/trips/{j['id']}", headers=headers, timeout=15)


# --- Fuel with anomaly ---
class TestFuel:
    def test_create_computes_mileage(self, headers):
        trucks = requests.get(f"{API}/trucks", headers=headers, timeout=15).json()
        tid = trucks[0]["id"]
        r = requests.post(f"{API}/fuel", headers=headers, json={
            "truck_id": tid, "date": "2026-01-14",
            "liters": 100, "rate_per_liter": 96, "odometer": 999999,
        }, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j["total_cost"] == 9600
        requests.delete(f"{API}/fuel/{j['id']}", headers=headers, timeout=15)


# --- Invoices with GST ---
class TestInvoices:
    def test_create_gst_intrastate(self, headers):
        cust = requests.get(f"{API}/customers", headers=headers, timeout=15).json()[0]
        r = requests.post(f"{API}/invoices", headers=headers, json={
            "customer_id": cust["id"],
            "issue_date": "2026-01-15", "due_date": "2026-02-15",
            "items": [{"description": "Freight", "quantity": 1, "rate": 10000, "amount": 10000}],
            "interstate": False, "gst_rate": 5,
        }, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["invoice_number"].startswith("INV-")
        assert j["subtotal"] == 10000
        assert j["cgst"] == 250 and j["sgst"] == 250 and j["igst"] == 0
        assert j["total"] == 10500
        requests.delete(f"{API}/invoices/{j['id']}", headers=headers, timeout=15)

    def test_create_gst_interstate(self, headers):
        cust = requests.get(f"{API}/customers", headers=headers, timeout=15).json()[0]
        r = requests.post(f"{API}/invoices", headers=headers, json={
            "customer_id": cust["id"],
            "issue_date": "2026-01-15", "due_date": "2026-02-15",
            "items": [{"description": "Freight", "quantity": 1, "rate": 20000, "amount": 20000}],
            "interstate": True, "gst_rate": 5,
        }, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j["igst"] == 1000 and j["cgst"] == 0 and j["sgst"] == 0
        assert j["total"] == 21000
        requests.delete(f"{API}/invoices/{j['id']}", headers=headers, timeout=15)

    def test_aging_report(self, headers):
        r = requests.get(f"{API}/invoices/aging/report", headers=headers, timeout=15)
        assert r.status_code == 200
        j = r.json()
        for b in ("current", "30", "60", "90", "90+"):
            assert b in j


# --- Accounting ---
class TestAccounting:
    def test_month_pnl(self, headers):
        r = requests.get(f"{API}/accounting/2026-01", headers=headers, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "income" in j and "expense" in j and "profit" in j
        assert "total" in j["income"] and "total" in j["expense"]


# --- AI ---
class TestAI:
    def test_truck_profitability(self, headers):
        r = requests.get(f"{API}/ai/truck_profitability", headers=headers, timeout=20)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) >= 3
        assert "profit" in arr[0] and "reg_number" in arr[0]

    def test_fuel_anomalies(self, headers):
        r = requests.get(f"{API}/ai/fuel_anomalies", headers=headers, timeout=15)
        assert r.status_code == 200

    def test_claude_monthly_summary(self, headers):
        r = requests.post(f"{API}/ai/monthly_summary", headers=headers, timeout=60)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "summary" in j and len(j["summary"]) > 50

    def test_gemini_quick_alert(self, headers):
        r = requests.post(f"{API}/ai/quick_alert", headers=headers,
                          json={"prompt": "One tip to save fuel?"}, timeout=60)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "answer" in j and len(j["answer"]) > 5


# --- Public Tracking ---
class TestPublicTrack:
    def test_track_valid_lr(self):
        r = requests.get(f"{API}/public/track/LR-2026-00001", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j["lr_number"] == "LR-2026-00001"
        assert j["from"] and j["to"]
        assert j["carrier"] == "Demo Transport Co."

    def test_track_invalid_lr(self):
        r = requests.get(f"{API}/public/track/LR-NONEXIST", timeout=15)
        assert r.status_code == 404


# --- Multi-tenant isolation ---
class TestMultiTenant:
    def test_isolation(self):
        # create 2 companies
        e1 = f"iso1_{uuid.uuid4().hex[:6]}@x.com"
        e2 = f"iso2_{uuid.uuid4().hex[:6]}@x.com"
        r1 = requests.post(f"{API}/auth/register", json={"company_name":"C1","name":"U1","email":e1,"password":"Test@1234"}).json()
        r2 = requests.post(f"{API}/auth/register", json={"company_name":"C2","name":"U2","email":e2,"password":"Test@1234"}).json()
        h1 = {"Authorization": f"Bearer {r1['token']}", "Content-Type":"application/json"}
        h2 = {"Authorization": f"Bearer {r2['token']}", "Content-Type":"application/json"}
        # C1 creates a truck
        tr = requests.post(f"{API}/trucks", headers=h1, json={"reg_number": f"ISO{uuid.uuid4().hex[:4]}"}).json()
        # C2 should not see it
        c2_trucks = requests.get(f"{API}/trucks", headers=h2).json()
        assert not any(t["id"] == tr["id"] for t in c2_trucks)
        # C2 cannot GET it
        r = requests.get(f"{API}/trucks/{tr['id']}", headers=h2)
        assert r.status_code == 404


# --- Team ---
class TestTeam:
    def test_list_and_invite(self, headers):
        r = requests.get(f"{API}/team", headers=headers, timeout=15)
        assert r.status_code == 200
        assert any(u["email"] == DEMO_EMAIL for u in r.json())
        new_email = f"team_{uuid.uuid4().hex[:6]}@demo.com"
        r = requests.post(f"{API}/team/invite", headers=headers, json={
            "name": "TEST_Member", "email": new_email, "role": "viewer", "password": "Test@1234"
        }, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["email"] == new_email
