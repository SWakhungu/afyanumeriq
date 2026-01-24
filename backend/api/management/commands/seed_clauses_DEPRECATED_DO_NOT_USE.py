from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import ComplianceClause

# Full official text (verbatim) + Short (Tone B)
CLAUSES = [
    # --- 4 Context (4) ---
    ("4.1",
     "Identified the external and internal issues that affect the organization and the healthcare quality management system.",
     "External and internal factors affecting the HQMS are identified and reviewed."),
    ("4.2",
     "Clear understanding of the needs and expectations of interested parties.",
     "Needs of relevant interested parties are clearly understood and documented."),
    ("4.3",
     "The scope of the management system for quality is clearly determined.",
     "The scope of the healthcare quality management system is defined."),
    ("4.4",
     "The MS (management system) for quality is built and maintained in its entirety.",
     "The HQMS is established, implemented, maintained, and continually improved."),

    # --- 5 Leadership (5) ---
    ("5.1",
     "Ensuring that the MS for quality supports continual improvement.",
     "Leadership ensures the HQMS supports continual improvement and quality outcomes."),
    ("5.2",
     "The documented Healthcare Quality Policy containing the healthcare objectives is relevant to the organization.",
     "A documented healthcare quality policy is approved, communicated, and maintained."),
    ("5.3",
     "Responsibilities and levels of authority for individuals responsible for the HQMS must be understood.",
     "Responsibilities and authorities for HQMS roles are assigned and understood."),
    ("5.4",
     "Service user focus — Has management ensured service users' rights are clearly known?",
     "Service user needs and rights are prioritized and communicated across the organization."),
    ("5.5",
     "The healthcare organization ensures access to care in accordance with its defined mandate and applicable laws and regulations.",
     "Access to healthcare services is ensured in line with laws and organizational mandate."),

    # --- 6 Planning (3) ---
    ("6.1",
     "Actions to address risks and opportunities (includes: documenting risks and opportunities from context & interested parties, shared risk culture, and documented system to identify risks/opportunities).",
     "Risks and opportunities are identified, evaluated, and actions are planned."),
    ("6.2",
     "The healthcare quality objectives and plans to achieve them.",
     "Healthcare quality objectives are established and supported by measurable plans."),
    ("6.3",
     "Changes to the HQMS are determined and managed in a planned manner.",
     "Changes to the HQMS are controlled, documented, and implemented in a planned manner."),

    # --- 7 Support (5) ---
    ("7.1",
     "The organization has determined and provided the resources (people, budget, infrastructure) required for the HQMS.",
     "Adequate resources (people, infrastructure, budget) are provided for the HQMS."),
    ("7.2",
     "Individuals are competent, and records are kept as evidence.",
     "Personnel are competent and records of competence are maintained."),
    ("7.3",
     "Individuals are aware of the HQMS, the objectives applicable to their roles, and their contribution to the HQMS.",
     "Staff understand the HQMS, their roles, and contribution to quality outcomes."),
    ("7.4",
     "The organization must determine what to communicate about the HQMS internally and externally.",
     "Internal and external HQMS communication is defined and managed."),
    ("7.5",
     "Documented information: consideration of level of documentation, creation/updating, controls (title/date/author/ref), protection of information systems, electronic info control, and definition of clinical vs non-clinical records.",
     "Documented information is controlled, secured, and available where needed."),

    # --- 8 Operation (12) ---
    ("8.1",
     "Maintain processes to run the HQMS and implement actions identified in Clause 6.",
     "Operational processes are planned, implemented, and controlled to achieve HQMS goals."),
    ("8.2",
     "Healthcare facilities management and maintenance; contingencies for facilities and services; proper use and safety of equipment.",
     "Facilities, equipment, and infrastructure are maintained and safe for use."),
    ("8.3",
     "Waste management, waste reduction planning, and environmental responsibility.",
     "Waste is managed responsibly with environmental considerations."),
    ("8.4",
     "Responsible handling and storage of materials.",
     "Materials are handled and stored safely to prevent harm or loss."),
    ("8.5",
     "Service user belongings (processes to manage/return items).",
     "Service user belongings are documented, protected, and returned appropriately."),
    ("8.6",
     "Consideration and safe adoption of emerging technologies.",
     "New and emerging healthcare technologies are evaluated and safely adopted."),
    ("8.7",
     "Service design taking a user-centric approach.",
     "Services are designed and delivered with a user-centered approach."),
    ("8.8",
     "Ensure that clinical and non-clinical externally provided products and services conform to organizational requirements.",
     "Externally provided clinical and non-clinical services meet defined requirements."),
    ("8.9",
     "Provision of services (delivery and management of services).",
     "Healthcare services are delivered, monitored, and managed under controlled conditions."),
    ("8.10",
     "People-centred care: inclusivity, diversity, health literacy, service user experience and assessment, compassionate care, cultural competence training, health literacy for workforce/service users, co-production, and workforce wellbeing.",
     "Care is people-centered, inclusive, culturally competent, and supports workforce wellbeing."),
    ("8.11",
     "Healthcare is delivered ethically, respectfully, and in accordance with professional standards.",
     "Healthcare is delivered ethically, respectfully, and in accordance with professional standards."),
    ("8.12",
     "Patient safety cluster (patient safety culture; identification processes; medication management; surgical safety; IPC program; prevention of falls, pressure ulcers, thromboembolism; diagnostic safety; blood transfusion safety).",
     "Patient safety systems prevent harm and support safe clinical practice."),

    # --- 9 Performance Evaluation (3) ---
    ("9.1",
     "Monitoring, measurement, analysis and evaluation of the HQMS, including healthcare quality indicators, methods, and use of results to inform strategic quality directions.",
     "HQMS performance is monitored, measured, analyzed, and used for improvement."),
    ("9.2",
     "Internal audit and internal audit programme to verify conformity and performance of the HQMS.",
     "Internal audits are planned and conducted to verify HQMS effectiveness."),
    ("9.3",
     "Management review (inputs, outputs and use of results to drive improvement).",
     "Management reviews evaluate HQMS performance and drive improvement actions."),

    # --- 10 Improvement (2) ---
    ("10.1",
     "Continual improvement of the HQMS.",
     "The organization continually improves the suitability and effectiveness of the HQMS."),
    ("10.2",
     "Nonconformity & corrective action and management of nonconformity and corrective action.",
     "Nonconformities are corrected and root causes addressed through corrective action."),
]


class Command(BaseCommand):
    help = "Wipe ALL compliance clauses and seed the official 34 ISO 7101:2023 clauses (full + short text)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Skip confirmation prompt.",
        )

    def handle(self, *args, **options):
        force = options.get("force", False)

        if not force:
            confirm = input(
                "This will DELETE ALL existing ComplianceClause records and seed the official 34. Continue? (y/N): "
            ).strip().lower()
            if confirm not in ("y", "yes"):
                self.stdout.write(self.style.WARNING("Aborted. No changes made."))
                return

        with transaction.atomic():
            ComplianceClause.objects.all().delete()

            objs = []
            for num, full, short in CLAUSES:
                objs.append(
                    ComplianceClause(
                        clause_number=num,
                        description=full,           # full official text (verbatim)
                        short_description=short,    # UI-friendly short
                        status="NI",
                        owner="Unassigned",
                        comments="",
                        evidence=None,
                    )
                )
            ComplianceClause.objects.bulk_create(objs, batch_size=100)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(CLAUSES)} official clauses. ✅"))
