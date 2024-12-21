# files/models.py
from django.db import models
from django.core.validators import MinLengthValidator
from django.conf import settings
import uuid
from django.utils import timezone
from datetime import timedelta

def get_default_expiry():
    """Return default expiration time (24 hours from now)"""
    return timezone.now() + timedelta(days=1)

class File(models.Model):
    """
    Represents an encrypted file in the system.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
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
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_files'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-uploaded_at']

class FileShare(models.Model):
    """
    Manages file sharing permissions and access control.
    """
    class Permissions(models.TextChoices):
        VIEW = 'VIEW', 'View Only'
        DOWNLOAD = 'DOWNLOAD', 'View and Download'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    file = models.ForeignKey(
        File,
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
        related_name='received_shares',
        null=True,
        blank=True
    )
    shared_with_email = models.EmailField(
        null=True,
        help_text="Email address this file was shared with"
    )
    permission = models.CharField(
        max_length=10,
        choices=Permissions.choices,
        default=Permissions.VIEW
    )
    access_token = models.CharField(
        max_length=64,
        unique=True,
        blank=True
    )
    expires_at = models.DateTimeField(
        default=get_default_expiry 
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.access_token:
            self.access_token = uuid.uuid4().hex  # Generate new token only if not set
        super().save(*args, **kwargs)

    def is_valid(self):
        """Check if share hasn't expired"""
        return timezone.now() <= self.expires_at

    class Meta:
        ordering = ['-created_at']