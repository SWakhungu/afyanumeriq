from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import update_session_auth_hash

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old = request.data.get("old_password")
        new = request.data.get("new_password")

        if not user.check_password(old):
            return Response({"detail": "Incorrect current password"}, status=400)

        user.set_password(new)
        user.save()

        # Keep session alive
        update_session_auth_hash(request, user)

        return Response({"detail": "Password updated"})
