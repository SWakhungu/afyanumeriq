from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .tprm_models import ThirdParty, TPRMRisk, TPRMAssessment, TPRMDecision
from .tprm_serializers import (
    ThirdPartySerializer,
    TPRMRiskSerializer,
    TPRMAssessmentSerializer,
    TPRMDecisionSerializer,
)


def get_tenant(request):
    """
    Resolve the active organization ("tenant") from the request.

    Based on your codebase:
    - You already use request.user.profile in multiple places.
    - Most likely the org is stored at request.user.profile.organization.

    Fallbacks are included to avoid breaking admin/special users.
    """
    user = request.user

    # 1) Most likely pattern in your project
    if hasattr(user, "profile") and user.profile and hasattr(user.profile, "organization"):
        tenant = user.profile.organization
        if tenant:
            return tenant

    # 2) Fallback: org directly on user (some setups do this)
    if hasattr(user, "organization"):
        tenant = getattr(user, "organization", None)
        if tenant:
            return tenant

    raise PermissionDenied("No tenant/organization context found for this user.")


class ThirdPartyListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ThirdPartySerializer

    def get_queryset(self):
        tenant = get_tenant(self.request)
        return ThirdParty.objects.filter(organization=tenant).order_by("name")

    def perform_create(self, serializer):
        tenant = get_tenant(self.request)
        serializer.save(organization=tenant)


class ThirdPartyDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ThirdPartySerializer
    lookup_field = "id"

    def get_queryset(self):
        tenant = get_tenant(self.request)
        return ThirdParty.objects.filter(organization=tenant)


class ThirdPartyRisksListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TPRMRiskSerializer

    def get_third_party(self):
        tenant = get_tenant(self.request)
        tp_id = self.kwargs["third_party_id"]
        return ThirdParty.objects.get(id=tp_id, organization=tenant)

    def get_queryset(self):
        tp = self.get_third_party()
        return TPRMRisk.objects.filter(third_party=tp).order_by("-inherent_risk_score", "title")

    def perform_create(self, serializer):
        tp = self.get_third_party()
        serializer.save(third_party=tp)


class ThirdPartyAssessmentsListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TPRMAssessmentSerializer

    def get_third_party(self):
        tenant = get_tenant(self.request)
        tp_id = self.kwargs["third_party_id"]
        return ThirdParty.objects.get(id=tp_id, organization=tenant)

    def get_queryset(self):
        tp = self.get_third_party()
        return TPRMAssessment.objects.filter(third_party=tp).order_by("-assessment_date")

    def perform_create(self, serializer):
        tp = self.get_third_party()
        serializer.save(third_party=tp)


class ThirdPartyDecisionView(generics.RetrieveUpdateAPIView):
    """
    Retrieve/update the single 'current' decision for a third party.
    Creates one automatically if it doesn't exist yet (MVP convenience).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TPRMDecisionSerializer

    def get_third_party(self):
        tenant = get_tenant(self.request)
        tp_id = self.kwargs["third_party_id"]
        return ThirdParty.objects.get(id=tp_id, organization=tenant)

    def get_object(self):
        tp = self.get_third_party()
        decision, _ = TPRMDecision.objects.get_or_create(third_party=tp)
        return decision
