# api/serializers.py
from rest_framework import serializers
from .models import Risk, ComplianceClause, Audit, Finding

class RiskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Risk
        fields = "__all__"
        read_only_fields = ("risk_score", "risk_level")  # computed server-side

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
        fields = ("id",
            "clause_number",
            "short_description",
            "status",
            "owner",
            "comments",
            "evidence",
            "last_updated",)


class FindingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Finding
        fields = "__all__"


class AuditSerializer(serializers.ModelSerializer):
    findings = FindingSerializer(many=True, read_only=True)

    class Meta:
        model = Audit
        fields = "__all__"
