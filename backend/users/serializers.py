from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the custom User model.
    Handles user creation and updates with proper password hashing.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password_confirm',
                 'first_name', 'last_name', 'role', 'mfa_enabled')
        read_only_fields = ('mfa_enabled',)
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, data):
        """
        Validate that the passwords match and remove password_confirm from the data.
        """
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        data.pop('password_confirm')
        return data

    def create(self, validated_data):
        """
        Create a new user with encrypted password and remove password_confirm from the data.
        """
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing and updating user profile information.
    Excludes sensitive fields and handles partial updates.
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'mfa_enabled')
        read_only_fields = ('role',)  # Role can only be changed by admin