from rest_framework import status, views
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
import pyotp

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that handles MFA verification.
    """
    def post(self, request, *args, **kwargs):
        # First, validate username and password
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get the user
            username = request.data.get('username')
            user = User.objects.get(username=username)
            
            # If MFA is enabled, don't return tokens yet
            if user.mfa_enabled:
                return Response({
                    'require_mfa': True,
                    'user_id': user.id
                })
            
        return response

class VerifyMFAView(views.APIView):
    """
    Verify MFA token and provide JWT tokens upon successful verification.
    """
    def post(self, request):
        user_id = request.data.get('user_id')
        token = request.data.get('token')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA is not enabled for this user'},
                status=status.HTTP_400_BAD_REQUEST
            )

        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(token):
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })

        return Response(
            {'detail': 'Invalid MFA token'},
            status=status.HTTP_400_BAD_REQUEST
        )