# AfyaNumeriq – Developer Guide

Last updated: February 2026

This guide provides a quick technical overview for developers working on the AfyaNumeriq platform (Next.js 15 + Django REST + PostgreSQL).
It focuses on how to run the system, where things live, and how to work safely.

## Project Structure (Monorepo)

```
afyanumeriq/
├── backend/                          # Django REST API
│   ├── api/                          # Core application
│   │   ├── models.py                 # Audit, Finding models
│   │   ├── isms_models.py            # ISO 27001 controls, SoA, risks
│   │   ├── tprm_models.py            # Third-party risk management
│   │   ├── views.py                  # general views
│   │   ├── isms_views.py             # ISO 27001 views
│   │   ├── tprm_views.py             # TPRM views
│   │   ├── serializers.py            # General serializers
│   │   ├── isms_serializers.py       # ISO 27001 serializers
│   │   ├── tprm_serializers.py       # TPRM serializers
│   │   ├── auth_views.py             # Authentication
│   │   ├── isms_audit_lock.py        # Audit state locking logic
│   │   ├── middleware.py             # Tenant routing middleware
│   │   ├── tenancy.py                # Multi-tenant utilities
│   │   ├── management/commands/      # Django management commands
│   │   ├── migrations/               # Database schema
│   │   └── tests/                    # Test suite
│   ├── config/                       # Django settings + URLs
│   ├── evidence/                     # Uploaded evidence files
│   ├── media/                        # User-uploaded media
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                         # Next.js 15 App Router frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

**Custom Django management commands** live under:
`backend/api/management/commands/`

## Running the Platform (Local)

### Backend — Django API

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Runs at: `http://127.0.0.1:8000`

### Frontend — Next.js

```bash
cd frontend
npm install
npm run dev
```

Runs at: `http://127.0.0.1:3000`

## Core Features

### ISO 27001 Compliance Management

- **Statement of Applicability (SoA)**: Track applicability and implementation status of ISO 27001 controls
- **ISO 27001 Annex A Controls**: Comprehensive control library with justification and evidence tracking
- **Risk Management**: Link risks to ISO 27001 controls with treatment and acceptance
- **Audit Lifecycle**: Create, schedule, and track audits with findings
- **Audit Locking**: ISMS becomes read-only during "In Progress" audits to prevent modifications

### Third-Party Risk Management (TPRM)

- **Vendor/Third-Party Assessment**: Track third-party risks and compliance assessments
- **TPRM Decisions**: Document approval/rejection decisions with business justification
- **Risk Register**: Maintain a register of third-party risks

### Multi-Tenant Architecture

- Organization-scoped data isolation
- Tenant middleware for automatic request routing
- All models respect organization boundaries

### Asset Management

- Classify and track IS(Information Security) assets
- Link assets to risks and controls
- Track asset ownership (legal and technical)

## Authentication

Auth uses JWT access tokens (in memory) + refresh token stored in HttpOnly cookie.

**Login endpoint:**

```
POST /api/auth/login/
```

**Refresh endpoint:**

```
POST /api/auth/refresh/
```

**Profile endpoint:**

```
GET /api/auth/me/
```

**Change password:**

```
POST /api/auth/change-password/
```

Frontend keeps auth state in: `src/store/authStore.ts`

Logout clears local state + cookie.

## Seeding Critical Data

### ISO Standards Library

**ISO 27001 Clauses** (114 clauses)

```bash
python manage.py seed_iso27001_clauses_global
```

**ISO 7101 Clauses** (34 clauses)

```bash
python manage.py seed_iso7101
```

**ISO 42001 Support**
Database structure supports ISO 42001, additional seeder can be added as needed.

### Utility Management Commands

```bash
python manage.py create_roles              # Create default organization roles
python manage.py create_user_profiles      # Create user profile records
python manage.py seed_demo                 # Load demo data (for development)
python manage.py fix_short_descriptions    # Fix control descriptions
python manage.py import_27001              # Import ISO 27001 data
```

### Demo Data Handling

The platform currently loads demo data for development:

- Fake notifications
- Example organizations
- Example risks, audits, and compliance records
- Example users (via seeders)

**Before Production Release:**

You must:

1. Drop or sanitize fake records
2. Rerun only the ISO standards seed commands
3. Create a real admin user manually
4. Upload no dummy evidence files

## Environment Variables

### Backend (backend/config/settings.py)

- `DEBUG`: Set to `False` for production
- `SECRET_KEY`: Django secret key
- Database credentials (if using external PostgreSQL)

### Frontend (frontend/.env.local)

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

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
