from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'service': 'TalentFlow API', 'version': '1.0'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health),
    path('api/v1/auth/token/', obtain_auth_token),
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/companies/', include('companies.urls')),
    path('api/v1/jobs/', include('jobs.urls')),
    path('api/v1/applications/', include('applications.urls')),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
