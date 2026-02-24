import csv
import io
from datetime import datetime

from django.http import HttpResponse, FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import ComplianceClause, Risk, Audit, Finding


STATUS_POINTS = {"NI": 1, "P": 2, "IP": 3, "MI": 4, "O": 5}


def _get_tenant(request):
    """
    TenantMiddleware should attach request.tenant.
    We fail fast if tenant missing, because exports must be tenant-scoped.
    """
    return getattr(request, "tenant", None)


def _has_field(model_cls, field_name: str) -> bool:
    try:
        return any(f.name == field_name for f in model_cls._meta.fields)
    except Exception:
        return False


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def compliance_csv(request):
    tenant = _get_tenant(request)
    if not tenant:
        return HttpResponse("Tenant missing", status=400)

    filename = f"compliance_7101_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        "Clause Number",
        "Description",
        "Status",
        "Owner",
        "Comments",
        "Last Updated",
        "Has Evidence",
    ])

    # Order using numeric clause_major/clause_minor to ensure canonical ordering
    qs = ComplianceClause.objects.filter(standard="iso-7101")

    # Tenant-scope ONLY if model supports it (prevents breaking if global)
    if _has_field(ComplianceClause, "organization"):
        qs = qs.filter(organization=tenant)

    qs = qs.order_by("clause_major", "clause_minor")

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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def risks_csv(request):
    tenant = _get_tenant(request)
    if not tenant:
        return HttpResponse("Tenant missing", status=400)

    filename = f"risks_7101_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        "Risk ID",
        "Description",
        "Likelihood",
        "Impact",
        "Risk Score",
        "Risk Level",
        "Existing Control",
        "Treatment Action",
        "Owner",
        "Status",
        "Review Date",
        "Archived",
    ])

    qs = Risk.objects.all()

    # Tenant-scope if model supports it
    if _has_field(Risk, "organization"):
        qs = qs.filter(organization=tenant)

    # Standard-scope only if model has standard field (older Risk model may not)
    if _has_field(Risk, "standard"):
        qs = qs.filter(standard="iso-7101")

    qs = qs.order_by("id")

    for r in qs:
        writer.writerow([
            r.risk_id or r.id,
            (r.description or "").replace("\n", " ").strip(),
            r.likelihood,
            r.impact,
            r.risk_score,
            r.risk_level,
            (r.existing_control or "").replace("\n", " ").strip(),
            (r.treatment_action or "").replace("\n", " ").strip(),
            r.owner,
            r.status,
            r.review_date.strftime("%Y-%m-%d") if r.review_date else "",
            "Yes" if r.archived else "No",
        ])

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audits_csv(request):
    tenant = _get_tenant(request)
    if not tenant:
        return HttpResponse("Tenant missing", status=400)

    filename = f"audits_7101_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        "Audit ID",
        "Audit Name",
        "Date",
        "Lead Auditor",
        "Participants",
        "Status",
        "# Findings",
        "# Open Findings",
    ])

    qs = Audit.objects.all()

    # Audit model DOES have organization per your pasted code
    qs = qs.filter(organization=tenant, standard="iso-7101").order_by("date")

    for a in qs:
        findings_qs = Finding.objects.filter(audit=a)
        findings_count = findings_qs.count()
        open_findings_count = findings_qs.filter(status="Open").count()

        writer.writerow([
            a.audit_id,
            a.audit_name,
            a.date.strftime("%Y-%m-%d") if a.date else "",
            a.lead_auditor,
            a.participants or "",
            a.status,
            findings_count,
            open_findings_count,
        ])

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def compliance_pdf(request):
    tenant = _get_tenant(request)
    if not tenant:
        return HttpResponse("Tenant missing", status=400)

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import mm
    except Exception:
        return HttpResponse("Install reportlab", status=500)

    qs = ComplianceClause.objects.filter(standard="iso-7101")

    # Tenant-scope ONLY if model supports it (prevents breaking if global)
    if _has_field(ComplianceClause, "organization"):
        qs = qs.filter(organization=tenant)

    total = qs.count() or 1
    earned = sum(STATUS_POINTS[c.status] for c in qs)
    percent = round((earned / (total * 5)) * 100)

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    c.setFont("Helvetica-Bold", 16)
    c.drawString(25 * mm, 260 * mm, "ISO 7101 Compliance Summary")
    c.setFont("Helvetica", 12)
    c.drawString(25 * mm, 245 * mm, f"Score: {percent}%")
    c.showPage()
    c.save()

    buf.seek(0)
    return FileResponse(buf, as_attachment=True, filename="compliance_7101.pdf")
