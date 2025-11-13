# cashier/models.py
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Order(models.Model):
    PAYMENT_MODE_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]

    order_id = models.AutoField(primary_key=True)
    table_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    received_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    balance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, editable=False)
    payment_mode = models.CharField(max_length=10, choices=PAYMENT_MODE_CHOICES, default='cash')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['table_number']),
            models.Index(fields=['status']),
            models.Index(fields=['paid_at']),
        ]

    def save(self, *args, **kwargs):
        # Auto-calculate change
        self.balance_amount = max(self.received_amount - self.total_amount, 0)

        # Auto-set paid_at
        if self.status == 'paid' and not self.paid_at:
            self.paid_at = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.order_id} - Table {self.table_number}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    def subtotal(self):
        return self.quantity * self.price

    def __str__(self):
        return f"{self.quantity}× {self.name}"