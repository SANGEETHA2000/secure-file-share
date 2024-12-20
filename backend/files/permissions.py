from rest_framework import permissions
from django.utils import timezone

class IsFileOwnerOrSharedWith(permissions.BasePermission):
    """
    Custom permission to only allow owners of a file or users it's shared with
    to access it. Admins have full access.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.is_admin():
            return True
            
        # Check if user is the owner
        if obj.owner == request.user:
            return True
            
        # Check if file is shared with the user
        share = obj.shares.filter(
            shared_with=request.user,
            expires_at__gt=timezone.now()
        ).first()
        
        if share:
            # For GET requests (viewing), any share permission is enough
            if request.method in permissions.SAFE_METHODS:
                return True
            # For modification/deletion, only allow if explicitly permitted
            return share.permission == 'DOWNLOAD'
            
        return False
    
class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin()

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)