# backend/api/management/commands/seed_demo.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction

from api.models import Organization, UserProfile, ComplianceClause, Risk, Audit, Finding
from api.isms_models import Clause, Control, Asset, ISORisk, SoAEntry


class Command(BaseCommand):
    help = "Seed a deterministic multi-tenant demo dataset."

    def add_arguments(self, parser):
        parser.add_argument("--slug", default="demo", help="Organization slug (tenant key)")
        parser.add_argument("--org-name", default="Demo Org", help="Organization name")
        parser.add_argument("--admin-username", default="demo_admin", help="Admin username")
        parser.add_argument("--admin-password", default="demoPass123!", help="Admin password")
        parser.add_argument("--admin-email", default="demo@afyanumeriq.local", help="Admin email")
        parser.add_argument("--reset", action="store_true", help="Wipe existing demo tenant data for this slug before seeding")

    @transaction.atomic
    def handle(self, *args, **opts):
        slug = opts["slug"].strip().lower()
        org_name = opts["org_name"]
        admin_username = opts["admin_username"]
        admin_password = opts["admin_password"]
        admin_email = opts["admin_email"]
        reset = bool(opts["reset"])

        org, created = Organization.objects.get_or_create(
            slug=slug,
            defaults={"name": org_name},
        )
        if not created and org.name != org_name:
            org.name = org_name
            org.save(update_fields=["name"])

        if reset:
            self._wipe_tenant(org)

        # ---- User + Profile (Admin) ----
        user, u_created = User.objects.get_or_create(
            username=admin_username,
            defaults={"email": admin_email, "is_staff": True, "is_superuser": True},
        )
        if u_created:
            user.set_password(admin_password)
            user.save()
        else:
            # keep user, ensure admin flags + password
            if not user.is_staff or not user.is_superuser:
                user.is_staff = True
                user.is_superuser = True
            if admin_email and user.email != admin_email:
                user.email = admin_email
            user.set_password(admin_password)
            user.save()

        UserProfile.objects.update_or_create(
            user=user,
            defaults={"organization": org, "role": "admin"},
        )

        # ---- Global definitions: ISO 27001 Clause + Control ----
        # Deterministic, minimal set
        clauses = [
            ("4.1", "Understanding the organization and its context", "The organization shall determine external and internal issues..."),
            ("5.1", "Leadership and commitment", "Top management shall demonstrate leadership and commitment..."),
            ("6.1", "Actions to address risks and opportunities", "The organization shall plan actions..."),
        ]
        for code, title, text in clauses:
            Clause.objects.get_or_create(
                code=code,
                standard="iso-27001",
                defaults={"title": title, "text": text},
            )

        controls = [
            ("A.5.1", "Policies for information security", "A set of policies for information security shall be defined..."),
            ("A.5.7", "Threat intelligence", "Information relating to information security threats shall be collected..."),
            ("A.6.3", "Information security awareness, education and training", "Personnel shall receive appropriate awareness..."),
            ("A.8.9", "Configuration management", "Configurations shall be managed..."),
            ("A.8.12", "Data leakage prevention", "Data leakage shall be prevented..."),
            ("A.8.16", "Monitoring activities", "Networks, systems and applications shall be monitored..."),
        ]
        control_objs = []
        for code, title, desc in controls:
            c, _ = Control.objects.get_or_create(
                code=code,
                standard="iso-27001",
                defaults={"title": title, "description": desc, "group": "Demo"},
            )
            control_objs.append(c)

        # ---- Tenant data: ISO 27001 Assets ----
        assets = [
            ("Customer DB", "Database", "confidential", "high"),
            ("Web App", "Application", "internal", "high"),
            ("Employee Laptops", "Endpoint", "restricted", "medium"),
            ("Cloud Storage", "Service", "confidential", "high"),
        ]

        asset_objs = []
        for name, asset_type, classification, value in assets:
            a = Asset.objects.create(
                organization=org,
                name=name,
                asset_type=asset_type,
                classification=classification,
                value=value,
                standard="iso-27001",
            )
            asset_objs.append(a)

        # ---- Tenant data: ISO 27001 Risks ----
        risks = [
            ("Unauthorized database access", asset_objs[0], 4, 4, "Reduce", "Open"),
            ("Web app vulnerability exploitation", asset_objs[1], 4, 3, "Reduce", "Open"),
            ("Loss/theft of endpoints", asset_objs[2], 3, 4, "Reduce", "Open"),
            ("Misconfigured cloud storage exposure", asset_objs[3], 4, 4, "Reduce", "Open"),
        ]

        risk_objs = []
        for title, asset, likelihood, impact, treatment, status in risks:
            r = ISORisk.objects.create(
                organization=org,
                title=title,
                asset=asset,
                likelihood=likelihood,
                impact=impact,
                treatment=treatment,
                status=status,
                owner="Demo Owner",
                standard="iso-27001",
            )
            risk_objs.append(r)

        # Link controls to risks (M2M) – deterministic mapping
        # First 2 risks get more controls; last 2 get fewer
        risk_objs[0].controls.set(control_objs[:4])
        risk_objs[1].controls.set(control_objs[2:])
        risk_objs[2].controls.set(control_objs[1:4])
        risk_objs[3].controls.set(control_objs[:2])

        # ---- Tenant data: ISO 27001 SoA ----
        # Create SoA entries per tenant per control
        # Mark applicable if referenced by any risk controls; otherwise not applicable
        used_control_ids = set(
            ISORisk.controls.through.objects.filter(isorisk__in=risk_objs).values_list("control_id", flat=True)
        )

        for c in control_objs:
            SoAEntry.objects.get_or_create(
                organization=org,
                control=c,
                standard="iso-27001",
                defaults={
                    "applicable": c.id in used_control_ids,
                    "justification": "Required for demo scope" if c.id in used_control_ids else "Not applicable to demo scope",
                    "status": "Partial" if c.id in used_control_ids else "Not Implemented",
                    "evidence_notes": "Demo evidence placeholder",
                },
            )

        # ---- Tenant data: ISO 7101 Compliance (tenant-scoped ComplianceClause) ----
        # Keep it simple: a few clauses with statuses
        clauses_7101 = [
            ("4.1", "Organization context is documented and reviewed.", "IP"),
            ("5.1", "Leadership commitment is evidenced by governance structures.", "MI"),
            ("6.2", "Quality objectives are defined and tracked.", "P"),
            ("8.5", "Service delivery processes are controlled and monitored.", "NI"),
        ]
        for clause_number, desc, status in clauses_7101:
            ComplianceClause.objects.create(
                organization=org,
                standard="iso-7101",
                clause_number=clause_number,
                short_description=desc,
                description=desc,
                status=status,
                owner="Demo Owner",
                comments="Seeded for demo.",
            )

        # ---- Tenant data: ISO 7101 Risk Register (tenant-scoped Risk) ----
        risks_7101 = [
            ("RSK-0001", "Clinical process variance causing quality incidents", "Medium"),
            ("RSK-0002", "Supplier delays impacting service continuity", "Low"),
            ("RSK-0003", "Inadequate training leading to compliance gaps", "Medium"),
        ]
        today = timezone.now().date()
        for rid, desc, level in risks_7101:
            Risk.objects.create(
                organization=org,
                risk_id=rid,
                description=desc,
                likelihood="Medium",
                impact="Medium",
                risk_score=9.0,
                risk_level=level,
                existing_control="Existing SOPs",
                treatment_action="Improve monitoring and training",
                owner="Demo Owner",
                status="Open",
                review_date=today,
                archived=False,
            )

        # ---- Tenant data: Audit + Findings (tenant-scoped via Audit) ----
        audit = Audit.objects.create(
            organization=org,
            audit_id="AUD-0001",
            audit_name="ISO Demo Internal Audit",
            objective="Validate demo controls and evidence flow",
            scope="ISO 27001 + ISO 7101 demo scope",
            date=today,
            lead_auditor="Demo Auditor",
            participants="Demo Owner",
            standard="iso-27001",
            status="Scheduled",
        )

        # Tie a finding to a Clause and some Controls
        demo_clause = Clause.objects.filter(standard="iso-27001").order_by("code").first()
        finding = Finding.objects.create(
            audit=audit,
            finding_id="FND-0001",
            description="Evidence notes incomplete for selected controls.",
            clause=demo_clause,
            severity="Medium",
            corrective_action="Collect evidence and update SoA entries.",
            status="Open",
            target_date=today,
        )
        finding.controls.set(control_objs[:2])

        self.stdout.write(self.style.SUCCESS("✅ Demo seed complete"))
        self.stdout.write(self.style.SUCCESS(f"Tenant slug: {org.slug}"))
        self.stdout.write(self.style.SUCCESS(f"Admin user: {admin_username} / {admin_password}"))

    def _wipe_tenant(self, org: Organization):
        # Tenant-owned tables (wipe only for this org)
        SoAEntry.objects.filter(organization=org).delete()
        ISORisk.objects.filter(organization=org).delete()
        Asset.objects.filter(organization=org).delete()

        ComplianceClause.objects.filter(organization=org).delete()
        Risk.objects.filter(organization=org).delete()

        # Audits + findings
        Finding.objects.filter(audit__organization=org).delete()
        Audit.objects.filter(organization=org).delete()
