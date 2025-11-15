# cashier/serializers.py
from rest_framework import serializers
from .models import Order, OrderItem
from decimal import Decimal

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('name', 'quantity', 'price')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True)
    paid_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True, allow_null=True)
    waiter_name = serializers.CharField(source='waiter.username', read_only=True,allow_null=True,default=None)

    class Meta:
        model = Order
        fields = [
            'order_id', 'table_number', 'total_amount', 'received_amount',
            'balance_amount', 'payment_mode', 'status', 'created_at', 'paid_at', 'items','waiter_name'
        ]
        read_only_fields = ['balance_amount', 'created_at', 'paid_at']

    # CRITICAL: Convert Decimal → float
    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in ['total_amount', 'received_amount', 'balance_amount']:
            value = data[field]
            if isinstance(value, Decimal):
                data[field] = float(value)
            elif value is None:
                data[field] = 0.0
        return data