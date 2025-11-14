from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from management.views import LoginView, RegisterView, SendEmailOTPView, VerifyOTPView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('management.urls')), 
    path('api/', include('cashier.urls')),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/send-otp/', SendEmailOTPView.as_view(), name='send-otp'),
    path('api/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)