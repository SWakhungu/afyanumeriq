# backend/api/isms_models.py

from django.db import models, transaction
from .models import Organization, TenantSequence


class Clause(models.Model):
    code = models.CharField(max_length=64)
    title = models.CharField(max_length=255, blank=True)
    text = models.TextField(blank=True)
    standard = models.CharField(max_length=64, default="iso-27001")

    class Meta:
        unique_together = ("code", "standard")
        ordering = ["code"]

    def __str__(self):
        return f"{self.standard} {self.code} - {self.title}"


class Control(models.Model):
    code = models.CharField(max_length=32)
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    group = models.CharField(max_length=128, blank=True)
    standard = models.CharField(max_length=64, default="iso-27001")

    class Meta:
        unique_together = ("code", "standard")
        ordering = ["code"]

    def __str__(self):
        return f"{self.standard} {self.code} - {self.title}"


class Asset(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="assets"
    )
    asset_id = models.CharField(max_length=64, editable=False)
    name = models.CharField(max_length=255)
    asset_type = models.CharField(max_length=128, blank=True, null=True)

    CLASSIFICATION_CHOICES = [
        ("public", "Public"),
        ("internal", "Internal"),
        ("confidential", "Confidential"),
        ("restricted", "Restricted"),
        ("sensitive", "Sensitive"),
    ]
    classification = models.CharField(
        max_length=32, choices=CLASSIFICATION_CHOICES, blank=True, null=True
    )

    location = models.CharField(max_length=255, blank=True, null=True)
    legal_owner = models.CharField(max_length=255, blank=True, null=True)
    technical_owner = models.CharField(max_length=255, blank=True, null=True)

    VALUE_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]
    value = models.CharField(max_length=16, choices=VALUE_CHOICES, blank=True, null=True)

    notes = models.TextField(blank=True, null=True)
    standard = models.CharField(max_length=64, default="iso-27001")
    created_at = models.DateTimeField(auto_now_add=True)

    # Computed by signals
    is_secure = models.BooleanField(default=False)

    class Meta:
        unique_together = ("organization", "asset_id")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "standard"]),
            models.Index(fields=["organization", "classification"]),
            models.Index(fields=["organization", "asset_type"]),
        ]

    def save(self, *args, **kwargs):
        """
        Generate sequential asset_id PER TENANT safely under concurrency.
        Uses TenantSequence + SELECT ... FOR UPDATE.
        """
        if not self.asset_id:
            if not self.organization_id:
                raise ValueError("Asset.organization must be set before saving.")

            with transaction.atomic():
                seq, _ = TenantSequence.objects.select_for_update().get_or_create(
                    organization_id=self.organization_id,
                    defaults={"next_asset_number": 1},
                )
                n = seq.next_asset_number
                self.asset_id = f"AST-{str(n).zfill(4)}"
                seq.next_asset_number = n + 1
                seq.save(update_fields=["next_asset_number"])

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.asset_id} — {self.name}"


class ISORisk(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="iso_risks"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    asset = models.ForeignKey(
        Asset, null=True, blank=True, on_delete=models.SET_NULL, related_name="risks"
    )

    likelihood = models.PositiveSmallIntegerField(default=3)
    impact = models.PositiveSmallIntegerField(default=3)
    risk_score = models.PositiveIntegerField(null=True, blank=True)
    level = models.CharField(max_length=16, blank=True)

    treatment = models.CharField(max_length=64, blank=True)
    controls = models.ManyToManyField(Control, blank=True, related_name="risks")

    owner = models.CharField(max_length=128, blank=True)
    status = models.CharField(max_length=32, default="Open")

    standard = models.CharField(max_length=64, default="iso-27001")
    created_at = models.DateTimeField(auto_now_add=True)

    acceptance_justification = models.TextField(blank=True)
    control_coverage = models.CharField(max_length=32, default="Untreated", blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "standard"]),
            models.Index(fields=["organization", "standard", "status"]),
            models.Index(fields=["organization", "standard", "level"]),
        ]

    def save(self, *args, **kwargs):
        self.risk_score = (self.likelihood or 0) * (self.impact or 0)

        if self.risk_score >= 16:
            self.level = "Critical"
        elif self.risk_score >= 10:
            self.level = "High"
        elif self.risk_score >= 5:
            self.level = "Medium"
        else:
            self.level = "Low"

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class SoAEntry(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="soa_entries"
    )
    control = models.ForeignKey(Control, on_delete=models.CASCADE, related_name="soa_entries")
    applicable = models.BooleanField(default=True)
    justification = models.TextField(blank=True)

    STATUS_CHOICES = [
        ("Not Implemented", "Not Implemented"),
        ("Partial", "Partial"),
        ("Full", "Full"),
    ]
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="Not Implemented")

    evidence_notes = models.TextField(blank=True)
    standard = models.CharField(max_length=64, default="iso-27001")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("organization", "control", "standard")
        ordering = ["control__code"]
        indexes = [
            models.Index(fields=["organization", "standard"]),
            models.Index(fields=["organization", "standard", "applicable"]),
            models.Index(fields=["organization", "standard", "status"]),
        ]

    def __str__(self):
        return f"{self.control.code} — applicable={self.applicable} status={self.status}"
