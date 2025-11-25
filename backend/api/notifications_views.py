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
        notifications = []
        today = now().date()
        nid = 1  # incremental ID for frontend

        # ------- Risks -------
        for r in Risk.objects.all():
            if r.status == "Open":
                notifications.append({
                    "id": nid,
                    "type": "risk",
                    "severity": "warning",
                    "message": f'Risk "{r.description[:50]}..." remains open.',
                    "link": f"/risk/{r.id}"
                })
                nid += 1

            if r.review_date < today:
                notifications.append({
                    "id": nid,
                    "type": "risk",
                    "severity": "alert",
                    "message": f'Review overdue: {r.description[:50]}...',
                    "link": f"/risk/{r.id}"
                })
                nid += 1

        # ------- Audits -------
        for a in Audit.objects.all():
            if a.status == "Scheduled" and a.date < today:
                notifications.append({
                    "id": nid,
                    "type": "audit",
                    "severity": "alert",
                    "message": f'Audit "{a.audit_name}" is overdue.',
                    "link": f"/audit/{a.id}"
                })
                nid += 1

            if a.status == "Scheduled" and a.date >= today:
                notifications.append({
                    "id": nid,
                    "type": "audit",
                    "severity": "info",
                    "message": f'Audit "{a.audit_name}" is upcoming.',
                    "link": f"/audit/{a.id}"
                })
                nid += 1

        # ------- Findings -------
        for f in Finding.objects.all():
            if f.status == "Open" and f.target_date < today:
                notifications.append({
                    "id": nid,
                    "type": "finding",
                    "severity": "alert",
                    "message": f'Finding {f.finding_id} is overdue.',
                    "link": f"/finding/{f.id}"
                })
                nid += 1

            if f.status == "Open":
                notifications.append({
                    "id": nid,
                    "type": "finding",
                    "severity": "warning",
                    "message": f'Finding {f.finding_id} remains open.',
                    "link": f"/finding/{f.id}"
                })
                nid += 1

        # ------- Compliance (NO notifications for MVP)
        # Skipped as per your instructions

        # 🔥 Return flat list – REQUIRED for frontend
        return Response(notifications)
