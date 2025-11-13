# cashier/serializers.py
from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('name', 'quantity', 'price')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True)
    paid_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = [
            'order_id', 'table_number', 'total_amount', 'received_amount',
            'balance_amount', 'payment_mode', 'status', 'created_at', 'paid_at', 'items'
        ]
        read_only_fields = ['balance_amount', 'created_at', 'paid_at']