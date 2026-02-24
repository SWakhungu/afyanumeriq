# backend/api/tenancy.py
from .models import Organization
from django.apps import apps

PUBLIC_HOSTS = {
    "localhost",
    "127.0.0.1",
}

def resolve_tenant_from_request(request):
    """
    Returns Organization for tenant subdomains.

    Supports local dev:
      - demo.localhost  -> slug "demo"

    Public hosts:
      - localhost
      - 127.0.0.1
    """
    Organization = apps.get_model("api", "Organization")

    host = (request.get_host() or "").split(":")[0].lower()
    if not host:
        return None

    if host in PUBLIC_HOSTS:
        return None

    parts = host.split(".")
    subdomain = None

    # demo.localhost
    if len(parts) == 2 and parts[1] == "localhost":
        subdomain = parts[0]

    # demo.example.com
    elif len(parts) >= 3:
        subdomain = parts[0]

    if not subdomain or subdomain in ("www", "api", "localhost"):
        return None

    try:
        return Organization.objects.get(slug=subdomain)
    except Organization.DoesNotExist:
        return None