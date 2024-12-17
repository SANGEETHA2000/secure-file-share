from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
from .auth_views import CustomTokenObtainPairView, VerifyMFAView
from rest_framework_simplejwt.views import TokenRefreshView

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

# The API URLs are determined automatically by the router
urlpatterns = [
    # Include the router-generated URLs
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify-mfa/', VerifyMFAView.as_view(), name='verify_mfa'),
]