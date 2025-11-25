from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .auth_views import LoginView, RefreshFromCookieView, LogoutView, MeView
from .settings_views import (
    OrganizationView,
    UserListView,
    UserDetailView,
)
from .findings_views import FindingListView, FindingDetailView
from .views import (
    RiskViewSet,
    AuditViewSet,
    FindingViewSet,
    ComplianceClauseViewSet,
    dashboard_stats,
)
from .reports import compliance_csv, compliance_pdf, risks_csv
from .reports import audits_csv
from .notifications_views import NotificationsView
from .auth_change_password import ChangePasswordView

router = DefaultRouter()
router.register(r"risks", RiskViewSet, basename="risk")
router.register(r"audits", AuditViewSet, basename="audit")
router.register(r"findings", FindingViewSet, basename="finding")
router.register(r"compliance", ComplianceClauseViewSet, basename="compliance-clause")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard-stats/", dashboard_stats, name="dashboard-stats"),

    # Reports
    path("reports/compliance.csv", compliance_csv),
    path("reports/compliance.pdf", compliance_pdf),
    path("reports/risks.csv", risks_csv),
    path("reports/audits.csv", audits_csv),
]

# ⭐ ADD THIS SECTION ANYWHERE BELOW
urlpatterns += [
    path("notifications/", NotificationsView.as_view(), name="notifications"),
]

# Findings
urlpatterns += [
    path("audits/<int:audit_id>/findings/", FindingListView.as_view()),
    path("findings/<int:finding_id>/", FindingDetailView.as_view()),
]

# Settings
urlpatterns += [
    path("settings/organization/", OrganizationView.as_view()),
    path("settings/users/", UserListView.as_view()),
    path("settings/users/<int:user_id>/", UserDetailView.as_view()),
    path("settings/change-password/", ChangePasswordView.as_view()),
]

# Auth
urlpatterns += [
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", RefreshFromCookieView.as_view()),
    path("auth/logout/", LogoutView.as_view()),
    path("auth/me/", MeView.as_view()),
]
