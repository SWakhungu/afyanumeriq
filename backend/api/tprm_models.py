import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class ThirdParty(models.Model):
    """
    Represents an external party that introduces risk to the organization
    through dependency, outsourcing, or service provision.

    IMPORTANT:
    - This is NOT standard-scoped (not tied to ISO modules).
    - It is a TPRM-only entity.
    """

    CRITICALITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("suspended", "Suspended"),
        ("terminated", "Terminated"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Use a string FK to avoid guessing import paths / circular imports.
    # Assumes you already have an Organization model in the same app (api).
    organization = models.ForeignKey(
        "Organization",
        on_delete=models.CASCADE,
        related_name="tprm_third_parties",
    )

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, help_text="e.g. Cloud Provider, SaaS, Consultant")
    description = models.TextField(blank=True)

    criticality = models.CharField(max_length=20, choices=CRITICALITY_CHOICES)

    scope_of_dependency = models.TextField(
        help_text="How the organization depends on this third party (operations, finance, legal, strategic, etc.)"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    relationship_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tprm_owned_third_parties",
        help_text="Internal owner responsible for the relationship",
    )

    contract_start_date = models.DateField(null=True, blank=True)
    contract_end_date = models.DateField(null=True, blank=True)

    review_frequency_months = models.PositiveIntegerField(
        default=12,
        help_text="Planned review frequency in months",
    )
    next_review_due = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Third Party"
        verbose_name_plural = "Third Parties"

    def __str__(self) -> str:
        return self.name


class TPRMRisk(models.Model):
    """
    A risk arising specifically from a third-party relationship.

    Notes:
    - This is NOT the same as ISO-scoped 'Risk' in your standards workflows.
    - This is a TPRM-only risk plane.
    """

    RISK_TYPE_CHOICES = [
        ("operational", "Operational"),
        ("security", "Security"),
        ("financial", "Financial"),
        ("legal", "Legal / Regulatory"),
        ("strategic", "Strategic"),
        ("reputational", "Reputational"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("mitigated", "Mitigated"),
        ("accepted", "Accepted"),
        ("closed", "Closed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    third_party = models.ForeignKey(
        ThirdParty,
        on_delete=models.CASCADE,
        related_name="tprm_risks",
    )

    title = models.CharField(max_length=255)
    description = models.TextField()

    risk_type = models.CharField(max_length=30, choices=RISK_TYPE_CHOICES)

    # Simple MVP scoring: 1–5 x 1–5
    likelihood = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Likelihood on a 1–5 scale",
    )
    impact = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Impact on a 1–5 scale",
    )

    inherent_risk_score = models.PositiveSmallIntegerField(
        help_text="Computed as likelihood × impact",
    )
    residual_risk_score = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Optional; set after assessment/decision",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tprm_risks",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-inherent_risk_score", "title"]
        verbose_name = "TPRM Risk"
        verbose_name_plural = "TPRM Risks"

    def __str__(self) -> str:
        return f"{self.title} ({self.third_party.name})"

    def save(self, *args, **kwargs):
        # Auto-compute inherent score for MVP consistency
        self.inherent_risk_score = int(self.likelihood) * int(self.impact)
        super().save(*args, **kwargs)


class TPRMAssessment(models.Model):
    """
    Represents an assessment or assurance activity performed for a third party.
    In MVP this is a simple record (type + summary + dates).
    """

    ASSESSMENT_TYPE_CHOICES = [
        ("questionnaire", "Questionnaire"),
        ("certification", "Certification"),
        ("contract_review", "Contract Review"),
        ("external_report", "External Report"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    third_party = models.ForeignKey(
        ThirdParty,
        on_delete=models.CASCADE,
        related_name="tprm_assessments",
    )

    assessment_type = models.CharField(max_length=50, choices=ASSESSMENT_TYPE_CHOICES)
    summary = models.TextField(help_text="High-level outcome / notes")

    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tprm_assessments",
    )

    assessment_date = models.DateField()
    valid_until = models.DateField(null=True, blank=True, help_text="Optional expiry date for assurance")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-assessment_date"]
        verbose_name = "TPRM Assessment"
        verbose_name_plural = "TPRM Assessments"

    def __str__(self) -> str:
        return f"{self.get_assessment_type_display()} – {self.third_party.name}"


class TPRMDecision(models.Model):
    """
    Records the overall management decision for a third party.
    One-to-one with ThirdParty for a single current decision in MVP.
    """

    DECISION_CHOICES = [
        ("pending", "Pending"),
        ("accept", "Accept"),
        ("mitigate", "Mitigate"),
        ("transfer", "Transfer"),
        ("avoid", "Avoid"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    third_party = models.OneToOneField(
        ThirdParty,
        on_delete=models.CASCADE,
        related_name="tprm_decision",
    )

    decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default="pending")
    justification = models.TextField(blank=True)

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tprm_approved_decisions",
    )

    decision_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "TPRM Decision"
        verbose_name_plural = "TPRM Decisions"

    def __str__(self) -> str:
        return f"{self.get_decision_display()} – {self.third_party.name}"
