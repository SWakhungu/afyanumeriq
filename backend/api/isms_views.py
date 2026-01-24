# backend/api/isms_views.py

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import IntegerField
from django.db.models.functions import Cast, Substr
from rest_framework.permissions import IsAuthenticated
from api.isms_audit_lock import is_iso27001_audit_locked
from .isms_models import Clause, Control, Asset, ISORisk, SoAEntry
from .isms_serializers import (
    ClauseSerializer,
    ControlSerializer,
    AssetSerializer,
    ISORiskSerializer,
    SoAEntrySerializer,
    SoAEntryUpdateSerializer,
)
from .isms_signals import compute_soa_completeness
from .tenant_mixins import TenantRequiredMixin

# ---------------------------------------------------------------------
# CLAUSES (GLOBAL LIBRARY)
# ---------------------------------------------------------------------
class ClauseListView(generics.ListAPIView):
    queryset = Clause.objects.all().order_by("code")
    serializer_class = ClauseSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["standard"]


# ---------------------------------------------------------------------
# CONTROLS (GLOBAL LIBRARY)
# ---------------------------------------------------------------------
class ControlListView(generics.ListAPIView):
    serializer_class = ControlSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["standard"]

    def get_queryset(self):
        return (
            Control.objects.filter(
                standard=self.request.query_params.get("standard", "iso-27001")
            )
            .annotate(
                chapter=Cast(Substr("code", 3, 1), IntegerField()),
                section=Cast(Substr("code", 5, 2), IntegerField()),
            )
            .order_by("chapter", "section")
        )


# ---------------------------------------------------------------------
# ASSETS (TENANT-SCOPED)
# ---------------------------------------------------------------------
class AssetListCreateView(generics.ListCreateAPIView):
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["standard", "classification", "asset_type"]

    def get_queryset(self):
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return Asset.objects.none()

        # Let DjangoFilterBackend apply filters AFTER tenant scoping
        return Asset.objects.filter(organization=tenant).order_by("-created_at")

    def perform_create(self, serializer):
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            raise ValueError("Tenant missing on request. Ensure TenantMiddleware is enabled.")
        serializer.save(organization=tenant)

# ---------------------------------------------------------------------
# RISKS (TENANT-SCOPED)
# ---------------------------------------------------------------------
class RiskListCreateView(generics.ListCreateAPIView):
    serializer_class = ISORiskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["standard", "status", "level"]

    def get_queryset(self):
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return ISORisk.objects.none()
        return ISORisk.objects.filter(organization=tenant).order_by("-created_at")

    def perform_create(self, serializer):
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            raise ValueError("Tenant missing on request. Ensure TenantMiddleware is enabled.")
        serializer.save(organization=tenant)

class RiskRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ISORiskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return ISORisk.objects.none()
        return ISORisk.objects.filter(organization=tenant)

    def update(self, request, *args, **kwargs):
        if is_iso27001_audit_locked():
            return Response(
                {"error": "ISMS is read-only while audit in progress."},
                status=status.HTTP_423_LOCKED,
            )
        return super().update(request, *args, **kwargs)

# ---------------------------------------------------------------------
# SoA LIST — AUTO-SEED ON FIRST LOAD (TENANT-SCOPED)
# ---------------------------------------------------------------------
class SoAListView(generics.ListAPIView):
    serializer_class = SoAEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["standard", "applicable", "status"]

    def get_queryset(self):
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return SoAEntry.objects.none()
        standard = self.request.query_params.get("standard", "iso-27001")

        qs = (
            SoAEntry.objects.filter(organization=tenant, standard=standard)
            .select_related("control")
            .annotate(
                chapter=Cast(Substr("control__code", 3, 1), IntegerField()),
                section=Cast(Substr("control__code", 5, 2), IntegerField()),
            )
            .order_by("chapter", "section")
        )

        if not qs.exists():
            self._auto_seed(tenant, standard)
            qs = (
                SoAEntry.objects.filter(organization=tenant, standard=standard)
                .select_related("control")
                .annotate(
                    chapter=Cast(Substr("control__code", 3, 1), IntegerField()),
                    section=Cast(Substr("control__code", 5, 2), IntegerField()),
                )
                .order_by("chapter", "section")
            )

        return qs

    @transaction.atomic
    def _auto_seed(self, tenant, standard: str):
        controls = Control.objects.filter(standard=standard)

        # ONLY Reduce risks justify applicability; must be tenant-scoped
        used_control_ids = set(
            ISORisk.objects.filter(
                organization=tenant,
                standard=standard,
                treatment="Reduce",
            ).values_list("controls__id", flat=True)
        )

        SoAEntry.objects.bulk_create(
            [
                SoAEntry(
                    organization=tenant,
                    control=control,
                    standard=standard,
                    applicable=control.id in used_control_ids,
                    status="Not Implemented",
                    justification="",
                    evidence_notes="",
                )
                for control in controls
            ]
        )


