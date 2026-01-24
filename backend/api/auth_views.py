# backend/api/auth_views.py
from django.contrib.auth import authenticate
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from .serializers import UserDetailSerializer

# Use settings constant if present, fallback to default name
JWT_COOKIE = getattr(settings, "JWT_REFRESH_COOKIE_NAME", "afya_refresh")

def cookie_secure_flag():
    """
    Return True for secure cookies in production; False for local dev.
    We'll follow DEBUG: DEBUG=True => secure=False (local dev).
    """
    return not getattr(settings, "DEBUG", False)


def cookie_samesite_for_env():
    """
    Browsers REQUIRE 'Secure' when SameSite=None.
    - If cookie is secure (HTTPS available), we can use SameSite=None to allow cross-site requests across ports.
    - If not secure (local HTTP dev), use 'Lax' to avoid the browser rejecting the cookie set.
      NOTE: Lax will restrict cross-site POST requests (so /auth/refresh POST from a different origin may be blocked).
      See the README below for recommended dev setups.
    """
    return "None" if cookie_secure_flag() else "Lax"


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return Response(
                {"detail": "Tenant not resolved."},
                status=400,
            )
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "Invalid credentials"}, status=400)
        # Enforce tenant membership
        if not hasattr(user, "profile") or user.profile.organization != tenant:
            return Response({"detail": "Invalid credentials for this organization"}, status=400)

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        payLoad = {"access": access, "user": UserDetailSerializer(user).data}
        response = Response(payLoad)

        secure = cookie_secure_flag()
        samesite = cookie_samesite_for_env()

        # Set HttpOnly refresh cookie so client can refresh later
        # Path set to /api/ (adjust if your API prefix differs)
        response.set_cookie(
            key=JWT_COOKIE,
            value=str(refresh),
            httponly=True,
            secure=secure,
            samesite=samesite,
            path="/api/",
            # Optionally set max_age (seconds) or expires
            # max_age = 24 * 60 * 60
        )

        return response


class RefreshFromCookieView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # For debugging, print whether the refresh cookie was sent.
        # Avoid printing the full token; show only a short masked preview.
        refresh_token = request.COOKIES.get(JWT_COOKIE)
        if refresh_token:
            try:
                preview = refresh_token[:8] + "..."
            except Exception:
                preview = "(unavailable)"
            print(f"[auth] Refresh token received (preview): {preview}")
        else:
            print("[auth] No refresh cookie found in request.COOKIES")
            return Response({"detail": "No refresh token"}, status=401)

        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)
            return Response({"access": new_access})
        except Exception:
            return Response({"detail": "Invalid refresh token"}, status=401)


class LogoutView(APIView):
    """
    Logout should be idempotent and work even if the access token is missing/expired.
    We allow unauthenticated requests here and simply remove the refresh cookie.
    """
    # AllowAny so clients can call logout even when their access token expired.
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # For debugging, log that we received a logout request.
        # Avoid logging sensitive headers/tokens.
        print("[auth] Logout requested; deleting refresh cookie if present")

        secure = cookie_secure_flag()
        samesite = cookie_samesite_for_env()

        response = Response({"detail": "Logged out"}, status=200)
        # delete_cookie supports samesite in modern Django; supply same attributes
        response.delete_cookie(
            JWT_COOKIE,
            path="/api/",
            samesite=samesite,
        )
        return response


class MeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
