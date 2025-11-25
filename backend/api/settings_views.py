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

# Organization endpoint
class OrganizationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = Organization.objects.first()
        if not org:
            return Response({}, status=status.HTTP_200_OK)
        serializer = OrganizationSerializer(org)
        return Response(serializer.data)

    def put(self, request):
        org = Organization.objects.first()
        if not org:
            # create if not exists (MVP behavior)
            serializer = OrganizationSerializer(data=request.data)
        else:
            serializer = OrganizationSerializer(org, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# User list and create
class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.all().select_related("profile")
        serializer = UserDetailSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Create user (admin). CreateUserSerializer handles User + Profile.
        """
        serializer = CreateUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        detail = UserDetailSerializer(user)
        return Response(detail.data, status=status.HTTP_201_CREATED)


# User detail, update, deactivate (soft-delete)
class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    def get(self, request, user_id):
        user = self.get_object(user_id)
        if not user:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserDetailSerializer(user)
        return Response(serializer.data)

    def put(self, request, user_id):
        user = self.get_object(user_id)
        if not user:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        # accept updates to username/email/first_name/last_name/is_active
        data = request.data.copy()

        # If department provided at top-level (front-end convenience), map to profile.department
        dept = data.get("department", None)
        if dept is not None:
            data["profile"] = {"department": dept}

        # If role provided at top-level, map to profile.role
        role = data.get("role", None)
        if role is not None:
            data.setdefault("profile", {})
            data["profile"]["role"] = role

        serializer = UserDetailSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        """
        Soft-delete: mark user inactive. Idempotent.
        """
        user = self.get_object(user_id)
        if not user:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        user.is_active = False
        user.save()
        return Response({"status": "deactivated"}, status=status.HTTP_200_OK)
