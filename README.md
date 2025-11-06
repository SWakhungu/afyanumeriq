# AfyaNumeriq Platform– Developer Guide

This document is for engineers contributing to the AfyaNumeriq platform.

For product overview, see the main `README.md`.  
This guide explains **how the codebase is structured, how to run it locally, and how to extend it safely.**

---

## 🏗️ Architecture Overview

monorepo/
│
├── backend/ Django REST API (DB, models, business logic)
├── frontend/ Next.js 15 App Router PWA (UI + API client)
└── api/ ISO seeding management script (temporary folder)

Frontend communicates with backend via fetch wrapper in  
`/frontend/src/lib/api.ts`.

---

## ⚙️ Local Setup

### 1️⃣ Backend (Django)

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

Backend will run on:http://127.0.0.1:8000

#### Seed ISO 7101 clauses: python manage.py shell < seed.py

Or later (JSON version): python manage.py loaddata iso7101.json

Uploads are stored in `/backend/evidence/`.

---

### 2️⃣ Frontend (Next.js 15)

cd frontend
npm install
npm run dev

Frontend runs on:http://localhost:3000

---

## 🔧 Environment Variables

### Backend (`backend/config/settings.py`)

| Key             | Default             | Notes               |
| --------------- | ------------------- | ------------------- |
| `DEBUG`         | True                | Set False in prod   |
| `ALLOWED_HOSTS` | `*`                 | Update for live     |
| `MEDIA_ROOT`    | `backend/evidence/` | Storage for uploads |
| `MEDIA_URL`     | `/media/`           | Served by Django    |

Planned (post-MVP):

| Key             | Purpose                |
| --------------- | ---------------------- |
| `JWT_SECRET`    | Signing tokens         |
| `S3_BUCKET_URL` | Cloud evidence storage |

---

### Frontend (`frontend/.env.local`)

| Key                   | Default                     |
| --------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000/api` |

Planned:

| Key                       | Purpose      |
| ------------------------- | ------------ |
| `NEXT_PUBLIC_JWT_ENABLED` | Toggles auth |
| `NEXT_PUBLIC_APP_NAME`    | Branding     |

---

## 📂 Folder Breakdown

### Backend

backend/
├── api/ # All business logic (models, serializers, views, urls)
│ ├── models.py # Risk, Compliance, Audit, Findings
│ ├── views.py # CRUD + upload handlers
│ ├── serializers.py
│ └── reports.py # CSV / PDF generators (partial)
├── config/ # Django project settings
├── evidence/ # Uploaded proof files
└── seed.py # ISO 7101 DB seeder

### Frontend

frontend/src/
├── app/ # Next.js routes (Audit, Risk, Compliance, etc.)
├── components/ # Shared UI components
├── lib/ # API fetch wrapper + utilities
├── store/ # Zustand global state
└── styles/ # Tailwind + globals

---

## 🔌 API Reference (MVP)

| Endpoint                         | Method         | Purpose          |
| -------------------------------- | -------------- | ---------------- |
| `/api/compliance/`               | GET            | All ISO clauses  |
| `/api/compliance/{id}/evidence/` | POST           | Upload file      |
| `/api/risks/`                    | GET/POST/PATCH | Risk register    |
| `/api/audits/`                   | GET/POST       | Audit schedule   |
| `/api/findings/{id}/`            | PATCH          | Mark Open/Closed |

Full OpenAPI spec will be auto-generated post-auth refactor.

---

## 🔥 Contributing Rules

✅ All work in feature branches:  
git checkout -b feat/<feature-name>

✅ Merge into `develop` via PR  
✅ `main` only receives tagged, stable versions (`v0.9-mvp`, etc.)

❌ Never commit directly to `main`  
❌ No large UI refactors without issue ticket  
❌ No breaking DB changes without migration + note

---

## 🛠️ Tests (Post-MVP)

Backend: pytest

Frontend: npm run test

Coverage enforcement will be added once auth + RBAC are implemented.

---

## 🧱 Future Enhancements (Developer View)

| Todo             | Where                  |
| ---------------- | ---------------------- |
| JWT Auth         | Backend + frontend     |
| RBAC             | New user + role models |
| S3 storage       | Replace local media    |
| Multi-tenant DB  | Settings module        |
| PDF reports      | `/reports` backend     |
| Queue async jobs | Celery + Redis         |

---

## 📌 Notes for Onboarding Devs

- This is an MVP, not final architecture
- No authentication yet → wide-open API
- SQLite used to simplify demo
- Codebase is intentionally readable > optimized

---

## 🧑‍💻 Maintainer

Steve Wakhungu  
Nzasi Ventures Ltd.
