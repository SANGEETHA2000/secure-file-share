from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet, FileShareViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'files', FileViewSet, basename='file')
router.register(r'shares', FileShareViewSet, basename='fileshare')

# The API URLs are determined automatically by the router
urlpatterns = [
    # Include the router-generated URLs
    path('', include(router.urls)),
    
    # Add any custom file-related endpoints here if needed
    # Example: path('public-share/<str:token>/', views.public_share_view, name='public_share'),
]