AfyaNumeriq – Healthcare GRC Platform- Frontend (MVP)

AfyaNumeriq is a Governance, Risk, and Compliance (GRC) platform designed to support healthcare organizations in implementing and internally auditing ISO 7101:2023 – Healthcare Quality Management Systems.

The platform helps healthcare organizations of whatever size and maturity level manage risks, track compliance, and conduct internal audits in a structured, visual, and digital way — ensuring continual improvement and adherence to international healthcare quality standards.The platform aims to provide real-time visibility into quality, compliance, and risk metrics for healthcare organizations.

FEATURES
Interactive Dashboard: Displays compliance score, total risks, audits, and reminders.

Modular Pages: Dedicated sections for Risk, Compliance, Audit, Reports, and Settings.

Dynamic Sidebar Navigation: Clean teal-themed sidebar with active link highlighting and hover effects.

Notifications System: Bell icon in the header for alerts.

Responsive Design: Works seamlessly across devices.

State Management: Powered by Zustand (useAfyaStore.ts).

Clean UI Components: Reusable Button and Card components with consistent styling (not for all the buttons thought at the time of writing this document-October 7th, 2025).

TECH STACK
Next.js 15 (Turbopack)
React 19
TypeScript 5
Tailwind CSS 3
Zustand 5
Lucide React Icons

Project Structure
src/
├── app/
│ ├── audit/
│ ├── compliance/
│ ├── risk/
│ ├── reports/
│ ├── settings/
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
├── components/
│ ├── Notifications.tsx
│ ├── sidebar.tsx
│ ├── Topbar.tsx
│ └── ui/
│ ├── button.tsx
│ └── card.tsx
├── lib/
│ └── utils.ts
└── store/
└── useAfyaStore.ts

UI GUIDELINES
Primary Color: Teal (#0d9488)
Accent Color: Deep Teal (#115e59)
Font: Inter
Buttons: Consistent teal theme with hover and focus states (NOT ALL of them as at 07/10/2025).
Cards: Light background, rounded corners, subtle shadows.
Layout: Sidebar on left, dashboard content on right.

Setup and Run

# Install dependencies

npm install

# Run development server

npm run dev
Then open http://localhost:3000

BACKEND CONNECTION

1. Update your .env.local with the backend API base URL:
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   2.Use Axios or Fetch to connect endpoints (e.g., risk, compliance).
2. Ensure backend is running before fetching live data.

NEXT STEPS
Integrate backend API endpoints.
Add role-based access control.
Implement real-time data refresh via WebSockets.
Enhance charts with dynamic data.

Contributors

Frontend Development: Steve Wakhungu

Backend Development: Fehn Nyabuto

Design & Architecture: Joint collaboration under Nzasi Ventures Limited

License

© 2025 AfyaNumeriq. All rights reserved.
Unauthorized reproduction or distribution of this software or its code is prohibited.
