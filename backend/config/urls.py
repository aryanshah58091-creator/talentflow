from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'service': 'TalentFlow API', 'version': '1.0'})

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'message': 'Welcome to the TalentFlow API',
        'version': '1.0',
        'documentation': {
            'swagger': request.build_absolute_uri('/api/docs/'),
            'redoc': request.build_absolute_uri('/api/redoc/'),
            'openapi_schema': request.build_absolute_uri('/api/schema/'),
        },
        'endpoints': {
            'health': request.build_absolute_uri('health/'),
            'auth_token': request.build_absolute_uri('auth/token/'),
            'accounts': request.build_absolute_uri('accounts/'),
            'companies': request.build_absolute_uri('companies/'),
            'jobs': request.build_absolute_uri('jobs/'),
            'applications': request.build_absolute_uri('applications/'),
            'analytics': request.build_absolute_uri('applications/analytics/'),
            'parse_resume': request.build_absolute_uri('applications/parse-resume/'),
            'admin': request.build_absolute_uri('/admin/'),
        }
    })

urlpatterns = [
    path('', api_root),
    path('api/v1/', api_root),
    path('admin/', admin.site.urls),
    # OpenAPI 3.0 Documentation Endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # API v1 Resource Endpoints
    path('api/v1/health/', health),
    path('api/v1/auth/token/', obtain_auth_token),
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/companies/', include('companies.urls')),
    path('api/v1/jobs/', include('jobs.urls')),
    path('api/v1/applications/', include('applications.urls')),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
