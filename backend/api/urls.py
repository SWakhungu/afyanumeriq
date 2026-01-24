from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .auth_views import LoginView, RefreshFromCookieView, LogoutView, MeView
from .settings_views import OrganizationView, UserListView, UserDetailView
from .findings_views import FindingListView, FindingDetailView
from .views import (
    RiskViewSet,
    AuditViewSet,
    FindingViewSet,
    ComplianceClauseViewSet,
    dashboard_stats,
)

# ISO 7101 (legacy / default)
from .reports import (
    compliance_csv,
    compliance_pdf,
    risks_csv,
    audits_csv,
)

# ISO/IEC 27001 (ISMS)
from .reports_27001 import (
    iso27001_compliance_csv,
    soa_csv,
    iso27001_risks_csv,
    assets_csv,
    iso27001_audits_csv,
)

from .notifications_views import NotificationsView
from .auth_change_password import ChangePasswordView
from .isms_views import (
    ClauseListView,
    ControlListView,
    AssetListCreateView,
    RiskListCreateView,
    RiskRetrieveUpdateView,
    SoAListView,
    SoAEntryUpdateAPIView,
    soa_summary_view,
    iso2701_dashboard_view,
)

# -------------------------
# DRF Routers (UNCHANGED)
# -------------------------
router = DefaultRouter()
router.register(r"risks", RiskViewSet, basename="risk")
router.register(r"audits", AuditViewSet, basename="audit")
router.register(r"findings", FindingViewSet, basename="finding")
router.register(r"compliance", ComplianceClauseViewSet, basename="compliance-clause")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard-stats/", dashboard_stats, name="dashboard-stats"),
]

# ============================================================
# ISO 7101 REPORTS (DEFAULT / LEGACY – DO NOT BREAK)
# Accessible from: /reports
# ============================================================
urlpatterns += [
    path("reports/compliance.csv", compliance_csv),
    path("reports/compliance.pdf", compliance_pdf),
    path("reports/risks.csv", risks_csv),
    path("reports/audits.csv", audits_csv),
]

# ============================================================
# ISO/IEC 27001 REPORTS (ISMS)
# Accessible from: /27001/reports
# ============================================================
urlpatterns += [
    path("27001/reports/compliance.csv", iso27001_compliance_csv),
    path("27001/reports/soa.csv", soa_csv),
    path("27001/reports/risks.csv", iso27001_risks_csv),
    path("27001/reports/assets.csv", assets_csv),
    path("27001/reports/audits.csv", iso27001_audits_csv),
]

# -------------------------
# Notifications
# -------------------------
urlpatterns += [
    path("notifications/", NotificationsView.as_view(), name="notifications"),
]

# -------------------------
# Findings
# -------------------------
urlpatterns += [
    path("audits/<int:audit_id>/findings/", FindingListView.as_view()),
    path("findings/<int:finding_id>/", FindingDetailView.as_view()),
]

# -------------------------
# Settings
# -------------------------
urlpatterns += [
    path("settings/organization/", OrganizationView.as_view()),
    path("settings/users/", UserListView.as_view()),
    path("settings/users/<int:user_id>/", UserDetailView.as_view()),
    path("settings/change-password/", ChangePasswordView.as_view()),
]

# -------------------------
# Auth
# -------------------------
urlpatterns += [
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", RefreshFromCookieView.as_view()),
    path("auth/logout/", LogoutView.as_view()),
    path("auth/me/", MeView.as_view()),
]

# -------------------------
# ISMS (shared infrastructure)
# -------------------------
urlpatterns += [
    path("isms/clauses/", ClauseListView.as_view(), name="isms-clauses"),
    path("isms/controls/", ControlListView.as_view(), name="isms-controls"),
    path("isms/assets/", AssetListCreateView.as_view(), name="isms-assets"),
    path("isms/risks/", RiskListCreateView.as_view(), name="isms-risks"),
    path("isms/risks/<int:pk>/", RiskRetrieveUpdateView.as_view(), name="isms-risk-detail"),
    path("isms/soa/", SoAListView.as_view(), name="isms-soa"),
]

# -------------------------
# ISO/IEC 27001-specific views
# -------------------------
urlpatterns += [
    path("27001/soa/", SoAListView.as_view(), name="soa-list"),
    path("27001/soa/entries/<int:pk>/", SoAEntryUpdateAPIView.as_view(), name="soaentry-update"),
    path("27001/soa/summary/", soa_summary_view, name="soa-summary"),
    path("27001/dashboard/overview/", iso2701_dashboard_view, name="iso27001-dashboard"),
]
