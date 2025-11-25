# AfyaNumeriq– Developer Guide

Last updated: Nov 2025

This guide provides a quick technical overview for developers working on the AfyaNumeriq platform (Next.js 15 + Django REST + PostgreSQL).
It focuses on how to run the system, where things live, and how to work safely.

Project Structure (Monorepo)
afyanumeriq/
├── backend/ # Django API
│ ├── api/ # Models, views, serializers, auth, notifications
│ ├── config/ # Django settings + URLs
│ ├── evidence/ # Uploaded evidence files
│ ├── manage.py
│ └── requirements.txt
│
├── frontend/ # Next.js 15 App Router frontend
│ ├── src/
│ ├── public/
│ └── package.json
│
└── README.md
All custom Django management commands (seeders, role creators, etc.) live under:
backend/api/management/commands/

Running the Platform (Local)
Backend — Django API
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

Runs at:
http://127.0.0.1:8000

Frontend — Next.js
cd frontend
npm install
npm run dev

Runs at:
http://127.0.0.1:3000

Authentication (MVP Status)

Auth uses JWT access tokens (in memory) + refresh token stored in HttpOnly cookie.

Login endpoint:
POST /api/auth/login/
Refresh endpoint:
POST /api/auth/refresh/
Profile endpoint:
GET /api/auth/me/
Frontend keeps auth state in:
src/store/authStore.ts
Logout clears local state + cookie.

Seeding Critical Data
ISO 7101 Clauses (34 in number; core to the system)
python manage.py seed_iso7101
Located at:
backend/api/management/commands/seed_iso7101.py

Other seeders available:
create_roles.py
create_user_profiles.py
seed_clauses.py
fix_short_descriptions.py

Fake Demo Data (Important)
The platform currently loads demo data:

Fake notifications

Example organizations

Example risks, audits, and compliance clauses

Example users (via seeders)

Before Production Release:

You must:

Drop or sanitize fake records.

Rerun only the ISO 7101 seed command.

Create a real admin user manually.

Upload no dummy evidence files.

A cleanup script can be added later if needed.

Environment Variables
Backend (backend/config/settings.py)
Backend (backend/config/settings.py)

Frontend (frontend/.env.local)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

Key API Endpoints (Quick View)
/api/auth/login/ POST
/api/auth/logout/ POST
/api/auth/me/ GET
/api/auth/change-password/ POST

/api/compliance/ GET
/api/compliance/<id>/evidence/ POST

/api/notifications/ GET
/api/notifications/mark-read/ POST

/api/audits/ GET, POST
/api/findings/<id>/ PATCH

Git Workflow
Branches:
main # stable releases only
develop # integration branch
feat/... # feature branches
Workflow:
git checkout develop
git checkout -b feat/some-feature

# build feature

git push origin feat/some-feature

# open PR → develop

Never merge directly to main.

Deployment Notes (Post-MVP)
Before production:

Set DEBUG=False.

Move evidence storage to S3 or equivalent.

Use Postgres on managed service.

Add HTTPS so refresh cookies can use Secure.

Replace dev seed data with real content.

Add production WSGI (gunicorn) + reverse proxy (NGINX/Caddy).

Maintainer

Steve Wakhungu  
Nzasi Ventures Ltd.
