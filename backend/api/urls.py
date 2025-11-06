from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RiskViewSet,
    AuditViewSet,
    FindingViewSet,
    ComplianceClauseViewSet,
    dashboard_stats,
)
from .reports import compliance_csv, compliance_pdf, risks_csv

router = DefaultRouter()
router.register(r"risks", RiskViewSet, basename="risk")
router.register(r"audits", AuditViewSet, basename="audit")
router.register(r"findings", FindingViewSet, basename="finding")
router.register(r"compliance", ComplianceClauseViewSet, basename="compliance-clause")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard-stats/", dashboard_stats, name="dashboard-stats"),

    # Reports (MVP - public)
    path("reports/compliance.csv", compliance_csv, name="reports-compliance-csv"),
    path("reports/compliance.pdf", compliance_pdf, name="reports-compliance-pdf"),
    path("reports/risks.csv", risks_csv, name="reports-risks-csv"),
]
