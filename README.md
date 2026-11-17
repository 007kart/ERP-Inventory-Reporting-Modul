# StockPilot — ERP Inventory & Reporting Module

**Full-stack Next.js + JavaScript + PostgreSQL** inventory dashboard. Responsive React interface, server-side Next.js App Router APIs, relational SQL, searchable inventory, validated stock movements and reporting. **No Python backend.**

> Independently developed portfolio demonstration using synthetic inventory; not source code exported from an employer. No real enterprise clients or AWS deployment are represented by this demo.

## Features
- Inventory value, item/unit counts, low-stock and stockout KPI cards
- Stock value by category, 14-day activity trend, movement history and restock alerts
- Inventory table with free-text search, category filters, low-stock toggle, pagination
- Add a product and assign a supplier, SKU validation and uniqueness checking
- Receive stock or issue stock; PostgreSQL row locks prevent negative inventory under concurrent operations
- Audit trail of all inventory movements (before/after quantity, reason and time)
- Filterable CSV reports with formula-injection escaping, five synthetic suppliers and 20 seeded items
- Full Next.js JavaScript backend with `pg` SQL queries

## Run locally

Prerequisites: Node.js 20+ and Docker Desktop.

```bash
cp .env.example .env.local
npm install
docker compose up -d
DATABASE_URL=postgresql://portfolio:portfolio@localhost:5442/stockpilot npm run db:setup
npm run dev
```

Navigate to **http://localhost:3000**. Use DBeaver on `localhost:5442`, database `stockpilot`, username/password `portfolio` (**local only**).

> Alternatively, export `.env.local` in your shell before running the setup command. Next.js loads `.env.local` automatically, but the standalone seed script needs the env variable provided by your shell.

Reset sample data: `docker compose down -v` then repeat database startup and setup. Existing item data is preserved by subsequent setup calls.

## Next.js API routes

| Method | URL | Function |
|---|---|---|
| GET | `/api/dashboard` | KPIs, movement history, categories, alerts |
| GET | `/api/items?search=&category=all&low=false&page=1` | Filters + pagination |
| POST | `/api/items` | Create item and record initial stock |
| POST | `/api/adjustments` | Transactional incoming/outgoing stock movement |
| GET | `/api/reports/export` | CSV stock report |
| GET | `/api/suppliers` | Supplier dropdown |

**Sample adjustment body:** `{"itemId":2,"type":"in","quantity":15,"reason":"New shipment"}`

## QA

```bash
npm test
npm run build
```

Tests cover input validation, adjustment validation and CSV escaping. End-to-end database integration requires a PostgreSQL instance.

## Production improvements

Before deploying publicly, add authentication, per-tenant authorization, CSRF protection, audit-user identity, rate limiting, managed database credentials, safe connection pooling and observability. Host on a platform supporting **Next.js Node.js server functions**, not static GitHub Pages.
