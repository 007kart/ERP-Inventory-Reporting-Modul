# ERP Inventory & Reporting Module

**Next.js · React · TypeScript · FastAPI · REST APIs · SQL · PostgreSQL · DBeaver · Docker**

An independent inventory-management portfolio recreation that demonstrates inventory stock control, dashboard metrics and reporting. **All product records are synthetic**; the repository does **not** contain employer code, enterprise client data or proof of deployment to real customers.

## Features
- Inventory overview: SKU count, stock units, low-stock alerts, out-of-stock products, inventory value
- Search products by name/SKU; filter by category or low-stock status
- Product creation with server-side validation and duplicate SKU rejection
- Adjust stock (inward/outward), prevent negative stock, keep an auditable movement log
- CSV reporting, category breakdown and sortable tables
- PostgreSQL row locking during stock adjustments to protect against concurrent negative stock changes
- Clean Next.js dashboard and FastAPI OpenAPI documentation
- Twenty fictional product records seeded on first startup
- API tests run with isolated SQLite; actual Docker services use PostgreSQL

## Run locally

**Prerequisites:** Docker Engine + Docker Compose and Node.js 20+.

1. In project root: `docker compose up --build -d` (PostgreSQL + FastAPI backend)
2. In another terminal: `cd frontend && cp .env.example .env.local && npm install && npm run dev`
3. Open **http://localhost:3001**. API docs: **http://localhost:8000/docs**.
4. Optional DBeaver connection: host `localhost`, port **5442**, database `inventory_demo`, username/password `demo` (local dev only).
5. Reset demo: `docker compose down -v` and start again.

**Note:** The E-Commerce Analytics Portal also exposes its backend on host port 8000. Run these two demos separately, or change the host port on one service if running both together.

## REST API
| Method | Endpoint | What it does |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/kpis` | Summary inventory metrics |
| GET | `/api/products` | Search and filter products |
| GET | `/api/categories` | Distinct product categories |
| GET | `/api/movements` | Latest stock changes |
| POST | `/api/products` | Add product |
| POST | `/api/products/{id}/adjust` | Update stock with movement log |
| GET | `/api/reports/inventory.csv` | Download CSV report |

## Run backend tests

```bash
cd backend
pip install -r requirements.txt
pytest -q
```

## What this demonstrates
A full-stack product that goes beyond a static frontend: relational schemas, SQL-based reporting, API design, data validation, stock-adjustment transactions, search/filtering, CSV exports and containerized services.

## Production improvements
Require authentication and role-based permissions, tenant isolation, migrations, production secrets, audit logs, input validation for CSV formula injection, rate limiting, eventing, robust error handling, monitoring and deployment pipelines before real company use.

**Resume integrity:** This is an independent portfolio prototype. Do not describe it as the actual ERP solution used by '5+ enterprise clients' unless that claim relates to work you personally did and can verify.
