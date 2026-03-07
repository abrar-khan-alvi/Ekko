from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    UserSignupSerializer, UserSerializer, VerifyOTPSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, MyTokenObtainPairSerializer,
    ChangePasswordSerializer
)
from .models import User, OTP
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
                    user = otp.user
                    if purpose == 'signup': # This branch should technically be unreachable now for signup
                        user.is_verified = True
                        user.is_active = True
                        user.save()
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
                    return Response({"error": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)
            except OTP.DoesNotExist:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
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
