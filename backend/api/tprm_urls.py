from django.urls import path

from .tprm_views import (
    ThirdPartyListCreateView,
    ThirdPartyDetailView,
    ThirdPartyRisksListCreateView,
    ThirdPartyAssessmentsListCreateView,
    ThirdPartyDecisionView,
)

urlpatterns = [
    path("third-parties/", ThirdPartyListCreateView.as_view(), name="tprm-thirdparty-list"),
    path("third-parties/<uuid:id>/", ThirdPartyDetailView.as_view(), name="tprm-thirdparty-detail"),

    path("third-parties/<uuid:third_party_id>/risks/", ThirdPartyRisksListCreateView.as_view(), name="tprm-risk-list"),
    path("third-parties/<uuid:third_party_id>/assessments/", ThirdPartyAssessmentsListCreateView.as_view(), name="tprm-assessment-list"),
    path("third-parties/<uuid:third_party_id>/decision/", ThirdPartyDecisionView.as_view(), name="tprm-decision"),
]
