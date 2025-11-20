# backend/kot_project/cashier/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # Change to IsAuthenticated in production
from django.utils import timezone
from django.db.models import Sum, Q
from datetime import date

from .models import Order, OrderItem
from .serializers import OrderSerializer
from management.models import AdminUser


class CashierOrderViewSet(viewsets.ModelViewSet):
    """
    API for Cashier:
    - List all orders (pending + paid)
    - Create new order (waiter → cashier)
    - Mark order as paid
    - Cancel order
    - Get today's collection summary
    - Refund order (partial or full)
    """
    queryset = Order.objects.prefetch_related('items').order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]  # Use IsAuthenticated in production

    # ──────────────────────────────
    # 1. CREATE ORDER (Waiter → Cashier)
    # ──────────────────────────────
    # cashier/views.py - Update the create_order method
    # cashier/views.py
    @action(detail=False, methods=['post'], url_path='create_order')
    def create_order(self, request):
        data = request.data
        try:
            # Validate required fields
            required = ['table_number', 'total_amount', 'cart']  # Updated field names
            missing = [field for field in required if field not in data]
            if missing:
                return Response(
                    {"detail": f"Missing fields: {', '.join(missing)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get waiter
            waiter_id = data.get('waiter')
            waiter = None
            if waiter_id:
                try:
                    waiter = AdminUser.objects.get(id=waiter_id)
                except AdminUser.DoesNotExist:
                    return Response({"detail": "Invalid waiter_id"}, status=400)

            payment_mode = data.get('payment_mode', 'cash').lower()

            # Get seat information
            selected_seats = data.get('selected_seats', [])
            table_id = data.get('table_id')

            # Create order
            order = Order.objects.create(
                table_number=int(data['table_number']),
                table_id=table_id,
                selected_seats=selected_seats,
                total_amount=float(data['total_amount']),
                payment_mode=payment_mode,
                received_amount=float(data.get('received_amount', 0)),
                status='pending',
                waiter=waiter
            )

            # Create OrderItems - FIXED: Include food_id
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
                        food_id=item.get('food_id'),  # Make sure this is included
                        name=str(item['name']),
                        quantity=int(item['quantity']),
                        price=float(item['price'])
                    )
                )
            
            OrderItem.objects.bulk_create(order_items)

            # Mark selected seats as occupied
            if selected_seats:
                from management.models import TableSeat
                TableSeat.objects.filter(
                    seat_number__in=selected_seats,
                    table__table_number=data['table_number']
                ).update(is_available=False)

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
    # 3. CANCEL ORDER
    # ──────────────────────────────
    @action(detail=True, methods=['post'], url_path='cancel_order')
    def cancel_order(self, request, pk=None):
        try:
            order = self.get_object()
            if order.status == 'cancelled':
                return Response(
                    {"detail": "Order already cancelled"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.status = 'cancelled'
            order.cancelled_at = timezone.now()
            order.save()

            return Response(
                {"message": "Order cancelled successfully", "order_id": order.order_id},
                status=status.HTTP_200_OK
            )
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    # ──────────────────────────────
    # 4. TODAY'S COLLECTION SUMMARY
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

        result = {
            "total": float(collection['total'] or 0),
            "cash": float(collection['cash'] or 0),
            "card": float(collection['card'] or 0),
            "upi": float(collection['upi'] or 0),
        }

        return Response(result, status=status.HTTP_200_OK)

    # ──────────────────────────────
    # 5. REFUND ORDER (Partial or Full)
    # ──────────────────────────────
    @action(detail=True, methods=['post'], url_path='refund')
    def refund(self, request, pk=None):
        """
        POST /api/cashier-orders/{id}/refund/
        Body: { "amount": 150.00, "reason": "Customer unhappy" }
        """
        try:
            order = self.get_object()

            # Calculate remaining refundable amount
            remaining = float(order.total_amount) - float(order.refunded_amount or 0)
            amount = float(request.data.get('amount', 0))

            if order.is_refunded and remaining <= 0:
                return Response(
                    {"error": "This order is already fully refunded"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if amount <= 0:
                return Response(
                    {"error": "Refund amount must be greater than 0"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if amount > remaining:
                return Response(
                    {"error": f"Cannot refund ₹{amount}. Max refundable: ₹{remaining}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process refund
            order.refunded_amount = float(order.refunded_amount or 0) + amount
            order.refund_reason = request.data.get('reason', 'No reason provided')
            order.refunded_at = timezone.now()
            order.save()

            return Response({
                "message": "Refund processed successfully",
                "refunded_amount": float(order.refunded_amount),
                "remaining_amount": float(order.total_amount) - float(order.refunded_amount),
                "is_fully_refunded": order.refunded_amount >= order.total_amount
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, TypeError) as e:
            return Response({"error": f"Invalid amount: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)