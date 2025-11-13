# backend/management/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, VerifyOTPView, LoginView, SendEmailOTPView,
    FoodItemViewSet,RestaurantTableViewSet,SubCategoryViewSet
)

# DRF Router for list, retrieve, update, delete
router = DefaultRouter()
router.register(r'food-menu', FoodItemViewSet, basename='fooditem')
router.register(r'tables', RestaurantTableViewSet, basename='table')
router.register(r'subcategories',SubCategoryViewSet, basename='subcategory')

urlpatterns = [
    # === AUTH ENDPOINTS ===
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('send-otp/', SendEmailOTPView.as_view(), name='send_otp'),

    # === FOOD MENU: Custom CREATE Path (No auth required) ===
    path('create-food/', FoodItemViewSet.as_view({'post': 'create'}), name='create-food'),

    # === FOOD MENU: List, Detail, Update, Delete via Router ===
    path('', include(router.urls)),  # /food-menu/ , /food-menu/1/ , etc.
]