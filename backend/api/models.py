# backend/api/models.py

from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import uuid
import re

RESERVED_SUBDOMAINS = {
    "www", "api", "admin", "app", "mail", "support", "staging", "demo",
    "static", "assets", "media", "auth", "login", "signup"
}


def validate_org_slug(value: str):
    if not value:
        raise ValidationError("Slug is required.")

    v = value.strip().lower()

    if v in RESERVED_SUBDOMAINS:
        raise ValidationError("This subdomain is reserved.")

    if len(v) < 3 or len(v) > 30:
        raise ValidationError("Subdomain must be 3–30 characters.")

    if not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", v):
        raise ValidationError(
            "Use lowercase letters, numbers, hyphen; no leading/trailing hyphen."
        )

    return v


# =========================================================
# Organization Settings
# =========================================================
class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(
        max_length=63,
        unique=True,
        db_index=True,
        validators=[validate_org_slug],
    )  # subdomain key: testorg
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


class TenantSequence(models.Model):
    """
    Per-tenant counters for human-friendly IDs (AST-0001, etc.)
    Safe under concurrency using select_for_update().
    """
    organization = models.OneToOneField(
        "api.Organization",  # ✅ string ref avoids ordering issues
        on_delete=models.CASCADE,
        related_name="sequence",
    )
    next_asset_number = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.organization.slug} seq (asset={self.next_asset_number})"


# =========================================================
# User Roles
# =========================================================
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Administrator"),
        ("auditor", "Auditor"),
        ("staff", "Staff"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="users"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="staff")
    department = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


# =========================================================
# Risk Register  (ISO 7101 module)  ⚠️ still needs tenant scoping later
# =========================================================
class Risk(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="risks_7101"
    )

    risk_id = models.CharField(max_length=20)  # ❗ remove unique=True
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

    class Meta:
        unique_together = ("organization", "risk_id")
        indexes = [
            models.Index(fields=["organization"]),
            models.Index(fields=["organization", "status"]),
        ]

    def __str__(self):
        return f"{self.risk_id} – {self.description[:40]}"

# =========================================================
# Compliance Clause Records (ISO 7101 module)  Tenant scoped
# =========================================================
class ComplianceClause(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="compliance_clauses"
    )

    standard = models.CharField(max_length=64, db_index=True, blank=False)
    clause_number = models.CharField(max_length=20)

    clause_major = models.PositiveSmallIntegerField(db_index=True)
    clause_minor = models.PositiveSmallIntegerField(db_index=True)

    short_description = models.TextField(blank=True, default="")
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

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "standard", "clause_number"],
                name="unique_clause_per_tenant_standard",
            )
        ]
        indexes = [
            models.Index(fields=["organization", "standard"]),
            models.Index(fields=["organization", "standard", "clause_major", "clause_minor"]),
        ]

    def save(self, *args, **kwargs):
        try:
            major, minor = self.clause_number.split(".")
            self.clause_major = int(major)
            self.clause_minor = int(minor)
        except Exception:
            self.clause_major = 0
            self.clause_minor = 0

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.standard.upper()} {self.clause_number}"

# =========================================================
# Audit Schedule
# =========================================================
class Audit(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="audits"
    )

    audit_id = models.CharField(max_length=20)  # ❗ remove unique=True
    audit_name = models.CharField(max_length=200)
    objective = models.TextField()
    scope = models.TextField()
    date = models.DateField()
    lead_auditor = models.CharField(max_length=100)
    participants = models.TextField(blank=True)

    standard = models.CharField(
        max_length=20,
        choices=[
            ("iso-7101", "ISO 7101"),
            ("iso-27001", "ISO/IEC 27001"),
            ("iso-42001", "ISO/IEC 42001"),
        ],
        default="iso-7101",
        db_index=True,
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ("Scheduled", "Scheduled"),
            ("In Progress", "In Progress"),
            ("Completed", "Completed"),
        ],
        default="Scheduled",
    )

    class Meta:
        unique_together = ("organization", "audit_id")
        indexes = [
            models.Index(fields=["organization", "standard"]),
            models.Index(fields=["organization", "status"]),
        ]

# =========================================================
# Audit Findings
# =========================================================
class Finding(models.Model):
    audit = models.ForeignKey(Audit, on_delete=models.CASCADE, related_name="findings")
    finding_id = models.CharField(max_length=20, unique=True)
    description = models.TextField()

    clause = models.ForeignKey(
        "api.Clause",  # ✅ string ref (Clause lives in isms_models.py)
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="findings",
    )

    controls = models.ManyToManyField(
        "api.Control",  # ✅ string ref (Control lives in isms_models.py)
        blank=True,
        related_name="findings",
    )

    severity = models.CharField(
        max_length=20,
        choices=[("Low", "Low"), ("Medium", "Medium"), ("High", "High")],
    )
    corrective_action = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=[("Open", "Open"), ("Closed", "Closed")],
        default="Open",
    )
    target_date = models.DateField()
    completion_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.finding_id} – {self.status}"
