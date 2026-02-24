# backend/api/tenant_mixins.py
from rest_framework.exceptions import ValidationError


class TenantRequiredMixin:
    """
    Mixin for DRF APIViews/ViewSets that ensures request.tenant exists.
    Use in views: tenant = self.get_tenant()
    """

    def get_tenant(self):
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            raise ValidationError("Tenant not resolved.")
        return tenant


class TenantScopedAPIView:
    """
    Backwards-compatible helper (if any older views still use it).
    Use: tenant = self.get_tenant(request)
    """

    def get_tenant(self, request):
        tenant = getattr(request, "tenant", None)
        if not tenant:
            raise ValidationError("Tenant not resolved.")
        return tenant
