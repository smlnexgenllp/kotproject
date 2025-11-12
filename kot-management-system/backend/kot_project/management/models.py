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
    is_verified = models.BooleanField(default=False)  # Email verified?

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

    SUBCATEGORY_CHOICES = [
        ('tiffin', 'Tiffin'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('breakfast', 'Breakfast'),
        ('snacks', 'Snacks'),
        ('beverages', 'Beverages'),
        ('desserts', 'Desserts'),
    ]

    FOOD_TYPE_CHOICES = [
        ('veg', 'Veg'),
        ('nonveg', 'Non-Veg'),
        ('egg', 'Egg'),
    ]

    food_id = models.AutoField(primary_key=True)
    category = models.CharField(max_length=10, choices=FOOD_CATEGORY_CHOICES, default='food')
    subcategory = models.CharField(max_length=20, choices=SUBCATEGORY_CHOICES, blank=True, null=True)
    food_type = models.CharField(max_length=10, choices=FOOD_TYPE_CHOICES, default='veg')
    food_name = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    
    # ← NOW USING CLOUDINARY
    image = CloudinaryField('image', blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.food_name} - ₹{self.price}"

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