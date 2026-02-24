from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.apps import apps


ISO_7101_CLAUSES = [
    ("4.1", "External and internal issues affecting the HQMS are identified and reviewed."),
    ("4.2", "Needs and expectations of relevant interested parties are understood and documented."),
    ("4.3", "The scope of the healthcare quality management system is defined."),
    ("4.4", "The HQMS is established, implemented, maintained, and continually improved."),
    ("5.1", "Leadership ensures the HQMS supports continual improvement and quality outcomes."),
    ("5.2", "The healthcare quality policy is established, approved, and communicated."),
    ("5.3", "Roles, responsibilities, and authorities for the HQMS are assigned and understood."),
    ("5.4", "Service user focus is ensured and service user rights are respected."),
    ("5.5", "Access to care is ensured in accordance with legal and organizational requirements."),
    ("6.1", "Risks and opportunities affecting the HQMS are identified and managed."),
    ("6.2", "Healthcare quality objectives are established and plans to achieve them are defined."),
    ("6.3", "Changes to the HQMS are planned and managed systematically."),
    ("7.1", "Resources required for the HQMS are determined and provided."),
    ("7.2", "Personnel are competent and competence records are maintained."),
    ("7.3", "Personnel are aware of the HQMS and their contribution to quality objectives."),
    ("7.4", "Internal and external communication relevant to the HQMS is defined and managed."),
    ("7.5", "Documented information is created, controlled, protected, and maintained."),
    ("8.1", "Operational planning and control of HQMS processes are maintained."),
    ("8.2", "Healthcare facilities, equipment, and infrastructure are safely managed."),
    ("8.3", "Waste management and environmental responsibilities are controlled."),
    ("8.4", "Materials are handled, stored, and managed responsibly."),
    ("8.5", "Service user belongings are safeguarded and properly managed."),
    ("8.6", "Emerging technologies are evaluated and adopted safely."),
    ("8.7", "Healthcare services are designed using a service-user-centred approach."),
    ("8.8", "Externally provided products and services conform to requirements."),
    ("8.9", "Provision of healthcare services is controlled and effectively managed."),
    ("8.10", "People-centred care, inclusivity, health literacy, and workforce wellbeing are ensured."),
    ("8.11", "Healthcare services are delivered ethically and competently."),
    ("8.12", "Patient safety systems are implemented, monitored, and improved."),
    ("9.1", "HQMS performance is monitored, measured, analysed, and evaluated."),
    ("9.2", "Internal audits are conducted to verify HQMS conformity and effectiveness."),
    ("9.3", "Management reviews assess HQMS performance and drive improvement."),
    ("10.1", "Continual improvement of the HQMS is actively pursued."),
    ("10.2", "Nonconformities are addressed and corrective actions are implemented."),
]


def split_clause(code: str):
    major, minor = code.split(".")
    return int(major), int(minor)


class Command(BaseCommand):
    help = "Seed ISO 7101 clauses for a specific organization (tenant) - idempotent."

    def add_arguments(self, parser):
        parser.add_argument("--slug", required=True, help="Organization slug e.g. demo")
        parser.add_argument("--update-existing", action="store_true")
        parser.add_argument("--dry-run", action="store_true")

    @transaction.atomic
    def handle(self, *args, **opts):
        Organization = apps.get_model("api", "Organization")
        ComplianceClause = apps.get_model("api", "ComplianceClause")

        slug = opts["slug"].strip()
        update_existing = opts["update_existing"]
        dry_run = opts["dry_run"]

        org = Organization.objects.filter(slug=slug).first()
        if not org:
            raise CommandError(f"Organization with slug='{slug}' not found.")

        created_count = 0
        updated_count = 0

        for clause_number, short_desc in ISO_7101_CLAUSES:
            major, minor = split_clause(clause_number)

            defaults = {
                "standard": "iso-7101",
                "clause_number": clause_number,
                "clause_major": major,
                "clause_minor": minor,
                "short_description": short_desc,
                "description": short_desc,  # keep same for MVP; can expand later
            }

            obj, created = ComplianceClause.objects.get_or_create(
                organization=org,
                standard="iso-7101",
                clause_number=clause_number,
                defaults=defaults,
            )

            if created:
                created_count += 1
                if dry_run:
                    self.stdout.write(f"[DRY RUN] Would create ISO 7101 {clause_number} for '{slug}'")
            else:
                if update_existing:
                    changed = False
                    if obj.short_description != short_desc:
                        obj.short_description = short_desc
                        changed = True
                    if obj.description != short_desc:
                        obj.description = short_desc
                        changed = True
                    if obj.clause_major != major:
                        obj.clause_major = major
                        changed = True
                    if obj.clause_minor != minor:
                        obj.clause_minor = minor
                        changed = True
                    if obj.standard != "iso-7101":
                        obj.standard = "iso-7101"
                        changed = True

                    if changed:
                        updated_count += 1
                        if dry_run:
                            self.stdout.write(f"[DRY RUN] Would update ISO 7101 {clause_number} for '{slug}'")
                        else:
                            obj.save()

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN: no database writes performed."))

        self.stdout.write(self.style.SUCCESS(f"✅ ISO 7101 seed complete for '{slug}'"))
        self.stdout.write(f"Created={created_count}, Updated={updated_count}")
