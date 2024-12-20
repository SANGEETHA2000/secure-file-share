from django.db import models
from django.core.validators import MinLengthValidator
from django.conf import settings
import uuid
from datetime import datetime, timedelta

class File(models.Model):
    """
    Represents an encrypted file in the system.
    References the User model from the users app via settings.AUTH_USER_MODEL
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the file"
    )
    name = models.CharField(
        max_length=255,
        help_text="Encrypted filename as stored in the system"
    )
    original_name = models.CharField(
        max_length=255,
        help_text="Original filename before encryption"
    )
    mime_type = models.CharField(
        max_length=100,
        help_text="MIME type of the file"
    )
    size = models.BigIntegerField(
        help_text="Size of the file in bytes"
    )
    encryption_key_id = models.CharField(
        max_length=64,
        help_text="Reference to the encryption key used for this file"
    )
    client_key = models.CharField(
        max_length=512,
        null=True,
        blank=True,
        help_text="Client-side encryption key"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # References User model from users app
        on_delete=models.CASCADE,
        related_name='owned_files',
        help_text="User who owns this file"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def generate_share_link(self, created_by, expires_in_hours=24):
        """
        Generate a secure sharing link for this file.
        """
        return FileShare.objects.create(
            file=self,
            created_by=created_by,
            expires_at=datetime.now() + timedelta(hours=expires_in_hours)
        )

    class Meta:
        ordering = ['-uploaded_at']

class FileShare(models.Model):
    """
    Manages file sharing permissions and temporary access links.
    """
    class Permissions(models.TextChoices):
        VIEW = 'VIEW', 'View Only'
        DOWNLOAD = 'DOWNLOAD', 'Download Allowed'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    file = models.ForeignKey(
        'File',
        on_delete=models.CASCADE,
        related_name='shares'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_shares'
    )
    shared_with = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='received_shares'
    )
    permission = models.CharField(
        max_length=10,
        choices=Permissions.choices,
        default=Permissions.VIEW
    )
    access_token = models.CharField(
        max_length=64,
        unique=True,
        validators=[MinLengthValidator(64)]
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        """
        Check if the share link is still valid.
        """
        return self.expires_at is None or self.expires_at > datetime.now()

    class Meta:
        ordering = ['-created_at']