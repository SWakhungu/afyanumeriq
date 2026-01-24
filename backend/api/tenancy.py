# backend/api/tenancy.py
from .models import Organization

PUBLIC_HOSTS = {
    "localhost",
    "127.0.0.1",
    "api",
    "www",
}

def extract_subdomain(host: str, base_domain: str = "afyanumeriq.com") -> str | None:
    """
    host examples:
      testorg.afyanumeriq.com
      api.afyanumeriq.com
      testorg.localhost
      localhost
    """
    host = (host or "").split(":")[0].lower()

    # local dev: testorg.localhost
    if host.endswith(".localhost"):
        sub = host.replace(".localhost", "")
        return sub if sub and sub not in PUBLIC_HOSTS else None

    # production: *.afyanumeriq.com
    if host.endswith("." + base_domain):
        sub = host[: -(len(base_domain) + 1)]
        return sub if sub and sub not in PUBLIC_HOSTS else None

    return None

def resolve_tenant_from_request(request) -> Organization | None:
    host = request.get_host()
    sub = extract_subdomain(host)
    if not sub:
        return None
    try:
        return Organization.objects.get(slug=sub)
    except Organization.DoesNotExist:
        return None
