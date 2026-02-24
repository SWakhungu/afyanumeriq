# backend/api/isms_signals.py

"""
This module contains ALL derived ISMS logic that must remain consistent
across the platform.

It encodes the ISO/IEC 27001 intent that:

- Risks are treated using controls (Annex A)
- Controls are implemented via the Statement of Applicability (SoA)
- Asset security is a consequence of residual risk treatment
- Nothing is manually updated downstream — everything is derived

This file is deliberately signal-driven to ensure:
- No UI can desynchronise risk, SoA, and asset state
- All changes remain auditable and reproducible
"""

from django.db import transaction
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from typing import Tuple

from .isms_models import SoAEntry, ISORisk, Asset


# -------------------------------------------------------------------
# SoA COMPLETENESS METRIC
# -------------------------------------------------------------------
# Purpose:
#   Provide a real-time metric answering:
#   "Of the controls we claim are applicable, how many are fully implemented?"
#
# ISO Reference:
#   ISO/IEC 27001:2022 — Clause 6.1.3 d)
#
# IMPORTANT:
#   - Only APPLICABLE controls count
#   - 'Full' is the only state considered implemented
# -------------------------------------------------------------------

def compute_soa_completeness(standard_code: str = None) -> Tuple[int, int, float]:
    qs = SoAEntry.objects.all()

    if standard_code:
        qs = qs.filter(standard=standard_code)

    total_applicable = qs.filter(applicable=True).count()
    fully_implemented = qs.filter(applicable=True, status="Full").count()

    percent = (
        (fully_implemented / total_applicable) * 100.0
        if total_applicable
        else 0.0
    )

    return total_applicable, fully_implemented, percent


# -------------------------------------------------------------------
# RISK CONTROL COVERAGE (PRIMARY ISO LOGIC)
# -------------------------------------------------------------------
# Purpose:
#   Determine the residual risk treatment state based on the SoA.
#
# ISO Interpretation:
#   - Risks are NOT "open" or "closed"
#   - Risks are treated via controls
#
# Coverage States:
#   - Untreated → no applicable controls implemented
#   - Partial   → some controls implemented
#   - Adequate  → ALL applicable controls fully implemented
#
# IMPORTANT:
#   - Only controls marked applicable in the SoA count
#   - This applies ONLY to risks with treatment = Reduce
# -------------------------------------------------------------------

def aggregate_risk_coverage_for_risk(risk: ISORisk) -> str:
    """
    Determine risk coverage based on treatment + SoA state.

    ISO/IEC 27001 logic:
    - Coverage is ONLY meaningful when treatment = Reduce
    - For Accept / Transfer / Avoid → coverage = N/A
    """

    # 1️⃣ Non-reduction treatments → N/A
    if risk.treatment in ["Accept", "Transfer", "Avoid"]:
        new_status = "N/A"

    else:
        # Treatment = Reduce
        controls = risk.controls.all()

        if not controls.exists():
            new_status = "Untreated"
        else:
            entries = SoAEntry.objects.filter(
                control__in=controls,
                applicable=True,
            )

            if not entries.exists():
                new_status = "Untreated"
            else:
                total = entries.count()
                full = entries.filter(status="Full").count()
                partial = entries.filter(status="Partial").count()

                if full == total:
                    new_status = "Adequate"
                elif full > 0 or partial > 0:
                    new_status = "Partial"
                else:
                    new_status = "Untreated"

    if risk.control_coverage != new_status:
        risk.control_coverage = new_status
        risk.save(update_fields=["control_coverage"])

    return new_status


# -------------------------------------------------------------------
# ASSET SECURITY STATE (DERIVED, NEVER MANUAL)
# -------------------------------------------------------------------
# Purpose:
#   Determine whether an asset is considered "secure".
#
# ISO Intent:
#   Assets are secure ONLY IF:
#   - They are in scope (have risks)
#   - ALL associated risks are adequately treated
#
# IMPORTANT:
#   - This is NOT a user-controlled field
#   - It is entirely derived from residual risk state
# -------------------------------------------------------------------

def compute_asset_security(asset: Asset) -> bool:
    """
    An asset is considered secure IF AND ONLY IF:
    - It has risks, AND
    - ALL associated risks are secured, where a risk is secured if:
        - treatment = Reduce AND control_coverage = Adequate
        - OR treatment IN (Accept, Transfer, Avoid)
    """

    risks = asset.risks.all()

    if not risks.exists():
        secure = False
    else:
        secure = all(
            (
                (risk.treatment == "Reduce" and risk.control_coverage == "Adequate")
                or
                (risk.treatment in ("Accept", "Transfer", "Avoid"))
            )
            for risk in risks
        )

    if asset.is_secure != secure:
        asset.is_secure = secure
        asset.save(update_fields=["is_secure"])

    return secure


# -------------------------------------------------------------------
# SIGNAL: SoAEntry UPDATED
# -------------------------------------------------------------------
# Trigger:
#   Any change to:
#   - applicable
#   - status
#   - justification / evidence (indirect impact)
#
# Effect:
#   SoA → Risk → Asset cascade
#
# ISO Principle:
#   A control implementation change must immediately reflect
#   in residual risk and asset security
# -------------------------------------------------------------------

@receiver(post_save, sender=SoAEntry)
def on_soaentry_saved(sender, instance: SoAEntry, **kwargs):
    with transaction.atomic():

        # Update completeness metrics (dashboard usage)
        compute_soa_completeness(standard_code=instance.standard)

        # Recompute coverage for ALL linked risks (not just Reduce-filtered)
        risks = ISORisk.objects.filter(
            controls=instance.control,
        ).distinct()

        for risk in risks:
            aggregate_risk_coverage_for_risk(risk)

            if risk.asset:
                compute_asset_security(risk.asset)


# -------------------------------------------------------------------
# SIGNAL: Risk SAVED (TREATMENT CHANGED)
# -------------------------------------------------------------------
# Trigger:
#   Risk is saved with a new treatment value
#
# Effect:
#   Recompute coverage and update SoA applicability
#
# Reason:
#   When treatment changes (e.g., Reduce → Accept), the coverage
#   logic changes: Accept/Transfer/Avoid have coverage = N/A
# -------------------------------------------------------------------

@receiver(post_save, sender=ISORisk)
def on_iso_risk_saved(sender, instance: ISORisk, created, **kwargs):
    """Ensure coverage is recomputed when risk is saved"""
    if not created:  # Only on updates, not creation (create() handles its own)
        with transaction.atomic():
            # If treatment is now "Reduce", mark controls as applicable
            if instance.treatment == "Reduce":
                controls = instance.controls.all()
                SoAEntry.objects.filter(
                    organization=instance.organization,
                    control__in=controls,
                    standard=instance.standard,
                ).update(applicable=True)
            
            # Always recompute coverage
            aggregate_risk_coverage_for_risk(instance)

            if instance.asset:
                compute_asset_security(instance.asset)


# -------------------------------------------------------------------
# SIGNAL: Risk ↔ Control RELATIONSHIP CHANGED
# -------------------------------------------------------------------
# Trigger:
#   - Control added to risk
#   - Control removed from risk
#
# Effect:
#   1. Update SoA applicability for affected controls
#   2. Recompute coverage immediately
#
# Reason:
#   Controls selected during risk treatment directly define coverage
#   and SoA applicability
# -------------------------------------------------------------------

@receiver(m2m_changed, sender=ISORisk.controls.through)
def on_risk_controls_changed(sender, instance: ISORisk, action, **kwargs):
    if action in ("post_add", "post_remove", "post_clear"):
        with transaction.atomic():
            # If treatment is "Reduce" and controls are added, mark those
            # controls as applicable in the SoA
            if instance.treatment == "Reduce":
                controls = instance.controls.all()
                
                # Mark associated SoA entries as applicable
                SoAEntry.objects.filter(
                    organization=instance.organization,
                    control__in=controls,
                    standard=instance.standard,
                ).update(applicable=True)
            
            # Recompute coverage
            aggregate_risk_coverage_for_risk(instance)

            if instance.asset:
                compute_asset_security(instance.asset)
