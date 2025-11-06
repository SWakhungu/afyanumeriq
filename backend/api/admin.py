from django.contrib import admin
from .models import Risk, ComplianceClause, Audit, Finding

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
