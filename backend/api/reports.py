import csv
import io
from datetime import datetime

from django.http import HttpResponse, FileResponse
from django.utils.timezone import now

from .models import ComplianceClause, Risk


# ---------- Helpers ----------
STATUS_POINTS = {"NI": 1, "P": 2, "IP": 3, "MI": 4, "O": 5}


def _compliance_stats():
    qs = ComplianceClause.objects.all().values_list("status", flat=True)
    counts = {"NI": 0, "P": 0, "IP": 0, "MI": 0, "O": 0}
    for s in qs:
        counts[s] = counts.get(s, 0) + 1

    total = sum(counts.values()) or 1
    earned = sum(counts[s] * STATUS_POINTS[s] for s in counts)
    max_points = total * 5
    percent = round((earned / max_points) * 100)

    return {
        "counts": counts,
        "total": total,
        "earned": earned,
        "max_points": max_points,
        "percent": percent,
    }


# ---------- CSV: Compliance ----------
def compliance_csv(request):
    filename = f"compliance_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow(
        [
            "Clause Number",
            "Description",
            "Status",
            "Owner",
            "Comments",
            "Last Updated",
            "Has Evidence?",
            "Evidence Path",
        ]
    )

    for c in ComplianceClause.objects.all().order_by("clause_number"):
        writer.writerow(
            [
                c.clause_number,
                (c.description or "").replace("\n", " ").strip(),
                c.status,
                c.owner,
                (c.comments or "").replace("\n", " ").strip(),
                c.last_updated.strftime("%Y-%m-%d %H:%M"),
                "Yes" if c.evidence else "No",
                c.evidence.url if c.evidence else "",
            ]
        )
    return response


# ---------- CSV: Risks ----------
def risks_csv(request):
    filename = f"risks_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow(
        [
            "Risk ID",
            "Description",
            "Likelihood",
            "Impact",
            "Risk Score",
            "Risk Level",
            "Owner",
            "Status",
            "Review Date",
            "Archived",
        ]
    )

    for r in Risk.objects.all().order_by("risk_id"):
        writer.writerow(
            [
                r.risk_id,
                (r.description or "").replace("\n", " ").strip(),
                r.likelihood,
                r.impact,
                r.risk_score,
                r.risk_level,
                r.owner,
                r.status,
                r.review_date.strftime("%Y-%m-%d") if r.review_date else "",
                "Yes" if r.archived else "No",
            ]
        )
    return response


# ---------- PDF: Compliance Summary ----------
def compliance_pdf(request):
    """
    Minimal 1-page summary PDF: totals, weighted %, and status breakdown.
    """
    # Lazy import so app still works even if reportlab isn't installed yet
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import mm
    except Exception as e:
        return HttpResponse(
            "Report generation requires 'reportlab'. Please install it first.",
            status=500,
            content_type="text/plain",
        )

    stats = _compliance_stats()
    buf = io.BytesIO()

    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    y = height - 30 * mm
    left = 25 * mm

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(left, y, "AfyaNumeriq – Compliance Summary Report")
    y -= 10 * mm
    c.setFont("Helvetica", 10)
    c.drawString(left, y, f"Generated: {now().strftime('%Y-%m-%d %H:%M')}")
    y -= 8 * mm

    # Totals and score
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left, y, f"Total Clauses: {stats['total']}")
    y -= 6 * mm
    c.drawString(left, y, f"Weighted Score: {stats['percent']}%")
    y -= 10 * mm

    # Breakdown
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left, y, "Breakdown")
    y -= 6 * mm
    c.setFont("Helvetica", 11)
    for key, label in [
        ("NI", "Not Implemented"),
        ("P", "Planned"),
        ("IP", "In Progress"),
        ("MI", "Mostly Implemented"),
        ("O", "Optimized"),
    ]:
        c.drawString(left, y, f"{label}: {stats['counts'][key]}")
        y -= 6 * mm

    c.showPage()
    c.save()

    buf.seek(0)
    filename = f"compliance_summary_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return FileResponse(buf, as_attachment=True, filename=filename)
