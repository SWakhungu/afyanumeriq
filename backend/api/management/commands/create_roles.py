from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

class Command(BaseCommand):
    help = "Seeds default roles for AfyaNumeriq"

    def handle(self, *args, **kwargs):
        roles = ["Admin", "Auditor", "Staff"]
        for role in roles:
            obj, created = Group.objects.get_or_create(name=role)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {role}"))
            else:
                self.stdout.write(self.style.WARNING(f"Exists: {role}"))
