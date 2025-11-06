from django.core.management.base import BaseCommand
from api.models import ComplianceClause

SHORT_DESCRIPTIONS = {
    "4.1": "External and internal factors affecting the HQMS are identified and reviewed.",
    "4.2": "Needs of relevant interested parties are clearly understood and documented.",
    "4.3": "The scope of the healthcare quality management system is defined.",
    "4.4": "The HQMS is established, implemented, maintained, and continually improved.",
    "5.1": "Leadership ensures the HQMS supports continual improvement and quality outcomes.",
    "5.2": "The documented healthcare quality policy is relevant and communicated.",
    "5.3": "Responsibilities and authorities for the HQMS are assigned and understood.",
    "5.4": "Service user focus is demonstrated and protected.",
    "5.5": "Access to care complies with laws and organizational mandate.",
    "6.1": "Risks and opportunities are identified and managed.",
    "6.2": "Healthcare quality objectives are defined and measurable.",
    "6.3": "Changes to the HQMS are managed in a planned manner.",
    "7.1": "Resources required for the HQMS are determined and provided.",
    "7.2": "Individuals are competent; records of competence are maintained.",
    "7.3": "Individuals are aware of their role in achieving quality objectives.",
    "7.4": "Internal and external communication requirements are defined.",
    "7.5": "Documented information is properly controlled and maintained.",
    "8.1": "HQMS operational planning and control are maintained.",
    "8.2": "Facilities, equipment, and environment are maintained safely.",
    "8.3": "Waste and environmental responsibilities are managed.",
    "8.4": "Materials are handled and stored responsibly.",
    "8.5": "Service user belongings are managed and safeguarded.",
    "8.6": "Emerging technologies are evaluated and adopted safely.",
    "8.7": "Healthcare services are designed with a user-centric approach.",
    "8.8": "Externally provided services conform to organizational requirements.",
    "8.9": "Provision of services is controlled and managed effectively.",
    "8.10": "People-centred care, inclusivity, diversity, literacy, and wellbeing are ensured.",
    "8.11": "Healthcare is provided ethically and competently.",
    "8.12": "Patient safety processes are implemented and monitored.",
    "9.1": "Performance of the HQMS is monitored and evaluated.",
    "9.2": "Internal audits verify conformity and effectiveness.",
    "9.3": "Management reviews drive continual improvement.",
    "10.1": "Continual improvement of the HQMS is maintained.",
    "10.2": "Nonconformities are managed and corrective actions are implemented.",
}

class Command(BaseCommand):
    help = "Fixes the short_description field for all ISO 7101 clauses without resetting status/evidence."

    def handle(self, *args, **options):
        updated = 0
        for clause_number, short_text in SHORT_DESCRIPTIONS.items():
            try:
                clause = ComplianceClause.objects.get(clause_number=clause_number)
                clause.short_description = short_text
                clause.save(update_fields=["short_description"])
                updated += 1
                self.stdout.write(f"✅ Updated {clause_number}")
            except ComplianceClause.DoesNotExist:
                self.stdout.write(f"⚠️ Missing clause {clause_number} (not found in DB)")

        self.stdout.write(self.style.SUCCESS(f"\n✅ Done. Updated {updated} clauses."))
