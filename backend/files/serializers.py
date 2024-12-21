# files/serializers.py
from rest_framework import serializers
from .models import File, FileShare
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

class FileSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    owner_name = serializers.SerializerMethodField()
    share_permission = serializers.SerializerMethodField()
    class Meta:
        model = File
        fields = ('id', 'name', 'original_name', 'mime_type', 'size', 
                 'owner', 'uploaded_at', 'file', 'owner_name', 'share_permission')
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
    
    def get_share_permission(self, obj):
        # Get the current user from the context
        request = self.context.get('request')
        if not request or not request.user:
            return None

        user = request.user
        
        # If user is the owner, they have full permissions
        if user.is_admin() or obj.owner == user:
            return 'DOWNLOAD'
            
        # Check if there's an active share for this user
        share = obj.shares.filter(
            shared_with=user,
            expires_at__gt=timezone.now()
        ).first()
        
        return share.permission if share else None

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
        minutes = validated_data.pop('expires_in_minutes')
        
        # Calculate expiration time
        expires_at = timezone.now() + timedelta(minutes=minutes)
        
        # Create share without associating with a user yet
        share = FileShare.objects.create(
            **validated_data,
            shared_with=None,  # We'll set this when they actually access the file
            created_by=self.context['request'].user,
            expires_at=expires_at
        )
        
        return share