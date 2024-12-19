from rest_framework import serializers
from .models import File, FileShare
from django.conf import settings
from django.contrib.auth import get_user_model

class FileSerializer(serializers.ModelSerializer):
    """
    Serializer for handling file uploads and metadata.
    Handles file encryption and secure storage.
    """
    file = serializers.FileField(write_only=True)
    download_url = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = ('id', 'name', 'original_name', 'mime_type', 'size', 
                 'owner', 'uploaded_at', 'updated_at', 'file', 'download_url', 'owner_name',
                 'encryption_key_id')
        read_only_fields = ('id', 'name', 'original_name', 'mime_type', 'size',
                          'owner', 'uploaded_at', 'updated_at', 'encryption_key_id')

    def create(self, validated_data):
        # Extract the file from validated data
        upload_file = validated_data.pop('file')
        
        # Create the file instance with the remaining data
        file_instance = File.objects.create(
            name=upload_file.name,  # This will be overwritten by the view
            original_name=upload_file.name,
            mime_type=upload_file.content_type,
            size=upload_file.size,
            owner=self.context['request'].user,
            encryption_key_id='temp-key'  # This will be overwritten by the view
        )

        return file_instance

    def get_download_url(self, obj):
        """
        Generate a secure download URL for the file.
        """
        return f'/api/files/{obj.id}/download/'

    def get_owner_name(self, obj):
        """
        Return the full name of the file owner.
        """
        return f"{obj.owner.first_name} {obj.owner.last_name}"

class FileShareSerializer(serializers.ModelSerializer):
    """
    Serializer for handling file sharing functionality.
    Manages share permissions and access tokens.
    """
    share_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    shared_with_email = serializers.EmailField(write_only=True, required=False)
    expires_in_hours = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = FileShare
        fields = ('id', 'file', 'created_by', 'shared_with', 'permission',
                 'access_token', 'expires_at', 'share_url', 'file_name',
                 'shared_with_email', 'expires_in_hours')
        read_only_fields = ('id', 'created_by', 'access_token', 'share_url')

    def get_share_url(self, obj):
        """
        Generate the shareable URL for the file.
        """
        return f'/api/share/{obj.access_token}/'

    def get_file_name(self, obj):
        """
        Return the original name of the shared file.
        """
        return obj.file.original_name

    def validate(self, data):
        """
        Validate sharing permissions and handle user lookup.
        """
        if 'shared_with_email' in data:
            User = get_user_model()
            try:
                user = User.objects.get(email=data['shared_with_email'])
                data['shared_with'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'shared_with_email': 'No user found with this email address.'
                })
            del data['shared_with_email']
        
        return data