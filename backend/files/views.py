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
        return File.objects.filter(
            models.Q(owner=user) | 
            models.Q(shares__shared_with=user, shares__expires_at__gt=timezone.now())
        ).distinct()

    def perform_create(self, serializer):
        """
        Handle file upload with encryption.
        """
        uploaded_file = self.request.FILES['file']
        
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
        file_instance.save()

    @action(detail=True, methods=['get'], permission_classes=[IsFileOwnerOrSharedWith])
    def download(self, request, pk=None):
        """
        Handle secure file download with decryption.
        """
        file_obj = self.get_object()

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
            response['Content-Disposition'] = f'attachment; filename="{file_obj.original_name}"'
            return response
        
        except Exception as e:
            print(f"Download error: {str(e)}")  # For debugging
            return Response(
                {'detail': 'Failed to download file.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileShareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing file sharing functionality.
    Handles both user-to-user sharing and public link generation.
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
        # Generate a secure access token
        access_token = uuid.uuid4().hex
        
        # Set the creator and access token
        serializer.save(
            created_by=self.request.user,
            access_token=access_token
        )

    @action(detail=False, methods=['get'])
    def public_access(self, request):
        """
        Handle access to files through public share links.
        """
        access_token = request.query_params.get('token')
        if not access_token:
            return Response(
                {'detail': 'Access token required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            share = FileShare.objects.get(
                access_token=access_token,
                expires_at__gt=timezone.now()
            )
        except FileShare.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired share link.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = FileSerializer(share.file)
        return Response(serializer.data)