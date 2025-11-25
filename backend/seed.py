import os
import django
import random
from faker import Faker

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from api.models import Risk, ComplianceClause, Audit, Finding

fake = Faker()

def seed_risks(n=10):
    for _ in range(n):
        Risk.objects.create(
            risk_id=f"R-{fake.random_int(min=1000, max=9999)}",
            description=fake.sentence(),
            likelihood=random.choice(["Low", "Medium", "High"]),
            impact=random.choice(["Low", "Medium", "High"]),
            risk_score=random.uniform(1.0, 9.9),
            risk_level=random.choice(["Low", "Medium", "High"]),
            existing_control=fake.text(50),
            treatment_action=fake.text(50),
            owner=fake.name(),
            status=random.choice(["Open", "Closed"]),
            review_date=fake.date_this_year(),
        )

def seed_audits(n=5):
    for _ in range(n):
        Audit.objects.create(
            audit_id=f"A-{fake.random_int(min=1000, max=9999)}",
            audit_name=fake.bs().title(),
            objective=fake.sentence(),
            scope=fake.text(50),
            date=fake.date_this_year(),
            lead_auditor=fake.name(),
            participants=", ".join(fake.words(3)),
            status=random.choice(["Scheduled", "Completed"]),
        )

def seed_findings(n=10):
    audits = list(Audit.objects.all())
    if not audits:
        print("No audits found. Run seed_audits() first.")
        return
    for _ in range(n):
        Finding.objects.create(
            audit=random.choice(audits),
            finding_id=f"F-{fake.random_int(min=1000, max=9999)}",
            description=fake.text(100),
            severity=random.choice(["Low", "Medium", "High"]),
            corrective_action=fake.sentence(),
            status=random.choice(["Open", "Closed"]),
            target_date=fake.date_this_year(),
        )

if __name__ == "__main__":
    seed_risks()
    seed_audits()
    seed_findings()
    print("✅ Database seeded successfully.")
