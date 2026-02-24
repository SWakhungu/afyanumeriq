from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import PlatformUpdate


class PlatformUpdatesView(APIView):
    """
    Public endpoint that returns all platform updates.
    NOT scoped to tenant or standard - available to all users.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        updates = PlatformUpdate.objects.all().values(
            'id', 'title', 'description', 'category', 'date'
        ).order_by('-date')
        
        return Response(list(updates))
