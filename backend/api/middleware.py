# backend/api/middleware.py
from django.http import JsonResponse
from .tenancy import resolve_tenant_from_request

class TenantMiddleware:
    """
    Attaches request.tenant (Organization) based on subdomain.
    Rejects requests to tenant-scoped endpoints if tenant is missing/invalid.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant = resolve_tenant_from_request(request)

        # You can tune this allowlist:
        # - allow admin site, health checks, auth, etc. without tenant if needed.
        path = request.path or ""

        # Example: API should require tenant for almost everything
        tenant_required = path.startswith("/api/") and not (
            path.startswith("/api/auth/")  # keep auth optionally tenantless if you want
        )

        if tenant_required and request.tenant is None:
            return JsonResponse(
                {"detail": "Tenant not resolved. Use your organization subdomain."},
                status=400,
            )

        return self.get_response(request)
