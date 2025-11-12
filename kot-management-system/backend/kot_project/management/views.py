import random
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from management.models import AdminUser, EmailOTP,FoodItem,RestaurantTable
from django.contrib.auth.hashers import make_password
import logging
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .serializers import FoodItemSerializer,RestaurantTableSerializer

logger = logging.getLogger("otp_sender")


class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'waiter')
        otp = request.data.get('otp')

        try:
            otp_entry = EmailOTP.objects.get(email=email)
        except EmailOTP.DoesNotExist:
            return Response({"error": "OTP not found"}, status=400)

        if otp_entry.otp != otp:
            return Response({"error": "Invalid OTP"}, status=400)
        if timezone.now() > otp_entry.expires_at:
            return Response({"error": "OTP expired"}, status=400)

        if AdminUser.objects.filter(username=username).exists():
            return Response({"error": "Username already taken"}, status=400)

        # Create verified user
        user = AdminUser.objects.create(
            username=username,
            email=email,
            password=make_password(password),
            role=role,
            is_verified=True
        )

        otp_entry.delete()  # Remove OTP entry once verified

        return Response({"message": "Registration successful"}, status=201)
        


class SendEmailOTPView(APIView):
    def post(self, request):
        print("\n=== [OTP] POST /api/send-otp/ ===")
        print(f"Request data: {request.data}")
        print(f"Request META (IP, User-Agent, etc.): {request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))}")

        email = request.data.get("email")
        if not email:
            print("Validation failed: No email provided")
            return Response({"error": "Email is required"}, status=400)

        print(f"Requested email: {email}")
        if AdminUser.objects.filter(email=email).exists():
            print(f"Email {email} is already registered")
            return Response({"error": "Email already registered"}, status=400)
        otp = str(random.randint(100000, 999999))
        print(f"Generated OTP: {otp}")
        try:
            obj, created = EmailOTP.objects.update_or_create(
                email=email,
                defaults={
                    "otp": otp,
                    "expires_at": timezone.now() + timedelta(minutes=10),
                },
            )
            print(f"OTP saved → created={created}, expires_at={obj.expires_at}")
        except Exception as db_err:
            print(f"Database error while saving OTP: {db_err}")
            logger.exception("DB error in SendEmailOTPView")
            return Response({"error": "Failed to store OTP", "detail": str(db_err)}, status=500)

            print("Attempting to send email via SMTP...")
            send_mail(
                subject="Your KOT Email Verification OTP",
                message=f"Your OTP is: {otp}\nValid for 10 minutes.",
                from_email=None,               # Uses DEFAULT_FROM_EMAIL from settings
                recipient_list=[email],
                fail_silently=False,
            )
            print("Email sent successfully!")
            logger.info(f"OTP email sent to {email} (OTP: {otp})")
            return Response({"message": "OTP sent successfully"}, status=200)

        except Exception as mail_err:
            print(f"Email sending failed: {mail_err}")
            logger.exception(f"SMTP error for {email}")
            return Response(
                {"error": "Failed to send email", "detail": str(mail_err)}, status=500
            )

class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        try:
            user = AdminUser.objects.get(email=email)
            otp_obj = EmailOTP.objects.get(user=user)
        except (AdminUser.DoesNotExist, EmailOTP.DoesNotExist):
            return Response({"error": "Invalid email or OTP"}, status=400)

        if otp_obj.is_expired():
            return Response({"error": "OTP expired"}, status=400)
        if otp_obj.otp != otp:
            return Response({"error": "Invalid OTP"}, status=400)

        user.is_verified = True
        user.is_active = True
        user.save()
        otp_obj.delete()

        return Response({"message": "Email verified! You can now log in."}, status=200)



class LoginView(APIView):
    def post(self, request):
        identifier = request.data.get('identifier')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({"error": "Both fields are required"}, status=400)

        # Try to find user by email or username
        try:
            user = AdminUser.objects.get(email=identifier)
        except AdminUser.DoesNotExist:
            try:
                user = AdminUser.objects.get(username=identifier)
            except AdminUser.DoesNotExist:
                return Response({"error": "Invalid credentials"}, status=400)

        if not user.is_verified:
            return Response({"error": "Please verify your email first"}, status=403)

        user = authenticate(username=user.username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=400)

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Login successful",
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=200)

class FoodItemViewSet(viewsets.ModelViewSet):
    """
    DRF ViewSet for FoodItem model with all standard CRUD operations
    No authentication required for any operations
    """
    queryset = FoodItem.objects.filter(is_active=True).order_by('category', 'food_name')
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """
        Enhanced queryset with filtering capabilities
        """
        queryset = FoodItem.objects.filter(is_active=True)
        
        # Filter by query parameters
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
            
        subcategory = self.request.query_params.get('subcategory')
        if subcategory:
            queryset = queryset.filter(subcategory=subcategory)
            
        food_type = self.request.query_params.get('food_type')
        if food_type:
            queryset = queryset.filter(food_type=food_type)
            
        return queryset.order_by('category', 'food_name')

    def list(self, request, *args, **kwargs):
        """
        GET /api/food-menu/ - List all active food items
        Optional filters: ?category=food&subcategory=lunch&food_type=veg
        """
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/food-menu/{id}/ - Get specific food item
        """
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """
        POST /api/food-menu/ - Create new food item
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """
        PUT /api/food-menu/{id}/ - Full update
        """
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /api/food-menu/{id}/ - Partial update
        """
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/food-menu/{id}/ - Soft delete
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Food item deleted successfully"}, 
            status=status.HTTP_204_NO_CONTENT
        )

    def perform_create(self, serializer):
        """Save during creation"""
        serializer.save()

    def perform_update(self, serializer):
        """Save during update"""
        serializer.save()

    def perform_destroy(self, instance):
        """Soft delete implementation"""
        instance.is_active = False
        instance.save()

    # Custom Actions
    @action(detail=False, methods=['get'])
    def all_items(self, request):
        """
        GET /api/food-menu/all_items/ - Get all items including inactive
        """
        items = FoodItem.objects.all().order_by('category', 'food_name')
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        GET /api/food-menu/categories/ - Get all available categories
        """
        categories = FoodItem.objects.filter(is_active=True)\
            .values_list('category', flat=True)\
            .distinct()
        return Response(list(categories))

    @action(detail=False, methods=['get'])
    def subcategories(self, request):
        """
        GET /api/food-menu/subcategories/ - Get all available subcategories
        """
        subcategories = FoodItem.objects.filter(is_active=True)\
            .exclude(subcategory__isnull=True)\
            .exclude(subcategory='')\
            .values_list('subcategory', flat=True)\
            .distinct()
        return Response(list(subcategories))

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        GET /api/food-menu/by_category/?category=food - Filter by category
        """
        category = request.query_params.get('category')
        if not category:
            return Response(
                {"error": "Category parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        items = FoodItem.objects.filter(
            is_active=True, 
            category=category
        ).order_by('food_name')
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_subcategory(self, request):
        """
        GET /api/food-menu/by_subcategory/?subcategory=lunch - Filter by subcategory
        """
        subcategory = request.query_params.get('subcategory')
        if not subcategory:
            return Response(
                {"error": "Subcategory parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        items = FoodItem.objects.filter(
            is_active=True, 
            subcategory=subcategory
        ).order_by('food_name')
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

class RestaurantTableViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing restaurant tables
    """
    queryset = RestaurantTable.objects.filter(is_active=True).order_by('table_number')
    serializer_class = RestaurantTableSerializer
    permission_classes = [permissions.AllowAny]

    def perform_destroy(self, instance):
        """Soft delete implementation"""
        instance.is_active = False
        instance.save()        