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
    @property
    def image_url(self):
        """Get proper image URL for CloudinaryField"""
        if not self.image:
            return None
        
        # If it's already a proper URL, return it
        if hasattr(self.image, 'url'):
            return self.image.url
        
        # Handle string paths that might contain full URLs
        if isinstance(self.image, str):
            if 'res.cloudinary.com' in self.image:
                # Extract the actual Cloudinary URL from malformed paths
                if '/https://' in self.image:
                    parts = self.image.split('/https://')
                    if len(parts) > 1:
                        return f"https://{parts[-1]}"
                return self.image
            else:
                # It's a regular Cloudinary path
                return self.image
        
        return str(self.image)          

class RestaurantTable(models.Model):
    table_id = models.AutoField(primary_key=True)
    table_number = models.CharField(max_length=10, unique=True)
    total_seats = models.PositiveIntegerField(default=4)
    seats_per_row = models.PositiveIntegerField(default=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'restaurant_tables'
        ordering = ['table_number']

    def __str__(self):
        return f"Table {self.table_number} ({self.total_seats} seats)"

    def save(self, *args, **kwargs):
        """Override save to auto-generate seats when table is created/updated"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new or 'total_seats' in kwargs.get('update_fields', []) or 'seats_per_row' in kwargs.get('update_fields', []):
            self.generate_seats()

    def generate_seats(self):
        """Generate seat records based on total_seats and seats_per_row"""
        # Delete existing seats first
        self.seats.all().delete()
        
        rows_needed = (self.total_seats + self.seats_per_row - 1) // self.seats_per_row
        seat_labels = ['A', 'B', 'C', 'D', 'E', 'F']
        
        seat_count = 0
        for row in range(1, rows_needed + 1):
            for seat_idx in range(self.seats_per_row):
                if seat_count < self.total_seats:
                    seat_label = seat_labels[seat_idx]
                    seat_number = f"{self.table_number}{row}{seat_label}"
                    
                    TableSeat.objects.create(
                        table=self,
                        seat_number=seat_number,
                        row_number=row,
                        seat_label=seat_label,
                        is_available=True
                    )
                    seat_count += 1

    def get_available_seats(self):
        """Return available seats count"""
        return self.seats.filter(is_available=True).count()

    def get_seat_arrangement(self):
        """Return organized seat arrangement by rows"""
        seats = self.seats.all().order_by('row_number', 'seat_label')
        arrangement = {}
        for seat in seats:
            if seat.row_number not in arrangement:
                arrangement[seat.row_number] = []
            arrangement[seat.row_number].append({
                'seat_number': seat.seat_number,
                'seat_label': seat.seat_label,
                'is_available': seat.is_available
            })
        return arrangement


class TableSeat(models.Model):
    seat_id = models.AutoField(primary_key=True)
    table = models.ForeignKey(RestaurantTable, on_delete=models.CASCADE, related_name='seats')
    seat_number = models.CharField(max_length=10)  # 11A, 11B, 12A, etc.
    row_number = models.PositiveIntegerField()  # 1, 2, 3
    seat_label = models.CharField(max_length=5)  # A, B, C
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'table_seats'
        unique_together = ['table', 'seat_number']
        ordering = ['row_number', 'seat_label']

    def __str__(self):
        return f"Seat {self.seat_number} (Table {self.table.table_number})"      

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