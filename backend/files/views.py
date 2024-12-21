from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.http import HttpResponse, FileResponse
from cryptography.fernet import Fernet
import os
import uuid
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import models
from .models import File, FileShare
from .serializers import FileSerializer, FileShareSerializer
from .permissions import IsAdmin, IsFileOwnerOrSharedWith
import secrets
import string

User = get_user_model()

def generate_secure_password(length=12):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    while True:
        password = ''.join(secrets.choice(alphabet) for i in range(length))
        # Check if password has at least one of each required type
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in string.punctuation for c in password)):
            return password
        
def get_user_by_email(email: str):
    """
    Get a user by email, ensuring case-insensitive comparison
    Returns None if no user is found
    """
    try:
        # Log the query we're about to make
        print(f"Looking up user with email: {email}")
        
        # Get all users and log them for debugging
        all_users = User.objects.all()
        print("All users in database:")
        print(all_users)
        for u in all_users:
            print(f"User: {u.username}, Email: {u.email}, User details: {u}")
        
        # Use get() directly with iexact and handle DoesNotExist
        user = User.objects.get(email__iexact=email)
        
        # Log the found user details
        print(f"Query found user: {user.username}")
        print(f"User details - ID: {user.id}, Email: {user.email}, Role: {user.role}")
        
        return user
        
    except User.DoesNotExist:
        print(f"No user found with email: {email}")
        return None
    except Exception as e:
        print(f"Error in get_user_by_email: {str(e)}")
        return None

class FileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling all file-related operations including upload, download,
    and basic CRUD operations. Implements encryption for secure file storage.
    """
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated, IsFileOwnerOrSharedWith, IsAdmin]
    
    def get_queryset(self):
        """
        Users can see files they own or files shared with them.
        Admins can see all files.
        """
        user = self.request.user
        if user.is_admin():
            return File.objects.all()
        return File.objects.filter(models.Q(owner=user)).distinct()
    
    def get_object(self):
        """
        Override get_object to handle both owned and shared files.
        """
        obj = File.objects.filter(
           models.Q(pk=self.kwargs['pk']),
           (
               models.Q(owner=self.request.user) |
               models.Q(
                   shares__shared_with=self.request.user,
                   shares__expires_at__gt=timezone.now()
               ) |
               models.Q(owner__isnull=False)  # This will always be True, allowing admins through
           )
       ).first()
        
        # If object exists and user is admin, return it
        if obj and self.request.user.is_admin():
            return obj
        
        # For non-admin users, only return if they have proper access
        if obj and (
            obj.owner == self.request.user or
            obj.shares.filter(
                shared_with=self.request.user,
                expires_at__gt=timezone.now()
            ).exists()
        ):
            self.check_object_permissions(self.request, obj)
            return obj

        print("File not found or access denied")

    def perform_create(self, serializer):
        """
        Handle file upload with encryption.
        """
        uploaded_file = self.request.FILES['file']
        client_key = self.request.POST.get('client_key')
        
        # Generate a unique encryption key for this file
        encryption_key = Fernet.generate_key()
        fernet = Fernet(encryption_key)
        
        # Read and encrypt the file content
        file_content = uploaded_file.read()
        encrypted_content = fernet.encrypt(file_content)
        
        # Generate a unique filename for storage
        file_extension = os.path.splitext(uploaded_file.name)[1]
        encrypted_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Save the encrypted file
        file_path = os.path.join('encrypted_files', encrypted_filename)
        default_storage.save(file_path, ContentFile(encrypted_content))
        
        # Store file metadata and encryption key reference
        file_instance = serializer.save()
        file_instance.name = encrypted_filename
        file_instance.encryption_key_id = encryption_key.decode()
        file_instance.client_key = client_key
        file_instance.save()

    @action(detail=True, methods=['get'], permission_classes=[IsFileOwnerOrSharedWith, IsAdmin])
    def download(self, request, pk=None):
        """Handle secure file download with decryption."""
        file_obj = self.get_object()
        print(file_obj)
        if not request.user.is_admin():         
            # Check download permission
            if request.user != file_obj.owner:
                share = file_obj.shares.filter(
                    shared_with=request.user,
                    expires_at__gt=timezone.now()   
                ).first()
                
                if not share or share.permission != 'DOWNLOAD':
                    return Response(
                        {'detail': 'Download permission denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        try:
            # Get the encryption key and initialize Fernet
            fernet = Fernet(file_obj.encryption_key_id.encode())
            
            # Read the encrypted file
            file_path = os.path.join(settings.ENCRYPTED_FILES_DIR, file_obj.name)
            with default_storage.open(file_path, 'rb') as f:
                encrypted_content = f.read()
            
            # Decrypt the content
            decrypted_content = fernet.decrypt(encrypted_content)
            
            # Create response with proper headers
            response = HttpResponse(
                decrypted_content,
                content_type=file_obj.mime_type or 'application/octet-stream'
            )
            
            # Set required headers
            response['Content-Disposition'] = f'attachment; filename="{file_obj.original_name}"'
            # response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            # response['Access-Control-Allow-Credentials'] = 'true'
            response['X-Client-Key'] = file_obj.client_key
            
            # if request.method == 'OPTIONS':
            #     response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            #     response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
                
            return response
            
        except Exception as e:
            print(f"Download error: {str(e)}")
            return Response(
                {'detail': 'Failed to download file.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def shared(self, request):
        """
        Get files shared with the current user.
        """
        shared_files = File.objects.filter(
            shares__shared_with=request.user,
            shares__expires_at__gt=timezone.now()
        ).distinct()
        serializer = self.get_serializer(shared_files, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def all_files(self, request):
        """
        Admin endpoint to get all files with their sharing info
        """
        if not request.user.is_admin():
            return Response(
                {'detail': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        files = File.objects.all()
        serializer = FileSerializer(files, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get file statistics for admin dashboard
        """
        if not request.user.is_admin():
            return Response(
                {'detail': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        total_files = File.objects.count()
        total_size = File.objects.aggregate(total=models.Sum('size'))['total'] or 0
        total_shares = FileShare.objects.filter(
            expires_at__gt=timezone.now()
        ).count()

        return Response({
            'total_files': total_files,
            'total_size': total_size,
            'active_shares': total_shares
        })
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Handle file preview without forcing download."""
        file_obj = self.get_object()
        print(file_obj)
        try:
            # Server-side decryption
            fernet = Fernet(file_obj.encryption_key_id.encode())
            file_path = os.path.join(settings.ENCRYPTED_FILES_DIR, file_obj.name)
            
            with default_storage.open(file_path, 'rb') as f:
                encrypted_content = f.read()
            
            decrypted_content = fernet.decrypt(encrypted_content)
            
            response = HttpResponse(
                decrypted_content,
                content_type=file_obj.mime_type or 'application/octet-stream',
                headers={'X-Client-Key': file_obj.client_key}
            )
            # Don't set Content-Disposition as attachment
            return response
            
        except Exception as e:
            return Response(
                {'detail': 'Failed to load preview'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileShareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing file sharing functionality.
    Handles both user-to-user sharing and access control.
    """
    serializer_class = FileShareSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Override to allow unauthenticated access to verify_access
        """
        if self.action == 'verify_access':
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        """
        Users can see shares they've created or received.
        Admins can see all shares.
        """
        user = self.request.user
        if user.is_admin():
            return FileShare.objects.all()
        return FileShare.objects.filter(
            models.Q(created_by=user) | 
            models.Q(shared_with=user)
        )

    def perform_create(self, serializer):
        """
        Create a new file share with proper access token generation.
        """
        serializer.save()

    @action(detail=False, methods=['post'], url_path='verify-access', url_name='verify_access')
    def verify_access(self, request):
        """
        Verify file share access and handle guest user access.
        This endpoint handles:
        1. Verifying the share token is valid
        2. Checking if the email matches what was shared
        3. Creating a guest account if needed
        4. Associating the share with the user
        """
        token = request.data.get('token')
        email = request.data.get('email')

        if not token or not email:
            return Response(
                {'detail': 'Token and email are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find the share and verify it's not expired
            share = FileShare.objects.get(
                access_token=token,
                expires_at__gt=timezone.now()
            )
            
            # Check if user exists
            user = User.objects.filter(email=email).first()
            
            # If this share was created for a different email
            if share.shared_with_email != email:
                return Response(
                    {'detail': 'This file was not shared with this email address.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not user:
                # Create new guest user
                temp_password = ''.join(secrets.choice(
                    string.ascii_letters + string.digits
                ) for i in range(12))
                
                username = email.split('@')[0]
                
                # Make sure username is unique
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=temp_password,
                    role='GUEST'
                )
                
                # Associate the share with the new user
                share.shared_with = user
                share.save()
                
                response_data = {
                    'fileId': str(share.file.id),
                    'permission': share.permission,
                    'isNewUser': True,
                    'username': username,
                    'temporaryPassword': temp_password
                }
            else:
                # For existing users, just verify everything matches
                if not share.shared_with:
                    # If this is the first time they're accessing, associate the share with them
                    share.shared_with = user
                    share.save()
                elif share.shared_with != user:
                    # If this share was already claimed by a different user
                    return Response(
                        {'detail': 'Invalid access attempt'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
                response_data = {
                    'fileId': str(share.file.id),
                    'permission': share.permission,
                    'isNewUser': False
                }

            return Response(response_data)
            
        except FileShare.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired share link'},
                status=status.HTTP_404_NOT_FOUND
            )
        
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """
        Revoke a file share by setting its expiration to now.
        """
        share = self.get_object()
        
        if share.created_by != request.user and not request.user.is_admin():
            return Response(
                {'detail': 'Not authorized to revoke this share'},
                status=status.HTTP_403_FORBIDDEN
            )

        share.expires_at = timezone.now()
        share.save()
        
        return Response({'detail': 'Share revoked successfully'})
    