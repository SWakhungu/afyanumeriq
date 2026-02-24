from rest_framework import serializers
from .tprm_models import ThirdParty, TPRMRisk, TPRMAssessment, TPRMDecision


class ThirdPartySerializer(serializers.ModelSerializer):
    class Meta:
        model = ThirdParty
        fields = [
            "id",
            "organization",
            "name",
            "category",
            "description",
            "criticality",
            "scope_of_dependency",
            "status",
            "relationship_owner",
            "contract_start_date",
            "contract_end_date",
            "review_frequency_months",
            "next_review_due",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]


class TPRMRiskSerializer(serializers.ModelSerializer):
    class Meta:
        model = TPRMRisk
        fields = [
            "id",
            "third_party",
            "title",
            "description",
            "risk_type",
            "likelihood",
            "impact",
            "inherent_risk_score",
            "residual_risk_score",
            "status",
            "owner",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "third_party", "inherent_risk_score", "created_at", "updated_at"]


class TPRMAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TPRMAssessment
        fields = [
            "id",
            "third_party",
            "assessment_type",
            "summary",
            "performed_by",
            "assessment_date",
            "valid_until",
            "created_at",
        ]
        read_only_fields = ["id", "third_party", "created_at"]


class TPRMDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TPRMDecision
        fields = [
            "id",
            "third_party",
            "decision",
            "justification",
            "approved_by",
            "decision_date",
            "created_at",
        ]
        read_only_fields = ["id", "third_party", "created_at"]
