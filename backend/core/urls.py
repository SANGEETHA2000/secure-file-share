from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView  # Add this import

urlpatterns = [
    # Redirect root URL to admin or api
    path('', RedirectView.as_view(url='/api/v1/', permanent=False)),
    
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        path('', include('users.urls')),
        path('', include('files.urls')),
    ])),
]

# Add static file handling for development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)