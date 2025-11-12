# backend/management/serializers.py
from rest_framework import serializers
from .models import FoodItem,RestaurantTable

class FoodItemSerializer(serializers.ModelSerializer):
    # Remove these read-only fields for input
    # category = serializers.CharField(source='get_category_display', read_only=True)
    # subcategory = serializers.CharField(source='get_subcategory_display', read_only=True)
    # food_type = serializers.CharField(source='get_food_type_display', read_only=True)
    
    # Keep only the display fields as read-only (optional, for output only)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    subcategory_display = serializers.CharField(source='get_subcategory_display', read_only=True)
    food_type_display = serializers.CharField(source='get_food_type_display', read_only=True)
    
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = FoodItem
        fields = [
            'food_id',
            'category', 'subcategory', 'food_type',  # These are for input
            'category_display', 'subcategory_display', 'food_type_display',  # These are for display
            'food_name', 'price', 'description',
            'image', 'image_url',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['food_id', 'created_at', 'updated_at', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url  # Cloudinary full URL
        return None

class RestaurantTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantTable
        fields = [
            'table_id',
            'table_number',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['table_id', 'created_at', 'updated_at']

    def validate_table_number(self, value):
        """Ensure table number is unique"""
        if RestaurantTable.objects.filter(table_number=value).exists():
            if self.instance and self.instance.table_number == value:
                return value
            raise serializers.ValidationError("Table number already exists")
        return value        