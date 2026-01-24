from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import ComplianceClause

"""
ISO 7101:2023 — AfyaNumeriq Canonical Interpretation

This seeder represents a practitioner-oriented, merged interpretation
of ISO 7101 designed for operational healthcare use.

Intentional merges for clarity and usability:
- Clause 7.4 + 7.5 merged
- Clause 8.2, 8.3, and 8.10 merged
- Clause 8.12 (patient safety cluster) merged from 9 subclauses
- Clause 9.1, 9.2, 9.3 merged
- Clause 10.2 merged into corrective action lifecycle

This is a deliberate product decision.
"""

STANDARD = "iso-7101"

ISO_7101_CLAUSES = [
    # --- 4 Context (4) ---
    ("4.1", "External and internal factors affecting the HQMS are identified and reviewed."),
    ("4.2", "Needs of relevant interested parties are clearly understood and documented."),
    ("4.3", "The scope of the healthcare quality management system is defined."),
    ("4.4", "The HQMS is established, implemented, maintained, and continually improved."),

    # --- 5 Leadership (5) ---
    ("5.1", "Leadership ensures the HQMS supports continual improvement and quality outcomes."),
    ("5.2", "A documented healthcare quality policy is approved, communicated, and maintained."),
    ("5.3", "Responsibilities and authorities for HQMS roles are assigned and understood."),
    ("5.4", "Service user needs and rights are prioritized and communicated across the organization."),
    ("5.5", "Access to healthcare services is ensured in line with laws and organizational mandate."),

    # --- 6 Planning (3) ---
    ("6.1", "Risks and opportunities are identified, evaluated, and actions are planned."),
    ("6.2", "Healthcare quality objectives are established and supported by measurable plans."),
    ("6.3", "Changes to the HQMS are controlled, documented, and implemented in a planned manner."),

    # --- 7 Support (5) ---
    ("7.1", "Adequate resources (people, infrastructure, budget) are provided for the HQMS."),
    ("7.2", "Personnel are competent and records of competence are maintained."),
    ("7.3", "Staff understand the HQMS, their roles, and contribution to quality outcomes."),
    ("7.4", "Internal and external HQMS communication and documented information are defined, controlled, and secured."),
    ("7.5", "Information systems and clinical and non-clinical records are protected, controlled, and accessible."),

    # --- 8 Operation (12) ---
    ("8.1", "Operational processes are planned, implemented, and controlled to achieve HQMS goals."),
    ("8.2", "Facilities, equipment, infrastructure, and environmental responsibilities are managed safely and effectively."),
    ("8.3", "Materials, waste, and service user belongings are handled and managed responsibly."),
    ("8.4", "Materials are handled and stored safely to prevent harm or loss."),
    ("8.5", "Service user belongings are documented, protected, and returned appropriately."),
    ("8.6", "New and emerging healthcare technologies are evaluated and safely adopted."),
    ("8.7", "Services are designed and delivered with a user-centered approach."),
    ("8.8", "Externally provided clinical and non-clinical services meet defined requirements."),
    ("8.9", "Healthcare services are delivered, monitored, and managed under controlled conditions."),
    ("8.10", "Care is people-centered, inclusive, culturally competent, and supports workforce wellbeing."),
    ("8.11", "Healthcare is delivered ethically, respectfully, and in accordance with professional standards."),
    ("8.12", "Patient safety systems prevent harm and support safe clinical practice across all care processes."),

    # --- 9 Performance Evaluation (3) ---
    ("9.1", "HQMS performance is monitored, measured, analyzed, and used for improvement."),
    ("9.2", "Internal audits are planned and conducted to verify HQMS effectiveness."),
    ("9.3", "Management reviews evaluate HQMS performance and drive improvement actions."),

    # --- 10 Improvement (2) ---
    ("10.1", "The organization continually improves the suitability and effectiveness of the HQMS."),
    ("10.2", "Nonconformities are corrected and root causes addressed through corrective actions."),
]


class Command(BaseCommand):
    help = "Seeds ISO 7101:2023 (AfyaNumeriq canonical 34-clause interpretation)"

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            ComplianceClause.objects.filter(standard=STANDARD).delete()

            objs = [
                ComplianceClause(
                    standard=STANDARD,
                    clause_number=num,
                    description=text,
                    short_description=text,
                    status="NI",
                    owner="Unassigned",
                )
                for num, text in ISO_7101_CLAUSES
            ]

            ComplianceClause.objects.bulk_create(objs)

        self.stdout.write(
            self.style.SUCCESS(f"✅ Seeded {len(objs)} ISO 7101 clauses (canonical)")
        )
