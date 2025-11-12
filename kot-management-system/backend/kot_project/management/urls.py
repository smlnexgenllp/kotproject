from django.urls import path
from .views import RegisterView, VerifyOTPView, LoginView,SendEmailOTPView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('send-otp/', SendEmailOTPView.as_view(), name='send_otp'),

]
