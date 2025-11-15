# cashier/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # Change to IsAuthenticated in production
from django.utils import timezone
from django.db.models import Sum, Q
from datetime import date

from .models import Order, OrderItem
from .serializers import OrderSerializer


class CashierOrderViewSet(viewsets.ModelViewSet):
    """
    API for Cashier:
    - List all orders (pending + paid)
    - Create new order (waiter → cashier)
    - Mark order as paid
    - Get today's collection summary
    """
    queryset = Order.objects.prefetch_related('items').order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]  # Use IsAuthenticated in production

    # ──────────────────────────────
    # 1. CREATE ORDER (Waiter → Cashier)
    # ──────────────────────────────
    @action(detail=False, methods=['post'], url_path='create_order')
    def create_order(self, request):
        data = request.data

        try:
            # Validate required fields
            required = ['tableNumber', 'total', 'cart']
            missing = [field for field in required if field not in data]
            if missing:
                return Response(
                    {"detail": f"Missing fields: {', '.join(missing)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create Order
            order = Order.objects.create(
                table_number=int(data['tableNumber']),
                total_amount=float(data['total']),
                payment_mode=data.get('paymentMode', 'cash').lower(),
                received_amount=float(data.get('received_amount', data['total'])),
                status='pending'
            )

            # Create OrderItems
            cart = data.get('cart', [])
            if not isinstance(cart, list):
                return Response({"detail": "cart must be a list"}, status=400)

            order_items = []
            for item in cart:
                if not all(k in item for k in ['name', 'quantity', 'price']):
                    return Response({"detail": "Invalid item in cart"}, status=400)
                order_items.append(
                    OrderItem(
                        order=order,
                        name=str(item['name']),
                        quantity=int(item['quantity']),
                        price=float(item['price'])
                    )
                )
            OrderItem.objects.bulk_create(order_items)

            # Recalculate balance (via model save)
            order.save()

            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except (ValueError, TypeError) as e:
            return Response({"detail": f"Invalid data type: {e}"}, status=400)
        except Exception as e:
            return Response({"detail": str(e)}, status=400)

    # ──────────────────────────────
    # 2. MARK AS PAID
    # ──────────────────────────────
    @action(detail=True, methods=['post'], url_path='mark_paid')
    def mark_paid(self, request, pk=None):
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

    # ──────────────────────────────
    # 3. TODAY'S COLLECTION SUMMARY
    # ──────────────────────────────
    @action(detail=False, methods=['get'], url_path='today_collection')
    def today_collection(self, request):
        today = date.today()
        paid_orders = Order.objects.filter(
            status='paid',
            paid_at__date=today
        )

        collection = paid_orders.aggregate(
            total=Sum('total_amount'),
            cash=Sum('total_amount', filter=Q(payment_mode='cash')),
            card=Sum('total_amount', filter=Q(payment_mode='card')),
            upi=Sum('total_amount', filter=Q(payment_mode='upi')),
        )

        # Convert Decimal/None → float
        result = {
            "total": float(collection['total'] or 0),
            "cash": float(collection['cash'] or 0),
            "card": float(collection['card'] or 0),
            "upi": float(collection['upi'] or 0),
        }

        return Response(result, status=status.HTTP_200_OK)