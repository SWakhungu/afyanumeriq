# backend/api/settings_views.py
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.parsers import JSONParser

from .serializers import (
    OrganizationSerializer,
    CreateUserSerializer,
    UserDetailSerializer,
)
from .models import Organization, UserProfile

def get_tenant_or_400(request):
    """
    Tenant is resolved by middleware and attached to request.tenant.
    Returns (tenant, None) on success, otherwise (None, Response).
    """
    tenant = getattr(request, "tenant", None)
    if not tenant:
        return None, Response(
            {"detail": "Tenant not resolved. Use your organization subdomain."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return tenant, None


def require_org_admin_or_403(request):
    """
    Allow only:
    - Django superusers
    - users whose profile.role == 'admin' AND profile.organization == request.tenant
    Returns None if allowed, otherwise a Response.
    """
    user = request.user
    if user.is_superuser:
        return None

    tenant = getattr(request, "tenant", None)
    profile = getattr(user, "profile", None)

    if not tenant or not profile:
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    if profile.organization_id != tenant.id:
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    if profile.role != "admin":
        return Response({"detail": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)

    return None


# Organization endpoint
class OrganizationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Tenant resolved by middleware from subdomain
        org = getattr(request, "tenant", None)
        if not org:
            return Response(
                {"detail": "Tenant not resolved. Use your organization subdomain."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = OrganizationSerializer(org)
        return Response(serializer.data)

    def put(self, request):
        org = getattr(request, "tenant", None)
        if not org:
            return Response(
                {"detail": "Tenant not resolved. Use your organization subdomain."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update ONLY this tenant org (no create here)
        serializer = OrganizationSerializer(org, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# -------------------------
# User list and create
# -------------------------
class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant, err = get_tenant_or_400(request)
        if err:
            return err

        # ONLY users belonging to this tenant
        users = (
            User.objects.filter(profile__organization=tenant)
            .select_related("profile")
            .order_by("username")
        )
        serializer = UserDetailSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Create a user inside THIS tenant.
        Only org admins (or superuser) can create users.
        """
        tenant, err = get_tenant_or_400(request)
        if err:
            return err

        perm_err = require_org_admin_or_403(request)
        if perm_err:
            return perm_err

        serializer = CreateUserSerializer(
            data=request.data,
            context={"tenant": tenant, "request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()  # must create User + UserProfile(organization=tenant)
        detail = UserDetailSerializer(user)
        return Response(detail.data, status=status.HTTP_201_CREATED)


# -------------------------
# User detail, update, deactivate (soft-delete)
# -------------------------
class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object_in_tenant(self, tenant, user_id):
        """
        Fetch user ONLY if they belong to this tenant.
        """
        try:
            return User.objects.select_related("profile").get(
                id=user_id, profile__organization=tenant
            )
        except User.DoesNotExist:
            return None

    def get(self, request, user_id):
        tenant, err = get_tenant_or_400(request)
        if err:
            return err

        user = self.get_object_in_tenant(tenant, user_id)
        if not user:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserDetailSerializer(user)
        return Response(serializer.data)

    def put(self, request, user_id):
        """
        Update tenant user fields + profile.role/profile.department.
        Only org admins (or superuser) can update users.
        """
        tenant, err = get_tenant_or_400(request)
        if err:
            return err

        perm_err = require_org_admin_or_403(request)
        if perm_err:
            return perm_err

        user = self.get_object_in_tenant(tenant, user_id)
        if not user:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()

        # Optional mapping convenience:
        dept = data.get("department", None)
        role = data.get("role", None)

        if dept is not None or role is not None:
            data.setdefault("profile", {})
            if dept is not None:
                data["profile"]["department"] = dept
            if role is not None:
                data["profile"]["role"] = role

        serializer = UserDetailSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        """
        Soft-delete: mark user inactive. Idempotent.
        Only org admins (or superuser).
        """
        tenant, err = get_tenant_or_400(request)
        if err:
            return err

        perm_err = require_org_admin_or_403(request)
        if perm_err:
            return perm_err

        user = self.get_object_in_tenant(tenant, user_id)
        if not user:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        # Optional: prevent admins deactivating themselves
        if user.id == request.user.id:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response({"status": "deactivated"}, status=status.HTTP_200_OK)