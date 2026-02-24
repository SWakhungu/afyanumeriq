from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import User
from .tprm_models import ThirdParty, TPRMRisk, TPRMAssessment, TPRMDecision
from .models import Risk, ComplianceClause, Audit, Finding, Organization, UserProfile, PlatformUpdate


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at", "updated_at")
    search_fields = ("name", "slug")
    ordering = ("name",)


@admin.register(Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display = ("risk_id", "risk_level", "owner", "status", "review_date")
    search_fields = ("risk_id", "description", "owner", "status")
    list_filter = ("risk_level", "status", "review_date")


@admin.register(ComplianceClause)
class ComplianceClauseAdmin(admin.ModelAdmin):
    list_display = ("clause_number", "status", "last_updated")
    list_filter = ("status",)
    search_fields = ("clause_number", "description")


@admin.register(Audit)
class AuditAdmin(admin.ModelAdmin):
    list_display = ("audit_id", "audit_name", "lead_auditor", "status", "date")
    list_filter = ("status", "date")
    search_fields = ("audit_name", "lead_auditor")


@admin.register(Finding)
class FindingAdmin(admin.ModelAdmin):
    list_display = ("finding_id", "audit", "severity", "status", "target_date")
    list_filter = ("severity", "status")
    search_fields = ("finding_id", "description", "audit__audit_name")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "organization", "role", "department", "created_at")
    list_filter = ("organization", "role")
    search_fields = (
        "user__username",
        "user__email",
        "organization__name",
        "organization__slug",
    )
    ordering = ("organization__name", "user__username")


@admin.register(PlatformUpdate)
class PlatformUpdateAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "date")
    list_filter = ("category", "date")
    search_fields = ("title", "description")
    ordering = ("-date",)
    readonly_fields = ("created_at", "updated_at")


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0
    max_num = 1


class UserAdmin(DjangoUserAdmin):
    inlines = [UserProfileInline]


try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

admin.site.register(User, UserAdmin)

admin.site.register(ThirdParty)
admin.site.register(TPRMRisk)
admin.site.register(TPRMAssessment)
admin.site.register(TPRMDecision)