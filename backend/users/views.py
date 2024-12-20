from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserProfileSerializer
import pyotp
from django.db.models import Sum

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
    
    @action(detail=False, methods=['post'])
    def disable_mfa(self, request):
        """
        Disable MFA for the current user
        """
        user = request.user
        print(user.mfa_enabled, user.mfa_secret)
        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA is not enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify current password
        password = request.data.get('password')
        if not user.check_password(password):
            return Response(
                {'detail': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Disable MFA
        user.mfa_enabled = False
        user.mfa_secret = None  # Clear the secret
        user.save()
        
        return Response({'detail': 'MFA disabled successfully'})
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        Change the current user's password
        """
        user = request.user

        # Get the required data from the request
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_new_password = request.data.get('confirm_new_password')

        # Validate the data
        if not current_password or not new_password or not confirm_new_password:
            return Response(
                {'detail': 'Current password, new password, and confirm new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_new_password:
            return Response(
                {'detail': 'New password and confirm new password do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the current password is correct
        if not user.check_password(current_password):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update the user's password
        user.set_password(new_password)
        user.save()

        return Response({'detail': 'Password changed successfully'})
    
class AdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admin-only operations
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()

    def get_queryset(self):
        return User.objects.all().annotate(
            storage_used=Sum('owned_files__size')
        )

    @action(detail=False, methods=['get'])
    def users(self, request):
        """Get all users with their details"""
        users = self.get_queryset()
        data = []
        
        for user in users:
            user_data = {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'mfa_enabled': user.mfa_enabled,
                'created_at': user.date_joined,
                'last_login': user.last_login,
                'storage_used': user.storage_used or 0
            }
            data.append(user_data)
        
        return Response(data)

    @action(detail=True, methods=['patch'])
    def update_role(self, request, pk=None):
        """Update user role"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if not new_role or new_role not in [r[0] for r in User.Roles.choices]:
            return Response(
                {'detail': 'Invalid role specified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prevent admin from changing their own role
        if user == request.user:
            return Response(
                {'detail': 'Cannot modify own role'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.role = new_role
        user.save()
        
        return Response({
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'mfa_enabled': user.mfa_enabled,
            'created_at': user.date_joined,
            'last_login': user.last_login,
            'storage_used': Sum('owned_files__size') or 0
        })