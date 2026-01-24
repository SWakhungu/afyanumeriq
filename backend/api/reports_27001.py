import csv
from datetime import datetime

from django.http import HttpResponse
from django.db.models import IntegerField
from django.db.models.functions import Cast, Substr

from .models import Audit, Finding
from .isms_models import SoAEntry, ISORisk, Asset
from .models import ComplianceClause


# ------------------------------------------------
# Canonical ordering helpers
# ------------------------------------------------
def order_clauses(qs):
    return qs.annotate(
        major=Cast(Substr("clause_number", 1, 1), IntegerField()),
        minor=Cast(Substr("clause_number", 3, 1), IntegerField()),
    ).order_by("major", "minor")


def order_controls(qs):
    return qs.annotate(
        chapter=Cast(Substr("control__code", 3, 1), IntegerField()),
        section=Cast(Substr("control__code", 5, 2), IntegerField()),
    ).order_by("chapter", "section")


# ------------------------------------------------
# Compliance (ISO 27001)
# ------------------------------------------------
def iso27001_compliance_csv(request):
    filename = f"compliance_iso27001_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        "Clause",
        "Description",
        "Status",
        "Owner",
        "Comments",
        "Last Updated",
        "Has Evidence",
    ])

    # Use numeric clause ordering fields to avoid substr/cast DB issues
    qs = ComplianceClause.objects.filter(standard="iso-27001").order_by("clause_major", "clause_minor")

    for c in qs:
        writer.writerow([
            c.clause_number,
            (c.description or "").replace("\n", " ").strip(),
            c.status,
            c.owner,
            (c.comments or "").replace("\n", " ").strip(),
            c.last_updated.strftime("%Y-%m-%d") if c.last_updated else "",
            "Yes" if c.evidence else "No",
        ])

    return response


# ------------------------------------------------
# Statement of Applicability
# ------------------------------------------------
def soa_csv(request):
    filename = f"soa_iso27001_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        "Control",
        "Control Title",
        "Applicable",
        "Status",
        "Justification",
        "Evidence",
        "Linked Risks",
        "Linked Assets",
    ])

    qs = order_controls(
        SoAEntry.objects
        .filter(standard="iso-27001")
        .select_related("control")
    )

    for e in qs:
        risks = ISORisk.objects.filter(
            standard="iso-27001",
            controls=e.control,
        ).distinct()

        assets = Asset.objects.filter(    
            risks__in=risks,
            standard="iso-27001",
        ).distinct()
        
        writer.writerow([
            e.control.code,
            e.control.title,
            "Yes" if e.applicable else "No",
            e.status,
            e.justification or "",
            e.evidence_notes or "",
            ", ".join(r.title for r in risks),
            ", ".join(a.name for a in assets),
        ])

    return response


# ------------------------------------------------
# Risk Register
# ------------------------------------------------
def iso27001_risks_csv(request):
    filename = f"risks_iso27001_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        "Risk ID",
        "Risk",
        "Risk Description",
        "Likelihood",
        "Impact",
        "Score",
        "Level",
        "Existing Control(s)",
        "Treatment",
        "Owner",
        "Status",
        "Control Coverage",
        "Asset",
    ])

    for r in ISORisk.objects.filter(standard="iso-27001").select_related("asset"):
        # controls is a M2M; list codes
        control_codes = ", ".join(c.code for c in r.controls.all())

        writer.writerow([
            getattr(r, "id", "") or "",
            r.title,
            (r.description or "").replace("\n", " ").strip(),
            r.likelihood,
            r.impact,
            r.risk_score,
            r.level,
            control_codes,
            r.treatment or "",
            r.owner or "",
            r.status,
            r.control_coverage or "",
            r.asset.name if r.asset else "",
        ])

    return response


# ------------------------------------------------
# Asset Register
# ------------------------------------------------
def assets_csv(request):
    filename = f"assets_iso27001_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        "Asset ID",
        "Name",
        "Type",
        "Classification",
        "Technical Owner",
        "Legal Owner",
        "Business Value",
        "Secure",
        "Notes",
    ])

    for a in Asset.objects.filter(standard="iso-27001"):
        writer.writerow([
            a.asset_id,
            a.name,
            a.asset_type,
            a.classification,
            a.technical_owner,
            a.legal_owner,
            a.value,
            "Yes" if a.is_secure else "No",
            a.notes or "",
        ])

    return response


# ------------------------------------------------
# Audits (stub-safe)
# ------------------------------------------------
def iso27001_audits_csv(request):
    filename = f"audits_iso27001_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow(["Audit ID", "Name", "Date", "Open Findings"])

    for a in Audit.objects.filter(standard="iso-27001"):
        open_findings = Finding.objects.filter(audit=a, status="Open").count()
        writer.writerow([a.audit_id, a.audit_name, a.date, open_findings])

    return response
