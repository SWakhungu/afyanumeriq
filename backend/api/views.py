from datetime import date
from django.db.models import Count, IntegerField, Value, F
from django.db.models.functions import Cast, Substr, StrIndex
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
#   RISK VIEWSET (with archive + filters + sorting)
# =========================================================
class RiskViewSet(viewsets.ModelViewSet):
    queryset = Risk.objects.all()
    serializer_class = RiskSerializer

    def get_queryset(self):
        qs = Risk.objects.all()

        # Filters
        status_filter = self.request.query_params.get("status")
        level_filter = self.request.query_params.get("risk_level")
        owner_filter = self.request.query_params.get("owner")
        archived = self.request.query_params.get("archived")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if level_filter:
            qs = qs.filter(risk_level=level_filter)
        if owner_filter:
            qs = qs.filter(owner=owner_filter)

        if archived == "true":
            qs = qs.filter(archived=True)
        else:
            qs = qs.filter(archived=False)

        # Sorting
        sort = self.request.query_params.get("sort")
        if sort == "score_desc":
            qs = qs.order_by("-risk_score")
        elif sort == "score_asc":
            qs = qs.order_by("risk_score")

        return qs

    def destroy(self, request, *args, **kwargs):
        """Soft delete → archive instead of delete."""
        instance = self.get_object()
        instance.archived = True
        instance.save()
        return Response({"message": "Risk archived"}, status=status.HTTP_200_OK)


# =========================================================
#   AUDIT VIEWSET (block completion if open findings exist)
# =========================================================
class AuditViewSet(viewsets.ModelViewSet):
    queryset = Audit.objects.all()
    serializer_class = AuditSerializer

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
#   FINDINGS VIEWSET (PATCH support + auto completion_date)
# =========================================================
class FindingViewSet(viewsets.ModelViewSet):
    queryset = Finding.objects.all()
    serializer_class = FindingSerializer

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get("status")

        if new_status:
            instance.status = new_status
            if new_status == "Closed":
                instance.completion_date = date.today()
            else:
                instance.completion_date = None
            instance.save()

        return Response(self.serializer_class(instance).data)


# =========================================================
#   COMPLIANCE CLAUSE VIEWSET
#   - CRUD + evidence upload/delete
#   - Forward-only status transitions
#   - Evidence-required rules for MI/O
#   - ✅ Natural clause sorting (DB-level)
# =========================================================
class ComplianceClauseViewSet(viewsets.ModelViewSet):
    serializer_class = ComplianceClauseSerializer

    def get_queryset(self):
        """
        Natural numeric sorting:
        4.1 < 4.2 < 8.2 < 8.10 < 10.1
        """
        return (
            ComplianceClause.objects
            .annotate(
                dot_pos=StrIndex("clause_number", Value(".")),
                part1=Cast(Substr("clause_number", 1, F("dot_pos") - 1), IntegerField()),
                part2=Cast(Substr("clause_number", F("dot_pos") + 1), IntegerField()),
            )
            .order_by("part1", "part2")
        )

    # ---------- Status transition guard (forward-only) ----------
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

        current = clause.status
        expected_next = allowed_next.get(current)

        if expected_next is None:
            return Response(
                {"error": "Status is already at Optimized. Downgrades are not permitted."},
                status=400,
            )

        if new_status != expected_next:
            return Response(
                {
                    "error": "Invalid transition.",
                    "detail": f"Allowed next state from '{current}' is '{expected_next}'.",
                },
                status=400,
            )

        # Evidence required for MI or O
        if new_status in {"MI", "O"} and not clause.evidence:
            return Response(
                {
                    "error": "Evidence required.",
                    "detail": f"Cannot move to '{new_status}' without uploading evidence first.",
                },
                status=400,
            )

        return super().partial_update(request, *args, **kwargs)

    # ---------- Evidence upload / delete ----------
    @action(detail=True, methods=["post"])
    def evidence(self, request, pk=None):
        clause = self.get_object()
        file = request.FILES.get("evidence") or request.FILES.get("file")

        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        clause.evidence = file
        clause.save()

        # ✅ Return full updated clause JSON
        return Response(ComplianceClauseSerializer(clause).data, status=200)

    @evidence.mapping.delete
    def delete_evidence(self, request, pk=None):
        clause = self.get_object()
        had_file = bool(clause.evidence)

        clause.evidence.delete(save=True)

        downgraded_from = None
        downgraded_to = None

        if clause.status == "O":
            downgraded_from, downgraded_to = "O", "MI"
            clause.status = "MI"
            clause.save()
        elif clause.status == "MI":
            downgraded_from, downgraded_to = "MI", "IP"
            clause.status = "IP"
            clause.save()

        if not had_file:
            return Response({"message": "No evidence existed."})

        if downgraded_from:
            return Response(
                {
                    "message": "Evidence removed.",
                    "status_downgraded": True,
                    "from": downgraded_from,
                    "to": downgraded_to,
                }
            )

        return Response({"message": "Evidence removed."})


# =========================================================
#   DASHBOARD STATS (0–4 scoring model, lite output)
# =========================================================
@api_view(["GET"])
def dashboard_stats(request):
    today = date.today()

    # === RISKS ===
    active_risks = Risk.objects.filter(status="Open", archived=False).count()
    risk_heatmap = Risk.objects.filter(archived=False).values("risk_level").annotate(
        count=Count("id")
    )
    heatmap_dict = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for r in risk_heatmap:
        heatmap_dict[r["risk_level"]] = r["count"]

    # === AUDITS ===
    audits_completed = Audit.objects.filter(status="Completed").count()
    audits_overdue = Audit.objects.filter(status="Scheduled", date__lt=today).count()

    # === FINDINGS ===
    open_findings = Finding.objects.filter(status="Open").count()
    overdue_findings = Finding.objects.filter(
        status="Open", target_date__lt=today
    ).count()

    # === COMPLIANCE (0–100 score)
    comp_breakdown = (
        ComplianceClause.objects.values("status")
        .annotate(count=Count("id"))
        .order_by()
    )

    status_counts = {"NI": 0, "P": 0, "IP": 0, "MI": 0, "O": 0}
    for row in comp_breakdown:
        status_counts[row["status"]] = row["count"]

    STATUS_POINTS = {"NI": 0, "P": 1, "IP": 2, "MI": 3, "O": 4}
    MAX_POINTS = 34 * 4

    earned_points = sum(status_counts[s] * STATUS_POINTS[s] for s in status_counts)
    compliance_score = round((earned_points / MAX_POINTS) * 100) if MAX_POINTS else 0

    return Response(
        {
            "active_risks": active_risks,
            "risk_heatmap": heatmap_dict,
            "audits_completed": audits_completed,
            "audits_overdue": audits_overdue,
            "open_findings": open_findings,
            "overdue_findings": overdue_findings,
            "compliance_status": {
                "not_implemented": status_counts["NI"],
                "planned": status_counts["P"],
                "in_progress": status_counts["IP"],
                "mostly_implemented": status_counts["MI"],
                "optimized": status_counts["O"],
            },
            "compliance_score": compliance_score,
        }
    )
