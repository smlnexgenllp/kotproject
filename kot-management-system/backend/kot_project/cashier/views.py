# cashier/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone

from .models import Order, OrderItem  # Import both
from .serializers import OrderSerializer


class CashierOrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.prefetch_related('items').order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], url_path='create_order')
    def create_order(self, request):
        """
        Expected payload from frontend:
        {
            "tableNumber": 5,
            "total": 450,
            "paymentMode": "cash",
            "received_amount": 500,  // optional, defaults to total
            "balance_amount": 50,    // optional
            "cart": [
                { "name": "Paneer Tikka", "quantity": 1, "price": 250 },
                { "name": "Naan", "quantity": 2, "price": 100 }
            ]
        }
        """
        data = request.data

        try:
            # Step 1: Create the Order
            order = Order.objects.create(
                table_number=data['tableNumber'],
                total_amount=data['total'],
                payment_mode=data.get('paymentMode', 'cash'),
                received_amount=data.get('received_amount', data['total']),
                balance_amount=data.get('balance_amount', 0),
                status='pending'
            )

            # Step 2: Create OrderItems (reverse relation)
            cart_items = data.get('cart', [])
            order_items = [
                OrderItem(
                    order=order,
                    name=item['name'],
                    food_id=item.get('food_id'),
                    quantity=item['quantity'],
                    price=item['price']
                )
                for item in cart_items
            ]
            OrderItem.objects.bulk_create(order_items)

            # Step 3: Recalculate balance (if needed)
            order.save()  # Triggers balance_amount logic in model

            # Step 4: Return full order data
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except KeyError as e:
            return Response(
                {"detail": f"Missing field: {e}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='mark_paid')
    def mark_paid(self, request, pk=None):
        """
        Mark order as paid (only if pending)
        """
        try:
            order = self.get_object()
            if order.status == 'paid':
                return Response(
                    {"detail": "Order already paid"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.status = 'paid'
            order.paid_at = timezone.now()
            order.save()

            return Response(
                {"message": "Order marked as paid", "order_id": order.order_id},
                status=status.HTTP_200_OK
            )
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )