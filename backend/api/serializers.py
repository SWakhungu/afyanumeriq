# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .isms_models import Clause, Control
from .isms_serializers import ClauseSerializer, ControlSerializer
from django.db import transaction, IntegrityError
from .models import (
    Risk,
    ComplianceClause,
    Audit,
    Finding,
    Organization,
    UserProfile,
)


# ---------------------------------------------------------
# ORGANIZATION SERIALIZER
# ---------------------------------------------------------
class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = "__all__"
        read_only_fields = ("id", "logo", "created_at", "updated_at")
        extra_kwargs = {
            "website": {"allow_blank": True, "required": False},
            "email": {"allow_blank": True, "required": False},
            "phone": {"allow_blank": True, "required": False},
            "address": {"allow_blank": True, "required": False},
        }


# ---------------------------------------------------------
# USER PROFILE SERIALIZER
# ---------------------------------------------------------
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "department",
            "created_at",
        )
        read_only_fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "created_at",
        )


# ---------------------------------------------------------
# USER DETAILS (LIST + EDIT)
# ---------------------------------------------------------
class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    department = serializers.CharField(
        source="profile.department", required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "profile",
            "department",
        )
        read_only_fields = ("id",)

    def update(self, instance, validated_data):
        # handle department
        profile_fields = validated_data.pop("profile", {})
        dept = profile_fields.get("department")

        if dept is not None:
            instance.profile.department = dept
            instance.profile.save()

        # Update User fields normally
        return super().update(instance, validated_data)


# ---------------------------------------------------------
# RISK SERIALIZER
# ---------------------------------------------------------
class RiskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Risk
        fields = "__all__"
        read_only_fields = ("risk_score", "risk_level", "organization")

    def _level_from_score(self, score: float) -> str:
        if score <= 5:
            return "Low"
        if score <= 12:
            return "Medium"
        if score <= 20:
            return "High"
        return "Critical"

    def create(self, validated_data):
        likelihood = float(validated_data.get("likelihood"))
        impact = float(validated_data.get("impact"))
        score = likelihood * impact
        validated_data["risk_score"] = score
        validated_data["risk_level"] = self._level_from_score(score)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        likelihood = float(validated_data.get("likelihood", instance.likelihood))
        impact = float(validated_data.get("impact", instance.impact))
        score = likelihood * impact
        validated_data["risk_score"] = score
        validated_data["risk_level"] = self._level_from_score(score)
        return super().update(instance, validated_data)


class ComplianceClauseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplianceClause
        fields = (
            "id",
            "clause_number",
            "short_description",
            "status",
            "owner",
            "comments",
            "evidence",
            "last_updated",
        )


class FindingSerializer(serializers.ModelSerializer):
    clause = ClauseSerializer(read_only=True)
    clause_id = serializers.PrimaryKeyRelatedField(
        source="clause",
        queryset=Clause.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    controls = ControlSerializer(many=True, read_only=True)
    control_ids = serializers.PrimaryKeyRelatedField(
        source="controls",
        queryset=Control.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )    
    class Meta:
        model = Finding
        fields = "__all__"


class AuditSerializer(serializers.ModelSerializer):
    findings = FindingSerializer(many=True, read_only=True)

    # ✅ Prevent frontend from being forced to send organization
    organization = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Audit
        fields = "__all__"
        read_only_fields = ("organization",)

    # --------------------------------------------------
    # VALIDATION (STANDARD-AWARE, ISO-GOVERNED)
    # --------------------------------------------------
    def validate(self, attrs):
        standard = attrs.get("standard", getattr(self.instance, "standard", None))
        if not standard:
            raise serializers.ValidationError({
                "standard": "Audit standard must be specified explicitly."
            })

        if standard == "iso-27001":
            scope = attrs.get("scope", getattr(self.instance, "scope", None))
            if not scope or not scope.strip():
                raise serializers.ValidationError({
                    "scope": "ISMS audit scope is required for ISO/IEC 27001 audits."
                })
        return attrs

    # --------------------------------------------------
    # CREATE (ENFORCE STANDARD + TENANT)
    # --------------------------------------------------
    def create(self, validated_data):
        request = self.context.get("request")
        if not request:
            raise serializers.ValidationError({"detail": "Request context missing."})

        # ✅ Tenant (Organization) comes from middleware
        tenant = getattr(request, "tenant", None)
        if not tenant:
            raise serializers.ValidationError({
                "organization": "Tenant missing on request. Ensure TenantMiddleware is enabled."
            })

        # 🔒 Enforce explicit standard on creation
        standard = request.data.get("standard")
        if not standard:
            raise serializers.ValidationError({
                "standard": "Audit standard must be explicitly provided at creation."
            })

        validated_data["standard"] = standard
        validated_data["organization"] = tenant  # ✅ key fix
        return super().create(validated_data)

    # --------------------------------------------------
    # UPDATE (PREVENT CROSS-STANDARD BLEED)
    # --------------------------------------------------
    def update(self, instance, validated_data):
        validated_data.pop("standard", None)
        validated_data.pop("organization", None)  # ✅ also immutable
        return super().update(instance, validated_data)
# ---------------------------------------------------------
# CREATE USER
# ---------------------------------------------------------
class CreateUserSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES)
    department = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def create(self, validated_data):
        tenant = self.context.get("tenant")
        if not tenant:
            raise serializers.ValidationError({"detail": "Tenant not provided (serializer context missing)."})

        dept = (validated_data.pop("department", "") or "").strip()
        role = validated_data.pop("role")
        validated_data["username"] = validated_data["username"].strip()

        try:
            with transaction.atomic():
                user = User.objects.create_user(**validated_data)

                UserProfile.objects.create(
                    user=user,
                    organization=tenant,   # ✅ REQUIRED
                    role=role,
                    department=dept,
                )

                return user

        except IntegrityError as e:
            # Turns DB explosions into a clean 400 with a helpful message
            raise serializers.ValidationError({"detail": f"Could not create user (DB constraint): {str(e)}"})