from django.core.management.base import BaseCommand
from django.db import transaction
from django.apps import apps

ISO_27001_CLAUSES = [
    ("4.1", "External and internal issues affecting the organization and its information security management system are identified and reviewed."),
    ("4.2", "Information security needs and expectations of relevant interested parties are clearly understood and documented."),
    ("4.3", "The scope of the information security management system is defined."),
    ("4.4", "The ISMS is established, implemented, maintained, and continually improved."),
    ("5.1", "Leadership ensures that the ISMS supports continual improvement and is adequately resourced."),
    ("5.2", "The documented information security policy is relevant and communicated."),
    ("5.3", "Responsibilities and authorities for the ISMS are assigned and understood."),
    ("6.1", "Risks and opportunities are identified and managed using a risk assessment process, a risk treatment process, and appropriate controls (SoA)."),
    ("6.2", "The information security objectives are defined, communicated, and measurable as appropriate."),
    ("6.3", "Changes to the ISMS are managed in a planned manner."),
    ("7.1", "Resources required for the ISMS are determined and provided."),
    ("7.2", "Individuals are competent; records of competence are maintained."),
    ("7.3", "Individuals are aware of the ISMS and their role in achieving information security objectives."),
    ("7.4", "Internal and external communication requirements are defined."),
    ("7.5", "Documented information for the ISMS is properly approved, controlled, and maintained."),
    ("8.1", "Processes required to meet information security objectives are planned, implemented, and controlled."),
    ("8.2", "Information security risk assessment is done regularly and documented according to clause 6.1.2."),
    ("8.3", "Risk treatment plans are executed according to clause 6.1.3."),
    ("9.1", "Performance of the ISMS is monitored and evaluated according to defined metrics."),
    ("9.2", "Internal audits verify the organization’s conformity and the ISMS suitability, effectiveness, and adequacy."),
    ("9.3", "Periodic management reviews of the ISMS performace drive continual improvement."),
    ("10.1", "Continual improvement of the ISMS is maintained."),
    ("10.2", "Nonconformities are managed and corrective actions are implemented."),
]


class Command(BaseCommand):
    help = "Seed GLOBAL Clause library for ISO 27001 (clauses 4–10). Idempotent."

    def add_arguments(self, parser):
        parser.add_argument("--update-existing", action="store_true")
        parser.add_argument("--dry-run", action="store_true")

    @transaction.atomic
    def handle(self, *args, **opts):
        Clause = apps.get_model("api", "Clause")
        update_existing = opts["update_existing"]
        dry_run = opts["dry_run"]

        created = existing = updated = 0

        for code, text in ISO_27001_CLAUSES:
            obj, was_created = Clause.objects.get_or_create(
                standard="iso-27001",
                code=code,
                defaults={
                    "title": f"ISO 27001 Clause {code}",
                    "text": text,
                },
            )

            if was_created:
                created += 1
            else:
                existing += 1
                if update_existing:
                    changed = False
                    if obj.title != f"ISO 27001 Clause {code}":
                        obj.title = f"ISO 27001 Clause {code}"
                        changed = True
                    if obj.text != text:
                        obj.text = text
                        changed = True
                    if changed:
                        updated += 1
                        if not dry_run:
                            obj.save()

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN: no database writes performed."))

        self.stdout.write(self.style.SUCCESS("✅ ISO 27001 global Clause seed complete"))
        self.stdout.write(f"Created={created}, Existing={existing}, Updated={updated}")
