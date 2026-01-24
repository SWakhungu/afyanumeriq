from datetime import date

from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response

from .models import Risk, Audit, Finding, ComplianceClause
from .serializers import (
    RiskSerializer,
    AuditSerializer,
    FindingSerializer,
    ComplianceClauseSerializer,
)


# =========================================================
#   RISK VIEWSET
# =========================================================
class RiskViewSet(viewsets.ModelViewSet):
    serializer_class = RiskSerializer

    def get_queryset(self):
        qs = Risk.objects.filter(archived=False)

        status_filter = self.request.query_params.get("status")
        level_filter = self.request.query_params.get("risk_level")
        owner_filter = self.request.query_params.get("owner")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if level_filter:
            qs = qs.filter(risk_level=level_filter)
        if owner_filter:
            qs = qs.filter(owner=owner_filter)

        sort = self.request.query_params.get("sort")
        if sort == "score_desc":
            qs = qs.order_by("-risk_score")
        elif sort == "score_asc":
            qs = qs.order_by("risk_score")

        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.archived = True
        instance.save()
        return Response({"message": "Risk archived"}, status=status.HTTP_200_OK)


# =========================================================
#   AUDIT VIEWSET
# =========================================================
class AuditViewSet(viewsets.ModelViewSet):
    serializer_class = AuditSerializer

    def get_queryset(self):
        """
        Enforce standard as a hard data boundary
        Audit lists must be scoped by standard.
        """
        
        standard = self.request.query_params.get("standard")
        
        if not standard:
            return Audit.objects.none()

        return Audit.objects.filter(standard=standard)

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        audit = self.get_object()
        new_status = request.data.get("status")

        if new_status == "Completed" and audit.findings.filter(status="Open").exists():
            return Response(
                {"error": "Cannot complete audit with open findings."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        audit.status = new_status
        audit.save()
        return Response({"status": "updated"})

    
# =========================================================
#   FINDINGS VIEWSET
# =========================================================
class FindingViewSet(viewsets.ModelViewSet):
    serializer_class = FindingSerializer
    def get_queryset(self):
        """
        Enforce standard as a hard data boundary via Audit.
        """
        qs = Finding.objects.select_related("audit")
        audit_id = self.request.query_params.get("audit_id")
        standard = self.request.query_params.get("standard")
        
        if not standard:
            return Finding.objects.none()
            qs = qs.filter(audit__standard=standard)        
        if audit_id:
            qs = qs.filter(audit__id=audit_id)
        return qs
    
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get("status")

        if new_status:
            instance.status = new_status
            instance.completion_date = (
                date.today() if new_status == "Closed" else None
            )
            instance.save()

        return Response(self.serializer_class(instance).data)


# =========================================================
#   COMPLIANCE CLAUSE VIEWSET (CORRECT & HARDENED)
# =========================================================
class ComplianceClauseViewSet(viewsets.ModelViewSet):
    serializer_class = ComplianceClauseSerializer
    queryset = ComplianceClause.objects.all()

    def get_queryset(self):
        qs = ComplianceClause.objects.all()
        standard = self.request.query_params.get("standard")

        # ✅ Only filter by standard for LIST views
        if self.action == "list" and standard:
            qs = qs.filter(standard=standard)

        # ✅ Always enforce numeric ordering
        return qs.order_by("clause_major", "clause_minor")

    # ---------- Forward-only status transitions ----------
    def partial_update(self, request, *args, **kwargs):
        clause = self.get_object()
        new_status = request.data.get("status")

        if not new_status or new_status == clause.status:
            return super().partial_update(request, *args, **kwargs)

        allowed_next = {
            "NI": "P",
            "P": "IP",
            "IP": "MI",
            "MI": "O",
            "O": None,
        }

        expected = allowed_next.get(clause.status)

        if expected is None:
            return Response(
                {"error": "Already optimized. Downgrades are not permitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status != expected:
            return Response(
                {
                    "error": "Invalid transition.",
                    "detail": f"Expected '{expected}' after '{clause.status}'.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status in {"MI", "O"} and not clause.evidence:
            return Response(
                {"error": "Evidence required before this transition."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().partial_update(request, *args, **kwargs)

    # ---------- Evidence upload / delete ----------
    @action(detail=True, methods=["post"])
    def evidence(self, request, pk=None):
        clause = self.get_object()
        file = request.FILES.get("evidence") or request.FILES.get("file")

        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        clause.evidence = file
        clause.save()
        return Response(
            ComplianceClauseSerializer(clause).data,
            status=status.HTTP_200_OK,
        )

    @evidence.mapping.delete
    def delete_evidence(self, request, pk=None):
        clause = self.get_object()
        had_file = bool(clause.evidence)

        clause.evidence.delete(save=True)

        if clause.status == "O":
            clause.status = "MI"
        elif clause.status == "MI":
            clause.status = "IP"

        clause.save()

        return Response(
            {
                "message": "Evidence removed.",
                "status_downgraded": had_file,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
#   DASHBOARD STATS (STANDARD-AWARE, SAFE DEFAULT)
# =========================================================
@api_view(["GET"])
def dashboard_stats(request):
    today = date.today()

    # ✅ Safe default prevents frontend crash
    standard = request.query_params.get("standard", "iso-7101")

    # === RISKS ===
    active_risks = Risk.objects.filter(status="Open", archived=False).count()

    risk_heatmap = (
        Risk.objects.filter(archived=False)
        .values("risk_level")
        .annotate(count=Count("id"))
    )

    heatmap = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for r in risk_heatmap:
        heatmap[r["risk_level"]] = r["count"]

    # === AUDITS ===
    audits_completed = Audit.objects.filter(status="Completed").count()
    audits_overdue = Audit.objects.filter(
        status="Scheduled", date__lt=today
    ).count()

    # === FINDINGS ===
    open_findings = Finding.objects.filter(status="Open").count()
    overdue_findings = Finding.objects.filter(
        status="Open", target_date__lt=today
    ).count()

    # === COMPLIANCE (PER STANDARD) ===
    clauses = ComplianceClause.objects.filter(standard=standard)
    total = clauses.count()

    breakdown = clauses.values("status").annotate(count=Count("id"))
    counts = {"NI": 0, "P": 0, "IP": 0, "MI": 0, "O": 0}
    for row in breakdown:
        counts[row["status"]] = row["count"]

    points = {"NI": 0, "P": 1, "IP": 2, "MI": 3, "O": 4}
    earned = sum(counts[s] * points[s] for s in counts)
    max_points = total * 4
    score = round((earned / max_points) * 100) if max_points else 0

    return Response(
        {
            "active_risks": active_risks,
            "risk_heatmap": heatmap,
            "audits_completed": audits_completed,
            "audits_overdue": audits_overdue,
            "open_findings": open_findings,
            "overdue_findings": overdue_findings,
            "compliance_status": counts,
            "compliance_score": score,
        }
    )
