# cashier/serializers.py
from rest_framework import serializers
from .models import Order, OrderItem
from decimal import Decimal
from management.models import FoodItem


class OrderItemSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "food_id",
            "name",
            "price",
            "quantity",
            "category",
        ]

    def get_category(self, obj):
        if not obj.food_id:
            return None
        try:
            food = FoodItem.objects.only('category').get(food_id=obj.food_id)
            return food.category
        except FoodItem.DoesNotExist:
            return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True)
    paid_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True, allow_null=True)
    refunded_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True, allow_null=True)
    
    waiter_name = serializers.CharField(source='waiter.username', read_only=True, allow_null=True, default=None)

    class Meta:
        model = Order
        fields = [
            'order_id',
            'table_number',
            'total_amount',
            'received_amount',
            'balance_amount',
            'payment_mode',
            'status',
            'created_at',
            'paid_at',
            'refunded_at',
            'refunded_amount',
            'is_refunded',
            'refund_reason',
            'items',
            'waiter_name'
        ]
        read_only_fields = [
            'balance_amount', 'created_at', 'paid_at', 'refunded_at',
            'refunded_amount', 'is_refunded', 'refund_reason'
        ]

    # Convert all Decimal fields → float for JSON
    def to_representation(self, instance):
        data = super().to_representation(instance)

        decimal_fields = [
            'total_amount', 'received_amount', 'balance_amount', 'refunded_amount'
        ]

        for field in decimal_fields:
            value = data.get(field)
            if isinstance(value, Decimal):
                data[field] = float(value)
            elif value is None:
                data[field] = 0.0

        # Optional: Add helpful computed field
        data['remaining_amount'] = float(data['total_amount']) - float(data.get('refunded_amount', 0))

        return data