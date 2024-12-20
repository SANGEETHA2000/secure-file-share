# files/serializers.py
from rest_framework import serializers
from .models import File, FileShare
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
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

class FileSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = ('id', 'name', 'original_name', 'mime_type', 'size', 
                 'owner', 'uploaded_at', 'file', 'owner_name')
        read_only_fields = ('id', 'name', 'size', 'owner', 'uploaded_at')

    def create(self, validated_data):
        upload_file = validated_data.pop('file')
        client_key = validated_data.pop('client_key', None)
        
        file_instance = File.objects.create(
            name=upload_file.name,
            original_name=upload_file.name,
            mime_type=upload_file.content_type,
            size=upload_file.size,
            owner=self.context['request'].user,
            encryption_key_id='temp-key',
            client_key=client_key
        )
        return file_instance

    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}"

class FileShareSerializer(serializers.ModelSerializer):
    shared_with_email = serializers.EmailField(write_only=True)
    expires_in_minutes = serializers.IntegerField(
        write_only=True,
        min_value=30,
        max_value=10080  # 7 days
    )

    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_with_email', 'permission', 
                 'expires_in_minutes', 'expires_at', 'access_token')
        read_only_fields = ('id', 'expires_at', 'access_token')

    def validate(self, data):
        # Check if trying to share with self
        if data['shared_with_email'] == self.context['request'].user.email:
            raise serializers.ValidationError({
                'shared_with_email': "You cannot share a file with yourself."
            })

        # Validate file ownership
        if data['file'].owner != self.context['request'].user:
            raise serializers.ValidationError({
                'file': "You don't have permission to share this file."
            })

        return data

    def create(self, validated_data):
        email = validated_data.pop('shared_with_email')
        minutes = validated_data.pop('expires_in_minutes')
        
        # Get or create user (as guest if doesn't exist)
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'role': 'GUEST',
                'password': generate_secure_password() 
            }
        )

         # If user was just created, need to set password properly
        if created:
            user.set_password(user.password)  # Hash the password
            user.save()

        # Create share
        expires_at = timezone.now() + timedelta(minutes=minutes)
        return FileShare.objects.create(
            **validated_data,
            shared_with=user,
            created_by=self.context['request'].user,
            expires_at=expires_at
        )