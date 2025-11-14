# backend/cashier/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CashierOrderViewSet

router = DefaultRouter()
router.register(r'orders', CashierOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]