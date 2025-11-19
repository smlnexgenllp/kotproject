# backend/management/serializers.py
from rest_framework import serializers
from .models import FoodItem,RestaurantTable,SubCategory,TableSeat

class SubCategorySerializer(serializers.ModelSerializer):
    timing_display = serializers.ReadOnlyField()
    has_timing = serializers.ReadOnlyField()
    is_available_now = serializers.ReadOnlyField()
    
    class Meta:
        model = SubCategory
        fields = [
            'subcategory_id', 'subcategory_name', 
            'start_time', 'end_time', 'is_timing_active',
            'timing_display', 'has_timing', 'is_available_now',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['subcategory_id', 'created_at', 'updated_at']

class FoodItemSerializer(serializers.ModelSerializer):
    subcategory_display = serializers.CharField(source='subcategory', read_only=True)
    timing_display = serializers.ReadOnlyField()
    has_timing = serializers.ReadOnlyField()
    is_available_now = serializers.ReadOnlyField()
    availability_status = serializers.ReadOnlyField()
    
    class Meta:
        model = FoodItem
        fields = [
            'food_id', 'category', 'subcategory', 'subcategory_display',
            'food_type', 'food_name', 'price', 'description', 'image',
            'stock_status', 'auto_manage_stock', 'stock_notes', 'last_stock_update',
            'start_time', 'end_time', 'is_timing_active',
            'timing_display', 'has_timing', 'is_available_now', 'availability_status',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'food_id', 'created_at', 'updated_at', 'last_stock_update',
            'timing_display', 'has_timing', 'is_available_now', 'availability_status'
        ]
        
class TableSeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableSeat
        fields = ['seat_id', 'seat_number', 'row_number', 'seat_label', 'is_available']

class RestaurantTableSerializer(serializers.ModelSerializer):
    seats = TableSeatSerializer(many=True, read_only=True)
    available_seats = serializers.ReadOnlyField()
    seat_arrangement = serializers.ReadOnlyField()
    
    class Meta:
        model = RestaurantTable
        fields = [
            'table_id', 
            'table_number', 
            'total_seats', 
            'seats_per_row', 
            'is_active', 
            'seats',
            'available_seats',
            'seat_arrangement',
            'created_at'
        ]
        read_only_fields = ['table_id', 'created_at']

    def get_available_seats(self, obj):
        return obj.get_available_seats()

    def get_seat_arrangement(self, obj):
        return obj.get_seat_arrangement()