# Coastal Studio — Photographer Portfolio & Business Manager

A full-stack web application for beach restaurant photographers to manage clients,
shootings, payments, and appointments — with a real-time dashboard.

**Stack:** React + Vite · Flask (Python) · MySQL (Laragon)

---

## Prerequisites

- **Laragon** (running with Apache + MySQL)
- **Python 3.10+** (`python --version` to check)
- **Node.js 18+** (`node --version` to check)

---

## Step 1 — Database Setup

1. Open **Laragon** and start all services (Apache + MySQL).
2. Open **phpMyAdmin**: http://localhost/phpmyadmin
3. Click **SQL** tab (top menu).
4. Paste the entire contents of `database.sql` and click **Go**.

This creates the `photographer_db` database with all tables and sample data.

---

## Step 2 — Backend (Flask)

### Option A: Double-click `start_backend.bat`
This auto-creates a virtual environment, installs deps, and starts the server.

### Option B: Manual
```bash
cd backend
python -m venv venv
venv\Scripts\activate         # Windows
pip install -r requirements.txt
python app.py
```

The API runs at: **http://localhost:5000**

### MySQL credentials
Edit `backend/.env` if your Laragon MySQL has a password:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=          # leave empty for Laragon default
MYSQL_DB=photographer_db
```

---

## Step 3 — Frontend (React)

### Option A: Double-click `start_frontend.bat`
Auto-installs npm packages and starts the dev server.

### Option B: Manual
```bash
cd frontend
npm install
npm run dev
```

The app runs at: **http://localhost:5173**

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | KPIs, upcoming shoots, unpaid payments, today's agenda |
| Clients | `/clients` | Client cards with billing stats, full CRUD |
| Shootings | `/shootings` | All photo sessions, filter by status, linked payments |
| Payments | `/payments` | Payment tracking, mark-paid button, overdue alerts |
| Calendar | `/calendar` | Monthly grid with shootings + appointments, click day for details |

---

## API Endpoints

```
GET  /api/dashboard/
GET  /api/clients/            POST /api/clients/
GET  /api/clients/:id         PUT  /api/clients/:id       DELETE /api/clients/:id
GET  /api/shootings/          POST /api/shootings/
GET  /api/shootings/:id       PUT  /api/shootings/:id     DELETE /api/shootings/:id
GET  /api/payments/           POST /api/payments/
PUT  /api/payments/:id        POST /api/payments/:id/mark-paid
GET  /api/appointments/       POST /api/appointments/
PUT  /api/appointments/:id    DELETE /api/appointments/:id
GET  /api/appointments/calendar?month=YYYY-MM
```

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--navy` | `#0B1D2E` | Page background |
| `--coral` | `#E8925A` | Primary accent, buttons |
| `--seafoam` | `#4ECDC4` | Status: paid / scheduled |
| `--sand` | `#F5E6C8` | Headings, key values |

Fonts: **Playfair Display** (headings) + **Inter** (body)

---

## Troubleshooting

**CORS error in browser?**
Make sure Flask is running on port 5000. The Vite proxy forwards `/api/*` to Flask.

**MySQL connection refused?**
Laragon's MySQL must be running. Check `backend/.env` credentials.

**`flask_mysqldb` install fails on Windows?**
Run as administrator, or install the MySQL C connector first:
https://dev.mysql.com/downloads/connector/c/

**Port 5000 already in use?**
Change `port=5000` in `backend/app.py` and update `vite.config.js` proxy target accordingly.
