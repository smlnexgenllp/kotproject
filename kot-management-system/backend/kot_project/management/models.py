# backend/management/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
from cloudinary.models import CloudinaryField

class AdminUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('cashier', 'Cashier'),
        ('waiter', 'Waiter'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='waiter')
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)  

    groups = models.ManyToManyField(
        'auth.Group', related_name='adminuser_groups', blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission', related_name='adminuser_perms', blank=True
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


# models.py
class EmailOTP(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return self.expires_at > timezone.now()

    def __str__(self):
        return f"OTP for {self.email}"


class FoodItem(models.Model):
    FOOD_CATEGORY_CHOICES = [
        ('food', 'Food'),
        ('cafe', 'Cafe'),
    ]

    FOOD_TYPE_CHOICES = [
        ('veg', 'Veg'),
        ('nonveg', 'Non-Veg'),
        ('egg', 'Egg'),
    ]

    STOCK_STATUS_CHOICES = [
        ('in_stock', 'In Stock'),
        ('out_of_stock', 'Out of Stock'),
    ]

    food_id = models.AutoField(primary_key=True)
    category = models.CharField(max_length=10, choices=FOOD_CATEGORY_CHOICES, default='food')
    subcategory = models.CharField(max_length=100, blank=True, null=True)
    food_type = models.CharField(max_length=10, choices=FOOD_TYPE_CHOICES, default='veg')
    food_name = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    image = CloudinaryField('image', blank=True, null=True)

    # Stock management fields
    stock_status = models.CharField(
        max_length=15, 
        choices=STOCK_STATUS_CHOICES, 
        default='in_stock'
    )
    auto_manage_stock = models.BooleanField(default=True)
    stock_notes = models.TextField(blank=True, null=True)
    last_stock_update = models.DateTimeField(auto_now=True)

    # Custom timing fields
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_timing_active = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.food_name} - ₹{self.price}"

    @property
    def timing_display(self):
        if self.start_time and self.end_time:
            return f"{self.start_time} - {self.end_time}"
        return "No timing set"

    @property
    def has_timing(self):
        """Check if timing is configured"""
        return bool(self.start_time and self.end_time)

    def is_available_now(self):
        """
        Check if food item is available based on timing and stock
        """
        from django.utils import timezone
        from datetime import datetime
        
        # Check stock status first
        if self.stock_status == 'out_of_stock':
            return False
            
        # If timing is not active or no timing set, always available
        if not self.is_timing_active or not self.start_time or not self.end_time:
            return True
            
        current_time = datetime.now().time()
        
        # Check if current time is within timing
        return self.start_time <= current_time <= self.end_time

    @property
    def availability_status(self):
        """Get detailed availability status"""
        if self.stock_status == 'out_of_stock':
            return "Out of Stock"
        
        if not self.is_timing_active or not self.has_timing:
            return "Available"
        
        if self.is_available_now():
            return "Available Now"
        else:
            return f"Available from {self.start_time} to {self.end_time}"   

class RestaurantTable(models.Model):
    table_id = models.AutoField(primary_key=True)
    table_number = models.CharField(max_length=10, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'restaurant_tables'
        ordering = ['table_number']

    def __str__(self):
        return f"Table {self.table_number}"        

class SubCategory(models.Model):
    subcategory_id = models.AutoField(primary_key=True)
    subcategory_name = models.CharField(max_length=100, unique=True)
    
    # Timing fields - no defaults, can be null/blank
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_timing_active = models.BooleanField(default=False)  # Default to inactive
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subcategories'
        verbose_name_plural = 'Sub Categories'
        ordering = ['subcategory_name']

    def __str__(self):
        return self.subcategory_name

    @property
    def timing_display(self):
        if self.start_time and self.end_time:
            return f"{self.start_time} - {self.end_time}"
        return "No timing set"
    
    def is_available_now(self):
        """
        Check if this subcategory is available based on current time
        """
        from django.utils import timezone
        from datetime import datetime
        
        # If timing is not active or no timing set, always available
        if not self.is_timing_active or not self.start_time or not self.end_time:
            return True
            
        current_time = datetime.now().time()
        
        # Check if current time is within timing
        return self.start_time <= current_time <= self.end_time

    @property
    def has_timing(self):
        """Check if timing is configured"""
        return bool(self.start_time and self.end_time)