from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserProfileSerializer
import pyotp

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling user registration, profile management, and MFA.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Use different serializers based on the action.
        """
        if self.action == 'create':
            return UserSerializer
        return UserProfileSerializer
    
    def get_permissions(self):
        """
        Ensure only authenticated users can access their profiles.
        """
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get current user's profile.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def enable_mfa(self, request):
        """
        Initialize MFA setup by generating a secret key and QR code URI
        """
        user = request.user
        if user.mfa_enabled:
            return Response(
                {'detail': 'MFA is already enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate a new secret key for TOTP
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        
        # Generate the provisioning URI for QR code
        provisioning_uri = totp.provisioning_uri(
            user.email,
            issuer_name="Secure File Share"
        )

        # Store the secret temporarily (you might want to use cache or session)
        user.mfa_secret = secret
        user.save()

        return Response({
            'secret': secret,
            'provisioning_uri': provisioning_uri
        })

    @action(detail=False, methods=['post'])
    def verify_mfa_setup(self, request):
        """
        Verify the MFA token and enable MFA if correct
        """
        token = request.data.get('token')
        if not token:
            return Response(
                {'detail': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        if not user.mfa_secret:
            return Response(
                {'detail': 'MFA setup not initiated'},
                status=status.HTTP_400_BAD_REQUEST
            )

        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(token):
            user.mfa_enabled = True
            user.save()
            return Response({'detail': 'MFA enabled successfully'})
        
        return Response(
            {'detail': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )