from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.timezone import now

from .models import Risk, ComplianceClause, Audit, Finding


class NotificationsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ✅ TENANT-SCOPED: only get tenant from request
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return Response([], status=200)

        # ✅ STANDARD-SCOPED: filter by active standard if provided
        standard_filter = request.query_params.get("standard", None)

        notifications = []
        today = now().date()
        nid = 1  # incremental ID for frontend

        # Helper function to get the standard path prefix
        def get_standard_path(standard):
            """Convert standard code to URL path prefix (e.g., 'iso-7101' -> '/7101')"""
            standard_paths = {
                "iso-7101": "/7101",
                "iso-27001": "/27001",
                "iso-42001": "/42001",
                "iso-13485": "/13485",
                "iso-15189": "/15189",
                "iso-17025": "/17025",
            }
            return standard_paths.get(standard, "/7101")

        # ------- Risks (Tenant-scoped, ISO 7101) -------
        if not standard_filter or standard_filter == "iso-7101":
            for r in Risk.objects.filter(organization=tenant):
                if r.status == "Open":
                    notifications.append({
                        "id": nid,
                        "type": "risk",
                        "severity": "warning",
                        "message": f'Risk "{r.description[:50]}..." remains open.',
                        "link": f"/7101/risk/{r.id}",
                        "standard": "iso-7101",
                    })
                    nid += 1

                if r.review_date < today:
                    notifications.append({
                        "id": nid,
                        "type": "risk",
                        "severity": "alert",
                        "message": f'Review overdue: {r.description[:50]}...',
                        "link": f"/7101/risk/{r.id}",
                        "standard": "iso-7101",
                    })
                    nid += 1

        # ------- Audits (Tenant-scoped, Standard-aware) -------
        for a in Audit.objects.filter(organization=tenant):
            if standard_filter and a.standard != standard_filter:
                continue
            
            standard_path = get_standard_path(a.standard)
            
            if a.status == "Scheduled" and a.date < today:
                notifications.append({
                    "id": nid,
                    "type": "audit",
                    "severity": "alert",
                    "message": f'Audit "{a.audit_name}" is overdue.',
                    "link": f"{standard_path}/audit/{a.id}",
                    "standard": a.standard,
                })
                nid += 1

            if a.status == "Scheduled" and a.date >= today:
                notifications.append({
                    "id": nid,
                    "type": "audit",
                    "severity": "info",
                    "message": f'Audit "{a.audit_name}" is upcoming.',
                    "link": f"{standard_path}/audit/{a.id}",
                    "standard": a.standard,
                })
                nid += 1

        # ------- Findings (Tenant-scoped via related Audit, Standard-aware) -------
        for f in Finding.objects.filter(audit__organization=tenant):
            if standard_filter and f.audit.standard != standard_filter:
                continue
            
            standard_path = get_standard_path(f.audit.standard)
            
            if f.status == "Open" and f.target_date < today:
                notifications.append({
                    "id": nid,
                    "type": "finding",
                    "severity": "alert",
                    "message": f'Finding {f.finding_id} is overdue.',
                    "link": f"{standard_path}/audit/findings/{f.id}",
                    "standard": f.audit.standard,
                })
                nid += 1

            if f.status == "Open":
                notifications.append({
                    "id": nid,
                    "type": "finding",
                    "severity": "warning",
                    "message": f'Finding {f.finding_id} remains open.',
                    "link": f"{standard_path}/audit/findings/{f.id}",
                    "standard": f.audit.standard,
                })
                nid += 1

        # ------- Compliance (NO notifications for MVP)
        # Skipped as per your instructions

        # 🔥 Return flat list – REQUIRED for frontend
        return Response(notifications)
