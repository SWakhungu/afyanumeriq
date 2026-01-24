import csv
import io
from datetime import datetime

from django.http import HttpResponse, FileResponse
from django.utils.timezone import now

from .models import ComplianceClause, Risk, Audit, Finding


STATUS_POINTS = {"NI": 1, "P": 2, "IP": 3, "MI": 4, "O": 5}


def compliance_csv(request):
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
    for c in ComplianceClause.objects.filter(standard="iso-7101").order_by("clause_major", "clause_minor"):
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


def risks_csv(request):
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

    for r in Risk.objects.all().order_by("id"):
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


def audits_csv(request):
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

    for a in Audit.objects.all().order_by("date"):
        findings_count = Finding.objects.filter(audit=a).count()
        open_findings_count = Finding.objects.filter(audit=a, status="Open").count()
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


def compliance_pdf(request):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import mm
    except Exception:
        return HttpResponse("Install reportlab", status=500)

    qs = ComplianceClause.objects.filter(standard="iso-7101")
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
