from django.core.management.base import BaseCommand
from api.models import ComplianceClause

ISO_7101_CLAUSES = [
    ("4.1", "Identified the external and internal issues that affect the organization and the healthcare quality management system."),
    ("4.2", "Clear understanding of the needs and expectations of interested parties."),
    ("4.3", "The scope of the management system for quality is clearly determined."),
    ("4.4", "The MS (management system) for quality is built and maintained in its entirety."),
    ("5.1", "Ensuring that the MS for quality supports continual improvement."),
    ("5.2", "The documented Healthcare Quality Policy containing the healthcare objectives is relevant to the organization."),
    ("5.3", "Responsibilities and levels of authority for individuals responsible for the HQMS must be understood."),
    ("5.4", "Service user focus — Has management ensured service users' rights are clearly known?"),
    ("5.5", "The healthcare organization ensures access to care in accordance with its defined mandate and applicable laws and regulations."),
    ("6.1", "Actions to address risks and opportunities (includes: documenting risks and opportunities from context & interested parties, shared risk culture, and documented system to identify risks/opportunities)."),
    ("6.2", "The healthcare quality objectives and plans to achieve them."),
    ("6.3", "Changes to the HQMS are determined and managed in a planned manner."),
    ("7.1", "The organization has determined and provided the resources (people, budget, infrastructure) required for the HQMS."),
    ("7.2", "Individuals are competent, and records are kept as evidence."),
    ("7.3", "Individuals are aware of the HQMS, the objectives applicable to their roles, and their contribution to the HQMS."),
    ("7.4", "The organization must determine what to communicate about the HQMS internally and externally."),
    ("7.5", "Documented information: consideration of level of documentation, creation/updating, controls (title/date/author/ref), protection of information systems, electronic info control, and definition of clinical vs non-clinical records."),
    ("8.1", "Maintain processes to run the HQMS and implement actions identified in Clause 6."),
    ("8.2", "Healthcare facilities management and maintenance; contingencies for facilities and services; proper use and safety of equipment."),
    ("8.3", "Waste management, waste reduction planning, and environmental responsibility."),
    ("8.4", "Responsible handling and storage of materials."),
    ("8.5", "Service user belongings (processes to manage/return items)."),
    ("8.6", "Consideration and safe adoption of emerging technologies."),
    ("8.7", "Service design taking a user-centric approach."),
    ("8.8", "Ensure that clinical and non-clinical externally provided products and services conform to organizational requirements."),
    ("8.9", "Provision of services (delivery and management of services)."),
    ("8.10", "People-centred care: inclusivity, diversity, health literacy, service user experience and assessment, compassionate care, cultural competence training, health literacy for workforce/service users, co-production, and workforce wellbeing."),
    ("8.11", "Healthcare is delivered ethically, respectfully, and in accordance with professional standards."),
    ("8.12", "Patient safety cluster (patient safety culture; identification processes; medication management; surgical safety; IPC program; prevention of falls, pressure ulcers, thromboembolism; diagnostic safety; blood transfusion safety)."),
    ("9.1", "Monitoring, measurement, analysis and evaluation of the HQMS, including healthcare quality indicators, methods, and use of results to inform strategic quality directions."),
    ("9.2", "Internal audit and internal audit programme to verify conformity and performance of the HQMS."),
    ("9.3", "Management review (inputs, outputs and use of results to drive improvement)."),
    ("10.1", "Continual improvement of the HQMS."),
    ("10.2", "Nonconformity & corrective action and management of nonconformity and corrective action.")
]

class Command(BaseCommand):
    help = 'Seeds the ISO 7101 compliance clauses (deletes existing fake data first)'

    def handle(self, *args, **kwargs):
        # Clear existing clauses
        ComplianceClause.objects.all().delete()
        self.stdout.write('Cleared existing compliance clauses')

        # Create the real ISO 7101 clauses
        for clause_number, description in ISO_7101_CLAUSES:
            ComplianceClause.objects.create(
                clause_number=clause_number,
                description=description,
                status="NI",  # Start all as Not Implemented
                short_description=description[:100] + ('...' if len(description) > 100 else '')
            )
        
        self.stdout.write(self.style.SUCCESS(f'✅ Successfully created {len(ISO_7101_CLAUSES)} ISO 7101 clauses'))