# ---------------------------------------------------------------------
# SoA UPDATE (PATCH) — TENANT-SCOPED QUERYSET
# ---------------------------------------------------------------------
class SoAEntryUpdateAPIView(generics.UpdateAPIView):
    serializer_class = SoAEntryUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return SoAEntry.objects.none()
        return SoAEntry.objects.filter(organization=tenant).select_related("control")   

    def partial_update(self, request, *args, **kwargs):
        super().partial_update(request, *args, **kwargs)
        instance = self.get_object()
        return Response(SoAEntrySerializer(instance, context={"request": request}).data)


# ---------------------------------------------------------------------
# SoA SUMMARY (TENANT-SCOPED)
# ---------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def soa_summary_view(request, standard_code="iso-27001"):
    tenant = getattr(request, "tenant", None)
    if not tenant:
        return Response({"detail": "Tenant missing"}, status=400)

    # If compute_soa_completeness is global today, you MUST make a tenant-aware variant.
    # Quick safe approach here: compute from tenant-scoped entries:
    total = SoAEntry.objects.filter(
        organization=tenant, standard=standard_code, applicable=True
    ).count()
    full = SoAEntry.objects.filter(
        organization=tenant, standard=standard_code, applicable=True, status="Full"
    ).count()
    pct = (full / total) * 100.0 if total else 0.0

    return Response({
        "total_applicable": total,
        "fully_implemented": full,
        "completeness_percent": round(pct, 2),
    })


# ---------------------------------------------------------------------
# ISO 27001 DASHBOARD (TENANT-SCOPED)
# ---------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def iso2701_dashboard_view(request):
    tenant = getattr(request, "tenant", None)
    if not tenant:
        return Response({"detail": "Tenant missing"}, status=400)
    standard = "iso-27001"

    # 1️⃣ Untreated risks (ISO-correct meaning of "open")
    untreated_risks = ISORisk.objects.filter(
        organization=tenant,
        standard=standard,
        treatment="Reduce",
        control_coverage="Untreated",
    ).count()

    # 2️⃣ Critical assets secured (%)
    total_high = Asset.objects.filter(
        organization=tenant,
        standard=standard,
        value="high",
    ).count()

    high_secure = Asset.objects.filter(
        organization=tenant,
        standard=standard,
        value="high",
        is_secure=True,
    ).count()

    critical_assets_secure_pct = (
        (high_secure / total_high) * 100.0 if total_high else 0.0
    )

    # 3️⃣ Applicable Annex A controls
    applicable_controls = SoAEntry.objects.filter(
        organization=tenant,
        applicable=True,
    ).count()

    # 4️⃣ SoA completeness, tenant-scoped
    total = SoAEntry.objects.filter(
        organization=tenant, standard=standard, applicable=True
    ).count()
    full = SoAEntry.objects.filter(
        organization=tenant, standard=standard, applicable=True, status="Full"
    ).count()
    completeness = (full / total) * 100.0 if total else 0.0

    return Response({
        # NOTE: key kept as "open_risks" for frontend compatibility
        "open_risks": untreated_risks,
        "critical_assets_secure_percent": round(critical_assets_secure_pct, 2),
        "applicable_annex_controls": applicable_controls,
        "soa_completeness_pct": round(completeness, 2),
    })
