# backend/api/isms_audit_lock.py

from api.models import Audit


def is_iso27001_audit_locked():
    """
    ISMS is read-only ONLY while an ISO/IEC 27001 audit
    is actively IN PROGRESS.

    Scheduled audits → editable
    Completed audits → editable
    """
    return Audit.objects.filter(
        standard="iso-27001",
        status="In Progress",
    ).exists()
