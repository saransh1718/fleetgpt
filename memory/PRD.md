# YourFleetAI v2 — Product Requirements Document

## Original Problem Statement
A revenue-generating transport management SaaS for Indian trucking fleets (1-200+ trucks). Keeps all 10 existing modules (Dashboard, Trucks, Drivers, Trips, Fuel, Maintenance, Contracts, Staff, FASTag, Monthly Accounting) and adds multi-tenant SaaS foundation, Compliance Vault, Digital LR/Bilty, GST Invoicing, AI Insights, Customer portal, WhatsApp/email alerts, and future driver mobile app + real-time GPS tracking. Monetization: per-truck INR SaaS (₹299-₹1299) with 14-day trial.

## User Choices (2026-02-08)
- Scope: "Try to cover everything" — deep breadth in one iteration
- Payments: Skip / mocked (build UI hooks only)
- AI: Claude Sonnet 4.6 + Gemini 3 Flash via Emergent Universal LLM key
- WhatsApp/Email: mocked (Twilio + Resend not connected)
- Migration: clean relaunch

## Personas
1. **Small fleet owner (1-20 trucks)** — self-serve Starter tier, needs simple accounting + compliance
2. **Mid-size logistics company (20-200 trucks)** — main revenue driver, needs Growth/Pro features
3. **Enterprise fleet (200+)** — custom contracts, SSO, dedicated support

## Architecture
- **Frontend**: React 19 + Tailwind + Shadcn UI + Recharts + Sonner
- **Backend**: FastAPI + Motor (MongoDB async) + JWT auth
- **DB**: MongoDB, multi-tenant via `company_id` on every document
- **AI**: emergentintegrations library — Claude Sonnet 4.6 for summaries, Gemini 3 Flash for quick alerts
- **Design**: dark-first with orange (#FF6A00) primary + yellow secondary, Space Grotesk display + IBM Plex Sans body + JetBrains Mono for numbers

## Implemented (2026-02-08 · Iteration 1)
### SaaS foundation
- JWT auth (register/login/me), password bcrypt hashing
- Company workspace with 14-day trial timestamp
- Team invites with roles (owner/manager/accountant/dispatcher/driver/viewer)
- Multi-tenant isolation via `company_id` scoped queries everywhere

### 10 core modules (kept 1:1 from spec)
- Trucks, Drivers, Staff, Trips (auto LR-numbered), Fuel (mileage + anomaly), Maintenance, Contracts, Contract Payments, FASTag (recharge/toll with running balance), Monthly Accounting (full P&L)

### 5 new modules
- **Compliance Vault** — RC/Insurance/PUC/Permit/Fitness/License with urgency badges
- **GST Invoices** — CGST+SGST or IGST auto-computed, receivables aging (current/30/60/90/90+)
- **Customers/Brokers** directory with GSTIN
- **AI Insights** — Claude monthly CFO summary + truck profitability leaderboard + fuel anomalies + Gemini quick-ask
- **Public Tracking** — customer-facing shipment tracking by LR number (no auth)

### UI
- Landing page (hero + features + pricing 4-tier + track shipment)
- Login + Signup with clean split layout
- Sidebar with 15 nav items, dark/light theme toggle
- Reusable CrudTable component (used across 11 modules)
- Monthly P&L Recharts area/line chart, Truck profitability bar chart, aging tiles

### Testing (iteration 1)
- Backend: 21/21 pytest passing (auth, CRUD, GST, aging, AI, multi-tenancy)
- Frontend: 14/14 Playwright flows passing

## Mocked / Deferred
- **Razorpay / Stripe payments** — UI only, no billing calls
- **Twilio WhatsApp** — no external send
- **Resend email digest** — no external send
- **E-way bill / NIC APIs** — not implemented
- **Driver mobile app** — Phase 5 in spec
- **Real-time GPS map** — Phase 5 in spec
- **CSV bulk import** — deferred to next iteration
- **PDF LR generation** — currently just shareable tracking link
- **Tally-compatible CSV export** — deferred

## Backlog / Next
### P0 (revenue enablers)
- Connect Razorpay for real subscription billing + trial→paid conversion
- CSV bulk import for existing customers migrating data
- PDF LR / Invoice generation for sharing via WhatsApp

### P1 (differentiators)
- Twilio WhatsApp alert engine (doc expiry, low FASTag, invoice reminders)
- Resend weekly digest email
- Predictive maintenance flags based on trip + service history
- Tally-compatible export

### P2 (upsell)
- Driver mobile app (React Native) with trip log + fuel entry + POD upload
- Live GPS map + geofencing
- E-way bill via NIC/Cleartax API
- SSO + audit logs for enterprise

## Seed / Demo
Demo account: `demo@yourfleetai.com` / `Demo@123` — Demo Transport Co. with 3 trucks, 2 drivers, 1 customer, 3 trips, sample fuel/maintenance/FASTag/compliance/invoice data.
