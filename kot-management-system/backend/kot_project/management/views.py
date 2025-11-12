import random
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from management.models import AdminUser, EmailOTP
from django.contrib.auth.hashers import make_password
import logging
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger("otp_sender")


class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'waiter')
        otp = request.data.get('otp')

        try:
            otp_entry = EmailOTP.objects.get(email=email)
        except EmailOTP.DoesNotExist:
            return Response({"error": "OTP not found"}, status=400)

        if otp_entry.otp != otp:
            return Response({"error": "Invalid OTP"}, status=400)
        if timezone.now() > otp_entry.expires_at:
            return Response({"error": "OTP expired"}, status=400)

        if AdminUser.objects.filter(username=username).exists():
            return Response({"error": "Username already taken"}, status=400)

        # Create verified user
        user = AdminUser.objects.create(
            username=username,
            email=email,
            password=make_password(password),
            role=role,
            is_verified=True
        )

        otp_entry.delete()  # Remove OTP entry once verified

        return Response({"message": "Registration successful"}, status=201)
        


class SendEmailOTPView(APIView):
    def post(self, request):
        # ------------------------------------------------------------------
        # 1. Log the incoming request
        # ------------------------------------------------------------------
        print("\n=== [OTP] POST /api/send-otp/ ===")
        print(f"Request data: {request.data}")
        print(f"Request META (IP, User-Agent, etc.): {request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))}")

        email = request.data.get("email")

        # ------------------------------------------------------------------
        # 2. Validate email presence
        # ------------------------------------------------------------------
        if not email:
            print("Validation failed: No email provided")
            return Response({"error": "Email is required"}, status=400)

        print(f"Requested email: {email}")

        # ------------------------------------------------------------------
        # 3. Check if email already registered
        # ------------------------------------------------------------------
        if AdminUser.objects.filter(email=email).exists():
            print(f"Email {email} is already registered")
            return Response({"error": "Email already registered"}, status=400)

        # ------------------------------------------------------------------
        # 4. Generate OTP
        # ------------------------------------------------------------------
        otp = str(random.randint(100000, 999999))
        print(f"Generated OTP: {otp}")

        # ------------------------------------------------------------------
        # 5. Save OTP in DB
        # ------------------------------------------------------------------
        try:
            obj, created = EmailOTP.objects.update_or_create(
                email=email,
                defaults={
                    "otp": otp,
                    "expires_at": timezone.now() + timedelta(minutes=10),
                },
            )
            print(f"OTP saved → created={created}, expires_at={obj.expires_at}")
        except Exception as db_err:
            print(f"Database error while saving OTP: {db_err}")
            logger.exception("DB error in SendEmailOTPView")
            return Response({"error": "Failed to store OTP", "detail": str(db_err)}, status=500)

        # ------------------------------------------------------------------
        # 6. Send email
        # ------------------------------------------------------------------
        try:
            print("Attempting to send email via SMTP...")
            send_mail(
                subject="Your KOT Email Verification OTP",
                message=f"Your OTP is: {otp}\nValid for 10 minutes.",
                from_email=None,               # Uses DEFAULT_FROM_EMAIL from settings
                recipient_list=[email],
                fail_silently=False,
            )
            print("Email sent successfully!")
            logger.info(f"OTP email sent to {email} (OTP: {otp})")
            return Response({"message": "OTP sent successfully"}, status=200)

        except Exception as mail_err:
            # ------------------------------------------------------------------
            # 7. Email failed → log everything
            # ------------------------------------------------------------------
            print(f"Email sending failed: {mail_err}")
            logger.exception(f"SMTP error for {email}")
            return Response(
                {"error": "Failed to send email", "detail": str(mail_err)}, status=500
            )

class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        try:
            user = AdminUser.objects.get(email=email)
            otp_obj = EmailOTP.objects.get(user=user)
        except (AdminUser.DoesNotExist, EmailOTP.DoesNotExist):
            return Response({"error": "Invalid email or OTP"}, status=400)

        if otp_obj.is_expired():
            return Response({"error": "OTP expired"}, status=400)
        if otp_obj.otp != otp:
            return Response({"error": "Invalid OTP"}, status=400)

        user.is_verified = True
        user.is_active = True
        user.save()
        otp_obj.delete()

        return Response({"message": "Email verified! You can now log in."}, status=200)



class LoginView(APIView):
    def post(self, request):
        identifier = request.data.get('identifier')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({"error": "Both fields are required"}, status=400)

        # Try to find user by email or username
        try:
            user = AdminUser.objects.get(email=identifier)
        except AdminUser.DoesNotExist:
            try:
                user = AdminUser.objects.get(username=identifier)
            except AdminUser.DoesNotExist:
                return Response({"error": "Invalid credentials"}, status=400)

        if not user.is_verified:
            return Response({"error": "Please verify your email first"}, status=403)

        user = authenticate(username=user.username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=400)

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Login successful",
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=200)