🩺 AfyaNumeriq – Healthcare GRC Platform

AfyaNumeriq is a Governance, Risk, and Compliance (GRC) platform designed to support healthcare organizations in implementing and internally auditing ISO 7101:2023 – Healthcare Quality Management Systems.

The platform helps hospitals and clinics manage risks, track compliance, and conduct internal audits in a structured, visual, and digital way — ensuring continual improvement and adherence to international healthcare quality standards.

🚀 Current Project Status (Frontend MVP)

This repository contains the frontend of the AfyaNumeriq platform, built using modern web technologies to deliver a clean, responsive, and scalable user experience.

✅ Completed Features
1. Home Dashboard

Displays summary widgets for:

Risk Register (open vs closed)

Compliance Maturity (visual donut chart)

Upcoming audits & reminders

Dynamic layout powered by Recharts and Tailwind CSS

2. Risk Register

Full-featured risk table with the following fields:

Risk ID, Description, Likelihood, Impact, Risk Score, Risk Level, Existing Controls, Treatment Actions, Owner, Status, Review Date

Add and update risks dynamically

Color-coded status indicators (Open, Mitigated, Closed) THIS WILL AND SHOULD CHANGE!

Backend-ready for future persistence

3. Compliance Tracker (ISO 7101:2023)

Includes all 34 clauses and subclauses of ISO 7101:2023

Clause-by-clause compliance gauging:

Status options: NI, P, IP, MI, O

Evidence upload field

Bottom legend explains the meaning of each status (NI → O)

Structured for future database linkage

4. Internal Audit Module

/audit → Schedule, update, and track internal audits

/audit/findings → Record and follow up on audit findings

Status tracking for completed and pending audits

Future integration planned for CAPA (Corrective and Preventive Actions)

5. Reports Dashboard

Summary view for:

Risk status distribution

Compliance scores

Audit performance overview

Will pull real-time metrics once backend integration is complete

6. Settings

Placeholder for:

User management

System settings

Role-based permissions (to be added later)

🧠 Architecture Overview

Tech Stack:

Next.js 15
 (React-based full-stack framework)

TypeScript
 (typed JavaScript)

Tailwind CSS
 (utility-first styling)

Zustand
 (state management)

Recharts
 (data visualization)

Folder Structure:

frontend/
├── src/
│   ├── app/
│   │   ├── audit/
│   │   │   ├── findings/page.tsx
│   │   │   └── page.tsx
│   │   ├── compliance/page.tsx
│   │   ├── risk/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── sidebar.tsx
│   │   └── ui/button.tsx
│   └── store/useAfyaStore.ts

🔄 Integration Plan (Frontend ⇄ Backend)

The backend will be implemented using Django REST Framework (DRF).

Expected API endpoints:

Feature	Endpoint	Methods
Risk Register	/api/risks/	GET, POST, PUT, DELETE
Compliance Tracker	/api/compliance/	GET, POST, PUT
Internal Audits	/api/audits/	GET, POST, PUT
Audit Findings	/api/findings/	GET, POST, PUT

Frontend Integration Steps (once backend is ready):

Add .env.local file:

NEXT_PUBLIC_API_URL=http://localhost:8000/api


Replace the seeded data in useAfyaStore.ts with live data fetched from the API:

useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/risks/`)
    .then(res => res.json())
    .then(data => set({ risks: data }));
}, []);


Apply similar logic for compliance, audits, and findings.

🧩 State Management Overview

The Zustand store (src/store/useAfyaStore.ts) maintains the following global state:

{
  risks: [],
  audits: [],
  findings: [],
  complianceRecords: [],
  addRisk(), updateRiskStatus(),
  addAudit(), updateAuditStatus(),
  addFinding(), updateFindingStatus(),
  addCompliance(), updateComplianceStatus()
}


It acts as the single source of truth for all pages.
Once the backend is connected, this store will hydrate its state from the REST API.

🧭 Next Steps (for Fehn)

Set up Django REST Framework with models corresponding to:

Risk

Compliance (ISO 7101 clauses)

Audit

AuditFinding

Create serializers and CRUD API endpoints for each.

Enable CORS for Next.js frontend (via django-cors-headers).

Test data exchange using fetch requests or Postman.

Provide endpoint URLs to integrate into the Zustand store.

🧾 Contributors

Frontend Development: Steve Wakhungu

Backend Development: Fehn Nyabuto

Design & Architecture: Joint collaboration under Nzasi Ventures Limited

📜 License

© 2025 AfyaNumeriq LLC. All rights reserved.
Unauthorized reproduction or distribution of this software or its code is prohibited.