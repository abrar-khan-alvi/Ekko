from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    UserSignupSerializer, UserSerializer, VerifyOTPSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, MyTokenObtainPairSerializer,
    ChangePasswordSerializer, NotificationSerializer
)
from .models import User, OTP, Notification
from .utils import generate_otp, send_otp_email

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            # Store validated data in cache for 10 minutes
            from .utils import generate_cache_otp, send_otp_email
            code = generate_cache_otp(email, request.data)
            send_otp_email(email, code, 'signup')
            return Response(
                {"message": "OTP sent to your email. Please verify to complete registration."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            purpose = serializer.validated_data['purpose']
            
            if purpose == 'signup':
                from .utils import verify_cache_otp
                signup_data = verify_cache_otp(email, code)
                if signup_data:
                    # OTP is valid, now create the user and business profile
                    serializer = UserSignupSerializer(data=signup_data)
                    if serializer.is_valid():
                        user = serializer.save()
                        user.is_verified = True
                        user.is_active = True
                        user.save()
                        return Response({"message": "Registration and verification successful"}, status=status.HTTP_201_CREATED)
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Legacy logic for password reset (user already exists)
            try:
                otp = OTP.objects.get(user__email=email, code=code, purpose=purpose)
                if otp.is_valid():
                    # For 'reset': do NOT delete the OTP here — ResetPasswordView
                    # needs it to authorise the actual password change.
                    if purpose != 'reset':
                        otp.delete()
                    return Response({"message": "Verification successful"}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)
            except OTP.DoesNotExist:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                otp = generate_otp(user, 'reset')
                send_otp_email(user.email, otp.code, 'reset')
                return Response({"message": "OTP sent to your email"}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                # Return 200 even if user doesn't exist for security
                return Response({"message": "If this email is registered, you will receive an OTP"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print(f"[reset-password] incoming data: {request.data}")
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            new_password = serializer.validated_data['new_password']
            
            try:
                otp = OTP.objects.get(user__email=email, code=code, purpose='reset')
                if otp.is_valid():
                    user = otp.user
                    user.set_password(new_password)
                    user.save()
                    otp.delete()
                    return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)
                else:
                    print(f"[reset-password] OTP expired for {email}")
                    return Response({"error": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)
            except OTP.DoesNotExist:
                print(f"[reset-password] OTP DoesNotExist for email={email} code={code}")
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
        print(f"[reset-password] serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            from .serializers import AdminUserUpdateSerializer
            return AdminUserUpdateSerializer
        return UserSerializer

from rest_framework.decorators import action
from django.db import models
import logging

logger = logging.getLogger(__name__)

class n8nWebhookReceiverView(APIView):
    """
    Accepts POST requests from n8n for 'Reminder Sent' events.
    Expected payload matches what n8n sends:
    [
        { "businessName": "...", "customerName": "...", "customerPhone": "...", "AppointmentTIme": "..." },
        ...
    ]
    """
    permission_classes = [permissions.AllowAny] # You may want to secure this with a secret header in production

    def post(self, request):
        payload = request.data
        if not isinstance(payload, list):
            payload = [payload]
            
        created_count = 0
        for item in payload:
            business_name = item.get('businessName')
            customer_name = item.get('customerName')
            customer_phone = str(item.get('customerPhone', ''))
            appointment_time = item.get('AppointmentTIme')
            
            # Try to associate with a user based on businessName. This is an approximation.
            # If the user can't be found, we still save the notification unattached, 
            # but ideally the webhook should send a businessId or user email.
            user = None
            if business_name:
                try:
                    from .models import BusinessProfile
                    profile = BusinessProfile.objects.filter(business_name=business_name).first()
                    if profile:
                        user = profile.user
                except Exception as e:
                    logger.error(f"Error finding user for business '{business_name}': {e}")

            Notification.objects.create(
                user=user,
                title="Reminder Sent",
                message=f"Reminder sent to {customer_name} for their appointment at {business_name} on {appointment_time}.",
                notification_type="reminder",
                business_name=business_name,
                customer_name=customer_name,
                customer_phone=customer_phone,
                appointment_time=appointment_time
            )
            created_count += 1
            
        return Response({"message": f"Successfully processed {created_count} notifications"}, status=status.HTTP_201_CREATED)

from rest_framework.pagination import PageNumberPagination

class NotificationPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination
    def get_queryset(self):
        user = self.request.user
        
        # Admin users see all notifications
        if user.is_staff or user.is_superuser:
            return Notification.objects.all().order_by('-created_at')
            
        # Business owners see notifications matching their business profile or user ID
        try:
            from .models import BusinessProfile
            profile = BusinessProfile.objects.filter(user=user).first()
            if profile and profile.business_name:
                return Notification.objects.filter(
                    models.Q(user=user) | models.Q(business_name=profile.business_name)
                ).order_by('-created_at')
        except Exception:
            pass
            
        # Fallback to only user-assigned notifications
        return Notification.objects.filter(user=user).order_by('-created_at')

class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
            # Make sure the user owns the notification, or it's a global one
            # Admin can read anything
            if not (request.user.is_staff or request.user.is_superuser):
                if notification.user and notification.user != request.user:
                    # Allow if it's matching their business profile
                    from .models import BusinessProfile
                    profile = BusinessProfile.objects.filter(user=request.user).first()
                    if not (profile and profile.business_name == notification.business_name):
                        return Response(status=status.HTTP_403_FORBIDDEN)
                
            notification.read_by.add(request.user)
            return Response({"status": "read"}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Get all notifications the user currently has access to see
        if user.is_staff or user.is_superuser:
            notifications = Notification.objects.all()
        else:
            from .models import BusinessProfile
            profile = BusinessProfile.objects.filter(user=user).first()
            if profile and profile.business_name:
                notifications = Notification.objects.filter(
                    models.Q(user=user) | models.Q(business_name=profile.business_name)
                )
            else:
                notifications = Notification.objects.filter(user=user)
                
        # Exclude those already read by the user
        unread_notifications = notifications.exclude(read_by=user)
        
        count = unread_notifications.count()
        for notif in unread_notifications:
            notif.read_by.add(user)
            
        return Response({"status": "all_read", "marked_count": count}, status=status.HTTP_200_OK)

class NotificationUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get all notifications the user currently has access to see
        if user.is_staff or user.is_superuser:
            notifications = Notification.objects.all()
        else:
            from .models import BusinessProfile
            profile = BusinessProfile.objects.filter(user=user).first()
            if profile and profile.business_name:
                notifications = Notification.objects.filter(
                    models.Q(user=user) | models.Q(business_name=profile.business_name)
                )
            else:
                notifications = Notification.objects.filter(user=user)
                
        # Exclude those already read by the user
        unread_count = notifications.exclude(read_by=user).count()
        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)
