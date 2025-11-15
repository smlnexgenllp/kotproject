import random
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from management.models import AdminUser, EmailOTP,FoodItem,RestaurantTable,SubCategory
from django.contrib.auth.hashers import make_password
import logging
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .serializers import FoodItemSerializer,RestaurantTableSerializer,SubCategorySerializer

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
        print(f"IP: {request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))}")

        email = request.data.get("email")
        if not email:
            print("Validation failed: No email provided")
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email already registered
        if AdminUser.objects.filter(email=email).exists():
            print(f"Email {email} is already registered")
            return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate OTP
        otp = str(random.randint(100000, 999999))
        print(f"Generated OTP: {otp}")

        try:
            # Save OTP to database
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
            return Response(
                {"error": "Failed to store OTP", "detail": str(db_err)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # SUCCESS: Now send email
        try:
            print("Attempting to send email via SMTP...")
            send_mail(
                subject="Your KOT Verification OTP",
                message=f"Your OTP is: {otp}\n\nValid for 10 minutes.\nDo not share it with anyone.",
                from_email=None,  # Uses DEFAULT_FROM_EMAIL
                recipient_list=[email],
                fail_silently=False,
            )
            print("Email sent successfully!")
            logger.info(f"OTP email sent to {email} (OTP: {otp})")
            return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)

        except Exception as mail_err:
            print(f"Email sending failed: {mail_err}")
            logger.exception(f"SMTP error for {email}")
            # Optional: Delete OTP if email failed?
            obj.delete()
            return Response(
                {"error": "Failed to send email", "detail": str(mail_err)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({"error": "Email and OTP are required"}, status=400)

        try:
            otp_obj = EmailOTP.objects.get(email=email)
        except EmailOTP.DoesNotExist:
            return Response({"error": "Invalid or expired OTP"}, status=400)

        if otp_obj.is_expired():
            otp_obj.delete()
            return Response({"error": "OTP has expired"}, status=400)

        if otp_obj.otp != otp:
            return Response({"error": "Invalid OTP"}, status=400)

        # OTP valid → delete it
        otp_obj.delete()
        return Response({"message": "OTP verified successfully"}, status=200)


class LoginView(APIView):
    def post(self, request):
        identifier = request.data.get('identifier')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({"error": "Both fields are required"}, status=400)

        # Find user by email or username
        try:
            user = AdminUser.objects.get(email=identifier)
        except AdminUser.DoesNotExist:
            try:
                user = AdminUser.objects.get(username=identifier)
            except AdminUser.DoesNotExist:
                return Response({"error": "Invalid credentials"}, status=400)

        if not user.is_verified:
            return Response({"error": "Please verify your email first"}, status=403)

        # Authenticate
        user = authenticate(username=user.username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=400)

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,          # <-- IMPORTANT
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=200)

        
class FoodItemViewSet(viewsets.ModelViewSet):
    """
    DRF ViewSet for FoodItem model with stock and timing management
    """
    queryset = FoodItem.objects.filter(is_active=True).order_by('category', 'food_name')
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
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

        # Filter by stock status
        stock_status = self.request.query_params.get('stock_status')
        if stock_status:
            queryset = queryset.filter(stock_status=stock_status)
            
        return queryset.order_by('category', 'food_name')

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete implementation
        """
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(
            {"message": "Food item deleted successfully"}, 
            status=status.HTTP_204_NO_CONTENT
        )

    # ────── STOCK MANAGEMENT ACTIONS ──────
    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """
        POST /api/food-menu/{id}/update_stock/ - Update stock status
        """
        food_item = self.get_object()
        stock_status = request.data.get('stock_status')
        stock_notes = request.data.get('stock_notes', '')
        
        if stock_status in ['in_stock', 'out_of_stock']:
            food_item.stock_status = stock_status
            food_item.stock_notes = stock_notes
            food_item.save()
            
            return Response({
                'message': f'{food_item.food_name} stock status updated to {stock_status}',
                'stock_status': food_item.stock_status,
                'is_available_now': food_item.is_available_now(),
                'availability_status': food_item.availability_status
            })
        else:
            return Response(
                {'error': 'Invalid stock status. Use "in_stock" or "out_of_stock".'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def bulk_update_stock(self, request):
        """
        POST /api/food-menu/bulk_update_stock/ - Bulk update stock status
        """
        updates = request.data.get('updates', [])
        results = []
        
        for update in updates:
            try:
                food_item = FoodItem.objects.get(food_id=update['food_id'])
                food_item.stock_status = update['stock_status']
                food_item.stock_notes = update.get('stock_notes', '')
                food_item.save()
                
                results.append({
                    'food_id': food_item.food_id,
                    'food_name': food_item.food_name,
                    'stock_status': food_item.stock_status,
                    'is_available_now': food_item.is_available_now(),
                    'success': True
                })
            except FoodItem.DoesNotExist:
                results.append({
                    'food_id': update['food_id'],
                    'success': False,
                    'error': 'Food item not found'
                })
            except Exception as e:
                results.append({
                    'food_id': update['food_id'],
                    'success': False,
                    'error': str(e)
                })
        
        return Response({'results': results})

    @action(detail=False, methods=['post'])
    def apply_timing_stock(self, request):
        """
        POST /api/food-menu/apply_timing_stock/ - Apply timing-based stock
        """
        timing_type = request.data.get('timing_type')  # 'morning', 'lunch', 'dinner', 'all'
        
        food_items = FoodItem.objects.filter(auto_manage_stock=True, is_active=True)
        updated_count = 0
        
        for item in food_items:
            original_status = item.stock_status
            
            if timing_type == 'all':
                item.stock_status = 'in_stock'
            elif timing_type == 'morning':
                # Only tiffin items available in morning
                item.stock_status = 'in_stock' if item.subcategory == 'tiffin' else 'out_of_stock'
            elif timing_type == 'lunch':
                # Only lunch items available
                item.stock_status = 'in_stock' if item.subcategory == 'lunch' else 'out_of_stock'
            elif timing_type == 'dinner':
                # Dinner items + specific tiffin items available
                is_dinner_item = (
                    item.subcategory == 'dinner' or
                    (item.subcategory == 'tiffin' and any(keyword in item.food_name.lower() for keyword in ['idly', 'dosa', 'pongal'])) or
                    (item.subcategory == 'lunch' and any(keyword in item.food_name.lower() for keyword in ['biryani', 'fried rice', 'noodles']))
                )
                item.stock_status = 'in_stock' if is_dinner_item else 'out_of_stock'
            else:
                continue
            
            if item.stock_status != original_status:
                item.save()
                updated_count += 1
        
        return Response({
            'message': f'{timing_type} timing applied successfully',
            'updated_count': updated_count,
            'total_items': len(food_items)
        })

    @action(detail=False, methods=['get'])
    def stock_summary(self, request):
        """
        GET /api/food-menu/stock_summary/ - Get stock statistics
        """
        total_items = FoodItem.objects.filter(is_active=True).count()
        in_stock_count = FoodItem.objects.filter(stock_status='in_stock', is_active=True).count()
        out_of_stock_count = FoodItem.objects.filter(stock_status='out_of_stock', is_active=True).count()
        
        # Count by subcategory
        subcategory_stats = {}
        for item in FoodItem.objects.filter(is_active=True):
            subcat = item.subcategory or 'Uncategorized'
            if subcat not in subcategory_stats:
                subcategory_stats[subcat] = {'total': 0, 'in_stock': 0}
            subcategory_stats[subcat]['total'] += 1
            if item.stock_status == 'in_stock':
                subcategory_stats[subcat]['in_stock'] += 1
        
        return Response({
            'total_items': total_items,
            'in_stock_count': in_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'availability_rate': round((in_stock_count / total_items) * 100, 2) if total_items > 0 else 0,
            'subcategory_stats': subcategory_stats
        })

    # ────── TIMING MANAGEMENT ACTIONS ──────
    @action(detail=True, methods=['post'])
    def update_timing(self, request, pk=None):
        """
        POST /api/food-menu/{id}/update_timing/ - Update food item timing
        """
        food_item = self.get_object()
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        is_timing_active = request.data.get('is_timing_active', False)
        
        food_item.start_time = start_time
        food_item.end_time = end_time
        food_item.is_timing_active = is_timing_active
        food_item.save()
        
        return Response({
            'message': f'{food_item.food_name} timing updated successfully',
            'timing_display': food_item.timing_display,
            'is_available_now': food_item.is_available_now()
        })

    @action(detail=False, methods=['get'])
    def available_items(self, request):
        """
        GET /api/food-menu/available_items/ - Get only available items
        """
        available_items = [item for item in FoodItem.objects.filter(is_active=True) if item.is_available_now()]
        serializer = self.get_serializer(available_items, many=True)
        return Response(serializer.data)

    # ────── EXISTING CUSTOM ACTIONS ──────
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
        GET /api/food-menu/subcategories/ - Get all available subcategories from FoodItems
        """
        subcategories = FoodItem.objects.filter(is_active=True)\
            .exclude(subcategory__isnull=True)\
            .exclude(subcategory='')\
            .values_list('subcategory', flat=True)\
            .distinct()
        return Response(list(subcategories))


class SubCategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing subcategories with timing
    """
    queryset = SubCategory.objects.all().order_by('subcategory_name')
    serializer_class = SubCategorySerializer
    permission_classes = [permissions.AllowAny]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Check if subcategory is being used in any food items
        if FoodItem.objects.filter(subcategory=instance.subcategory_name).exists():
            return Response(
                {
                    "error": f"Cannot delete subcategory '{instance.subcategory_name}'. It is being used in food items."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ────── TIMING MANAGEMENT ACTIONS ──────
    @action(detail=True, methods=['post'])
    def update_timing(self, request, pk=None):
        """
        POST /api/subcategories/{id}/update_timing/ - Update subcategory timing
        """
        subcategory = self.get_object()
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        is_timing_active = request.data.get('is_timing_active', False)
        
        subcategory.start_time = start_time
        subcategory.end_time = end_time
        subcategory.is_timing_active = is_timing_active
        subcategory.save()
        
        return Response({
            'message': f'{subcategory.subcategory_name} timing updated successfully',
            'timing_display': subcategory.timing_display,
            'is_available_now': subcategory.is_available_now()
        })

    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        GET /api/subcategories/available/ - Get subcategories not used in food items
        """
        used_subcategories = FoodItem.objects.filter(is_active=True)\
            .exclude(subcategory__isnull=True)\
            .exclude(subcategory='')\
            .values_list('subcategory', flat=True)\
            .distinct()
        
        available = SubCategory.objects.exclude(subcategory_name__in=used_subcategories)
        serializer = self.get_serializer(available, many=True)
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

    @action(detail=False, methods=['get'], url_path='active-numbers')
    def active_numbers(self, request):
        """
        GET /api/tables/active-numbers/
        Returns: [{"table_id": 1, "table_number": "T1"}, ...]
        """
        tables = self.get_queryset().values('table_id', 'table_number')
        return Response(list(tables))