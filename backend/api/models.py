from django.db import models
from django.contrib.auth.models import User


# Organization Settings
class Organization(models.Model):
    name = models.CharField(max_length=200, default="Your Organization")
    logo = models.ImageField(upload_to="logos/", blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Organization"

    def __str__(self):
        return self.name


# User Roles
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Administrator"),
        ("auditor", "Auditor"),
        ("staff", "Staff"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="staff")
    department = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


# Risk Register
class Risk(models.Model):
    risk_id = models.CharField(max_length=20, unique=True)
    description = models.TextField()
    likelihood = models.CharField(max_length=50)
    impact = models.CharField(max_length=50)
    risk_score = models.FloatField()
    risk_level = models.CharField(max_length=20)
    existing_control = models.TextField(blank=True, null=True)
    treatment_action = models.TextField(blank=True, null=True)
    owner = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default="Open")
    review_date = models.DateField()
    archived = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.risk_id} – {self.description[:40]}"


# Compliance as per respective Clause (ISO 7101)
class ComplianceClause(models.Model):
    clause_number = models.CharField(max_length=20)
    # NEW: short, UI-friendly text (we’ll seed it)
    short_description = models.TextField(blank=True, default="")
    # Full official text (kept verbatim)
    description = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=[
            ("NI", "Not Implemented"),
            ("P", "Planned"),
            ("IP", "In Progress"),
            ("MI", "Mostly Implemented"),
            ("O", "Optimized"),
        ],
        default="NI",
    )
    comments = models.TextField(blank=True, null=True)
    owner = models.CharField(max_length=100, default="Unassigned")
    evidence = models.FileField(upload_to="evidence/", blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.clause_number}: {self.get_status_display()}"


# Audit Schedule
class Audit(models.Model):
    audit_id = models.CharField(max_length=20, unique=True)
    audit_name = models.CharField(max_length=200)
    objective = models.TextField()
    scope = models.TextField()
    date = models.DateField()
    lead_auditor = models.CharField(max_length=100)
    participants = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=[("Scheduled", "Scheduled"), ("Completed", "Completed")],
        default="Scheduled",
    )

    def __str__(self):
        return self.audit_name


# Audit Findings (linked to Audit)
class Finding(models.Model):
    audit = models.ForeignKey(Audit, on_delete=models.CASCADE, related_name="findings")
    finding_id = models.CharField(max_length=20, unique=True)
    description = models.TextField()
    severity = models.CharField(
        max_length=20, choices=[("Low", "Low"), ("Medium", "Medium"), ("High", "High")]
    )
    corrective_action = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=[("Open", "Open"), ("Closed", "Closed")], default="Open"
    )
    target_date = models.DateField()
    completion_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.finding_id} – {self.status}"
