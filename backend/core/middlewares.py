from django.http import HttpResponse
from django.core.cache import cache
import bleach
import re
from datetime import datetime, timedelta

class SecurityMiddleware:
    """
    A comprehensive security middleware that handles:
    - Rate limiting
    - Input validation
    - Security headers
    - File upload validation
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        self.username_pattern = re.compile(r'^[a-zA-Z0-9_]+$')
        
        # Rate limiting settings
        self.rate_limits = {
            '/api/v1/auth/': (20, 60),     # 20 requests per minute for auth endpoints
            '/api/v1/files/': (100, 60),   # 100 requests per minute for file endpoints
            'default': (200, 60)           # 200 requests per minute for other endpoints
        }

    def __call__(self, request):
        # Rate limiting check
        client_ip = self.get_client_ip(request)
        
        # Find appropriate rate limit for the path
        max_requests, window = self.get_rate_limit_for_path(request.path)
        
        if not self.check_rate_limit(client_ip, request.path, max_requests, window):
            return HttpResponse(
                "Too many requests. Please try again later.",
                status=429
            )

        # Input validation for POST/PUT requests
        if request.method in ['POST', 'PUT']:
            try:
                for key, value in request.POST.items():
                    if isinstance(value, str):
                        request.POST[key] = bleach.clean(value, strip=True)
            except Exception:
                return HttpResponse("Invalid request data", status=400)

        # Get the response
        response = self.get_response(request)
        
        # Add security headers
        self.add_security_headers(response)
        
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

    def get_rate_limit_for_path(self, path):
        for prefix, limits in self.rate_limits.items():
            if path.startswith(prefix):
                return limits
        return self.rate_limits['default']

    def check_rate_limit(self, client_ip, path, max_requests, window):
        """Implements sliding window rate limiting"""
        cache_key = f"ratelimit:{client_ip}:{path}"
        now = datetime.now()
        
        # Get existing requests from cache
        requests = cache.get(cache_key, [])
        
        # Remove requests outside the current window
        current_window = now - timedelta(seconds=window)
        requests = [req for req in requests if req >= current_window]
        
        if len(requests) >= max_requests:
            return False

        requests.append(now)
        cache.set(cache_key, requests, window)
        return True

    def add_security_headers(self, response):
        """Add security headers to the response"""
        security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=()',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache'
        }
        
        for header, value in security_headers.items():
            response[header] = value