import csv
from datetime import datetime

from django.http import HttpResponse
from django.db.models import IntegerField
from django.db.models.functions import Cast, Substr
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

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


def _get_tenant(request):
    return getattr(request, "tenant", None)


def _has_field(model_cls, field_name: str) -> bool:
    try:
        return any(f.name == field_name for f in model_cls._meta.fields)
    except Exception:
        return False


# ------------------------------------------------
# Compliance (ISO 27001)
# ------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def iso27001_compliance_csv(request):
    from .isms_models import ISO27001ClauseRecord
    
    def parse_clause_code(code: str):
        """Sort helper for codes like 4.1, 10.2"""
        try:
            parts = code.split(".")
            major = int(parts[0])
            minor = int(parts[1]) if len(parts) > 1 else 0
            return (major, minor)
        except Exception:
            return (999, 999)
    
    tenant = _get_tenant(request)
    if not tenant:
        return HttpResponse("Tenant missing", status=400)

    filename = f"compliance_iso27001_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response, quoting=csv.QUOTE_ALL)
    writer.writerow([
        "Clause",
        "Description",
        "Status",
        "Owner",
        "Comments",
        "Last Updated",
        "Has Evidence",
        "Evidence Path",
    ])

    # Query ISO27001ClauseRecord (tenant-scoped)
    records = ISO27001ClauseRecord.objects.filter(organization=tenant).select_related("clause")
    
    # Sort in Python using proper clause code parsing
    records = sorted(records, key=lambda r: parse_clause_code(r.clause.code))

    for record in records:
        clause = record.clause
        evidence_path = ""
        if record.evidence:
            try:
                evidence_path = record.evidence.url
            except Exception:
                evidence_path = str(record.evidence)
        
        writer.writerow([
            clause.code,
            (clause.text or "").replace("\n", " ").strip(),
            record.status,
            record.owner,
            (record.comments or "").replace("\n", " ").strip(),
            record.updated_at.strftime("%Y-%m-%d") if record.updated_at else "",
            "Yes" if record.evidence else "No",
            evidence_path,
        ])

    return response


# ------------------------------------------------
# Statement of Applicability
# ------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def soa_csv(request):
    tenant = _get_tenant(request)
    if not tenant:
        return HttpResponse("Tenant missing", status=400)

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
        .filter(standard="iso-27001", organization=tenant)
        .select_related("control")
    )

    for e in qs:
        risks = ISORisk.objects.filter(
            organization=tenant,
            standard="iso-27001",
            controls=e.control,
        ).distinct()

        assets = Asset.objects.filter(
            organization=tenant,
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
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def iso27001_risks_csv(request):
    tenant = _get_tenant(request)
    if not tenant:
        return HttpResponse("Tenant missing", status=400)

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

    for r in ISORisk.objects.filter(organization=tenant, standard="iso-27001").select_related("asset"):
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
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def assets_csv(request):
    tenant = _get_tenant(request)
    if not tenant:
        return HttpResponse("Tenant missing", status=400)

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

    for a in Asset.objects.filter(organization=tenant, standard="iso-27001"):
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
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def iso27001_audits_csv(request):
    tenant = _get_tenant(request)
    if not tenant:
        return HttpResponse("Tenant missing", status=400)

    filename = f"audits_iso27001_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow(["Audit ID", "Name", "Date", "Lead Auditor", "Participants","Open Findings"])

    for a in Audit.objects.filter(organization=tenant, standard="iso-27001"):
        open_findings = Finding.objects.filter(audit=a, status="Open").count()
        writer.writerow([a.audit_id, a.audit_name, a.date, (a.lead_auditor or "").strip(),
            (a.participants or "").strip(), open_findings])

    return response
