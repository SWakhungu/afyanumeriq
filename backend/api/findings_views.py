"""
Audit Findings API Views with Role-Based Access Control

Permissions:
- Admin: Full CRUD access
- Auditor: Can create and close findings
- Staff: View-only access
"""

from datetime import date
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Audit, Finding
from .serializers import FindingSerializer


class FindingListView(APIView):
    """
    GET: List findings for an audit
    POST: Create new finding (auditor+)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, audit_id):
        """Get all findings for an audit"""
        try:
            audit = Audit.objects.get(pk=audit_id)
        except Audit.DoesNotExist:
            return Response({"detail": "Audit not found"}, status=404)

        findings = Finding.objects.filter(audit=audit).order_by("-id")
        serializer = FindingSerializer(findings, many=True)
        return Response(serializer.data)

    def post(self, request, audit_id):
        """Create new finding (auditor and admin only)"""
        # Check role
        user_role = getattr(request.user.profile, 'role', 'staff') if hasattr(request.user, 'profile') else 'staff'
        if user_role not in ['admin', 'auditor']:
            return Response(
                {"detail": "Only auditors and admins can create findings"},
                status=403
            )

        try:
            audit = Audit.objects.get(pk=audit_id)
        except Audit.DoesNotExist:
            return Response({"detail": "Audit not found"}, status=404)

        # Add audit to data
        data = request.data.copy()
        data['audit'] = audit.id

        serializer = FindingSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class FindingDetailView(APIView):
    """
    GET: Get finding details
    PATCH: Update finding status (auditor+)
    DELETE: Delete finding (admin only)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, finding_id):
        """Get finding details"""
        try:
            finding = Finding.objects.get(pk=finding_id)
        except Finding.DoesNotExist:
            return Response({"detail": "Finding not found"}, status=404)

        serializer = FindingSerializer(finding)
        return Response(serializer.data)

    def patch(self, request, finding_id):
        """Update finding (auditor+ can close, admin can edit fully)"""
        # Check role
        user_role = getattr(request.user.profile, 'role', 'staff') if hasattr(request.user, 'profile') else 'staff'
        if user_role not in ['admin', 'auditor']:
            return Response(
                {"detail": "Only auditors and admins can update findings"},
                status=403
            )

        try:
            finding = Finding.objects.get(pk=finding_id)
        except Finding.DoesNotExist:
            return Response({"detail": "Finding not found"}, status=404)

        # Auditors can only update status
        if user_role == 'auditor' and 'status' in request.data:
            new_status = request.data['status']
            finding.status = new_status
            if new_status == 'Closed':
                finding.completion_date = date.today()
            else:
                finding.completion_date = None
            finding.save()
            serializer = FindingSerializer(finding)
            return Response(serializer.data)

        # Admins can update anything
        if user_role == 'admin':
            serializer = FindingSerializer(finding, data=request.data, partial=True)
            if serializer.is_valid():
                if request.data.get('status') == 'Closed':
                    serializer.validated_data['completion_date'] = date.today()
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)

        return Response(
            {"detail": "Only auditors and admins can update findings"},
            status=403
        )

    def delete(self, request, finding_id):
        """Delete finding (admin only)"""
        # Check role
        user_role = getattr(request.user.profile, 'role', 'staff') if hasattr(request.user, 'profile') else 'staff'
        if user_role != 'admin':
            return Response(
                {"detail": "Only admins can delete findings"},
                status=403
            )

        try:
            finding = Finding.objects.get(pk=finding_id)
            finding.delete()
            return Response(status=204)
        except Finding.DoesNotExist:
            return Response({"detail": "Finding not found"}, status=404)
