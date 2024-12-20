from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.http import HttpResponse, FileResponse
from cryptography.fernet import Fernet
import os
import uuid
from django.utils import timezone
from django.db import models
from .models import File, FileShare
from .serializers import FileSerializer, FileShareSerializer
from .permissions import IsFileOwnerOrSharedWith

class FileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling all file-related operations including upload, download,
    and basic CRUD operations. Implements encryption for secure file storage.
    """
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated, IsFileOwnerOrSharedWith]
    
    def get_queryset(self):
        """
        Users can see files they own or files shared with them.
        Admins can see all files.
        """
        user = self.request.user
        if user.is_admin():
            return File.objects.all()
        return File.objects.filter(models.Q(owner=user)).distinct()
    
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

    @action(detail=True, methods=['get'], permission_classes=[IsFileOwnerOrSharedWith])
    def download(self, request, pk=None):
        """Handle secure file download with decryption."""
        file_obj = self.get_object()
        print(file_obj.client_key)
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

class FileShareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing file sharing functionality.
    Handles both user-to-user sharing and access control.
    """
    serializer_class = FileShareSerializer
    permission_classes = [IsAuthenticated]
    
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

    @action(detail=False, methods=['post'])
    def verify_access(self, request):
        """
        Verify file share access and handle guest user access.
        """
        token = request.data.get('token')
        email = request.data.get('email')

        if not token or not email:
            return Response(
                {'detail': 'Token and email are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            share = FileShare.objects.get(
                access_token=token,
                expires_at__gt=timezone.now()
            )
            
            # Verify email matches shared_with
            if share.shared_with.email != email:
                raise FileShare.DoesNotExist

            response_data = {
                'fileId': str(share.file.id),
                'permission': share.permission,
            }

            # Include temporary password for guest users
            if share.shared_with.role == 'GUEST':
                response_data['temporaryPassword'] = share.shared_with.password

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