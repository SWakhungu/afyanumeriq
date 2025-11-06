# seed_iso7101.py
from django.core.management.base import BaseCommand
from api.models import ComplianceClause

INITIAL_CLAUSES = [
  {"clause_number": "4.1", "short_description": "External and internal factors affecting the HQMS are identified and reviewed."},
  {"clause_number": "4.2", "short_description": "Needs of relevant interested parties are clearly understood and documented."},
  {"clause_number": "4.3", "short_description": "The scope of the healthcare quality management system is defined."},
  {"clause_number": "4.4", "short_description": "The HQMS is established, implemented, maintained, and continually improved."},

  {"clause_number": "5.1", "short_description": "Leadership ensures the HQMS supports continual improvement and quality outcomes."},
  {"clause_number": "5.2", "short_description": "The documented healthcare quality policy is relevant and communicated."},
  {"clause_number": "5.3", "short_description": "Responsibilities and authorities for the HQMS are assigned and understood."},
  {"clause_number": "5.4", "short_description": "Service user focus is demonstrated and protected."},
  {"clause_number": "5.5", "short_description": "Access to care complies with laws and organizational mandate."},

  {"clause_number": "6.1", "short_description": "Risks and opportunities are identified and managed."},
  {"clause_number": "6.2", "short_description": "Healthcare quality objectives are defined and measurable."},
  {"clause_number": "6.3", "short_description": "Changes to the HQMS are managed in a planned manner."},

  {"clause_number": "7.1", "short_description": "Resources required for the HQMS are determined and provided."},
  {"clause_number": "7.2", "short_description": "Individuals are competent; records of competence are maintained."},
  {"clause_number": "7.3", "short_description": "Individuals are aware of their role in achieving quality objectives."},
  {"clause_number": "7.4", "short_description": "Internal and external communication requirements are defined."},
  {"clause_number": "7.5", "short_description": "Documented information is properly controlled and maintained."},

  {"clause_number": "8.1", "short_description": "HQMS operational planning and control are maintained."},
  {"clause_number": "8.2", "short_description": "Facilities, equipment, and environment are maintained safely."},
  {"clause_number": "8.3", "short_description": "Waste and environmental responsibilities are managed."},
  {"clause_number": "8.4", "short_description": "Materials are handled and stored responsibly."},
  {"clause_number": "8.5", "short_description": "Service user belongings are managed and safeguarded."},
  {"clause_number": "8.6", "short_description": "Emerging technologies are evaluated and adopted safely."},
  {"clause_number": "8.7", "short_description": "Healthcare services are designed with a user-centric approach."},
  {"clause_number": "8.8", "short_description": "Externally provided services conform to organizational requirements."},
  {"clause_number": "8.9", "short_description": "Provision of services is controlled and managed effectively."},
  {"clause_number": "8.10", "short_description": "People-centred care, inclusivity, literacy, and wellbeing are ensured."},
  {"clause_number": "8.11", "short_description": "Healthcare is provided ethically and competently."},
  {"clause_number": "8.12", "short_description": "Patient safety processes are implemented and monitored."},

  {"clause_number": "9.1", "short_description": "Performance of the HQMS is monitored and evaluated."},
  {"clause_number": "9.2", "short_description": "Internal audits verify conformity and effectiveness."},
  {"clause_number": "9.3", "short_description": "Management reviews drive continual improvement."},

  {"clause_number": "10.1", "short_description": "Continual improvement of the HQMS is maintained."},
  {"clause_number": "10.2", "short_description": "Nonconformities are managed and corrective actions are implemented."},
]

class Command(BaseCommand):
    help = "Seeds the ISO 7101 compliance clauses with concise descriptions only"

    def handle(self, *args, **options):
        self.stdout.write("Seeding ISO 7101 clauses...")

        for item in INITIAL_CLAUSES:
            num = item["clause_number"]
            clause, created = ComplianceClause.objects.update_or_create(
                clause_number=num,
                defaults={
                    "short_description": item["short_description"],
                    "description": "",              # clear long text
                    "owner": "Unassigned",
                    "status": "NI",
                    "comments": None,
                },
            )
            self.stdout.write(f'{"Created" if created else "Updated"} clause {num}')

        self.stdout.write(self.style.SUCCESS("Successfully seeded all ISO 7101 clauses"))
