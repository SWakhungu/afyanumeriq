# backend/api/isms_serializers.py

from rest_framework import serializers

from .isms_models import Clause, Control, Asset, ISORisk, SoAEntry
from .isms_signals import aggregate_risk_coverage_for_risk
from .models import Audit


# ============================================================
# ISO 27001 AUDIT LOCK (SINGLE SOURCE OF TRUTH)
# ============================================================
def is_iso27001_audit_locked():
    """
    Returns True if there is any ISO/IEC 27001 audit
    in progress or completed (i.e. ISMS state must be frozen).
    """
    return Audit.objects.filter(
        standard="iso-27001",
        status__in=["In Progress", "Completed"],
    ).exists()


# ---------------------------------------------------------------------
# CLAUSES (GLOBAL)
# ---------------------------------------------------------------------
class ClauseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clause
        fields = ["id", "code", "title", "text", "standard"]


# ---------------------------------------------------------------------
# CONTROLS (GLOBAL)
# ---------------------------------------------------------------------
class ControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = Control
        fields = ["id", "code", "title", "description", "group", "standard"]


# ---------------------------------------------------------------------
# ASSETS (TENANT-SCOPED via views; organization is read-only)
# ---------------------------------------------------------------------
class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = [
            "id",
            "asset_id",
            "name",
            "asset_type",
            "classification",
            "location",
            "legal_owner",
            "technical_owner",
            "value",
            "notes",
            "standard",
            "created_at",
            "is_secure",
        ]
        extra_kwargs = {
            "asset_id": {"read_only": True},
        }


# ---------------------------------------------------------------------
# RISKS (ISO/IEC 27001 CORE GOVERNANCE; TENANT-SCOPED)
# ---------------------------------------------------------------------
class ISORiskSerializer(serializers.ModelSerializer):
    # Read controls as full objects
    controls = serializers.SerializerMethodField()

    # Asset handling (read object, write ID)
    asset = AssetSerializer(read_only=True)
    asset_id = serializers.PrimaryKeyRelatedField(
        source="asset",
        queryset=Asset.objects.none(),  # IMPORTANT: tenant-scoped dynamically in get_fields()
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ISORisk
        fields = "__all__"
        extra_kwargs = {
            "organization": {"read_only": True},
            "risk_score": {"read_only": True},
            "level": {"read_only": True},
            "control_coverage": {"read_only": True},
        }

    def get_fields(self):
        """
        Ensure asset_id write field is tenant-scoped.
        Prevents cross-tenant linking.
        """
        fields = super().get_fields()

        request = self.context.get("request")
        tenant = getattr(request, "tenant", None) if request else None

        if tenant is not None and "asset_id" in fields:
            fields["asset_id"].queryset = Asset.objects.filter(organization=tenant)

        return fields

    # -----------------------------
    # READ helpers
    # -----------------------------
    def get_controls(self, obj):
        return ControlSerializer(obj.controls.all(), many=True).data

    # -----------------------------
    # VALIDATION (ISO governance)
    # -----------------------------
    def validate(self, attrs):
        # 🔒 HARD LOCK during ISO 27001 audit
        if is_iso27001_audit_locked():
            raise serializers.ValidationError(
                "ISMS is under audit. Risks cannot be modified."
            )

        treatment = attrs.get("treatment", getattr(self.instance, "treatment", None))
        justification = attrs.get(
            "acceptance_justification",
            getattr(self.instance, "acceptance_justification", "")
        )
        owner = attrs.get("owner", getattr(self.instance, "owner", ""))

        if treatment in ("Accept", "Transfer", "Avoid"):
            if not justification or not justification.strip():
                raise serializers.ValidationError({
                    "acceptance_justification": (
                        "Justification is required when risk treatment is "
                        "Accept, Transfer, or Avoid."
                    )
                })

            if not owner or not owner.strip():
                raise serializers.ValidationError({
                    "owner": (
                        "Risk owner is required when risk treatment is "
                        "Accept, Transfer, or Avoid."
                    )
                })

        return attrs

    # -----------------------------
    # CREATE logic (needed for controls M2M)
    # -----------------------------
    def create(self, validated_data):
        controls_data = self.initial_data.get("controls", None)

        instance = ISORisk.objects.create(**validated_data)

        if controls_data is not None:
            control_ids = [int(c) for c in controls_data if c is not None]
            instance.controls.set(Control.objects.filter(id__in=control_ids))

        # 🔁 Recompute coverage AFTER all changes
        aggregate_risk_coverage_for_risk(instance)

        return instance

    # -----------------------------
    # UPDATE logic
    # -----------------------------
    def update(self, instance, validated_data):
        controls_data = self.initial_data.get("controls", None)

        # Update scalar fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Auto-set owner from asset for non-reduce treatments
        if instance.treatment in ("Accept", "Transfer", "Avoid"):
            if not instance.owner and instance.asset:
                instance.owner = instance.asset.technical_owner

        instance.save()  # recompute score + level via model.save()

        # Update controls M2M explicitly
        if controls_data is not None:
            control_ids = [int(c) for c in controls_data if c is not None]
            instance.controls.set(Control.objects.filter(id__in=control_ids))

        # 🔁 Recompute coverage AFTER all changes
        aggregate_risk_coverage_for_risk(instance)

        return instance


# ---------------------------------------------------------------------
# SoA READ / LIST
# ---------------------------------------------------------------------
class SoAEntrySerializer(serializers.ModelSerializer):
    control = ControlSerializer(read_only=True)
    linked_risks = serializers.SerializerMethodField()

    class Meta:
        model = SoAEntry
        fields = [
            "id",
            "standard",
            "control",
            "applicable",
            "status",
            "justification",
            "evidence_notes",
            "linked_risks",
        ]
        extra_kwargs = {
            "organization": {"read_only": True},
        }

    def get_linked_risks(self, obj):
        #tenant-scoped: only risks from the same organization
        risks = (
            ISORisk.objects
            .filter(
                organization=obj.organization,
                controls=obj.control,
                standard=obj.standard,
            )
            .select_related("asset")
            .order_by("-created_at")
        )

        return [
            {
                "risk_id": risk.id,
                "risk_title": risk.title,
                "asset_name": risk.asset.name if risk.asset else None,
                "asset_id": risk.asset.asset_id if risk.asset else None,
            }
            for risk in risks
        ]


# ---------------------------------------------------------------------
# SoA UPDATE (PATCH)
# ---------------------------------------------------------------------
class SoAEntryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoAEntry
        fields = [
            "applicable",
            "status",
            "justification",
            "evidence_notes",
        ]

    def validate(self, attrs):
        # 🔒 HARD LOCK during ISO 27001 audit
        if is_iso27001_audit_locked():
            raise serializers.ValidationError(
                "ISMS is under audit. Statement of Applicability cannot be modified."
            )

        justification = attrs.get(
            "justification",
            self.instance.justification
        )

        if not justification or not justification.strip():
            raise serializers.ValidationError({
                "justification": (
                    "Justification is required for both inclusion "
                    "and exclusion of a control."
                )
            })

        return attrs
