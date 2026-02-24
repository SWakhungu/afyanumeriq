# backend/api/admin_isms.py
from django.contrib import admin
from .isms_models import Clause, Control, Asset, Risk, SoAEntry

@admin.register(Clause)
class ClauseAdmin(admin.ModelAdmin):
    list_display = ("standard", "code", "title")
    search_fields = ("code", "title", "text")

@admin.register(Control)
class ControlAdmin(admin.ModelAdmin):
    list_display = ("standard", "code", "title", "group")
    search_fields = ("code", "title", "description")

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ("asset_id", "name", "classification", "value", "standard", "created_at")
    search_fields = ("asset_id", "name", "legal_owner", "technical_owner")

@admin.register(Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display = ("title", "asset", "risk_score", "level", "status", "standard", "created_at")
    search_fields = ("title", "description", "owner")

@admin.register(SoAEntry)
class SoAEntryAdmin(admin.ModelAdmin):
    list_display = ("control", "applicable", "status", "standard", "updated_at")
    search_fields = ("control__code", "control__title", "justification")
