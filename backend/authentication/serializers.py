from rest_framework import serializers, exceptions
from .models import User, BusinessProfile

class BusinessProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessProfile
        fields = ['business_name', 'business_hours', 'services_offered', 'booking_policies']

class UserSignupSerializer(serializers.ModelSerializer):
    business_profile = BusinessProfileSerializer()

    class Meta:
        model = User
        fields = ['email', 'password', 'full_name', 'address', 'phone_number', 'business_profile']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        profile_data = validated_data.pop('business_profile')
        user = User.objects.create_user(**validated_data)
        
        # Save BusinessProfile with redundant user info as requested
        BusinessProfile.objects.create(
            user=user, 
            name=user.full_name, 
            email=user.email, 
            **profile_data
        )
        
        user.is_active = False # Ensure they stay inactive until OTP
        user.is_verified = False
        user.save()
        return user

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_verified:
            raise exceptions.AuthenticationFailed(
                'Email not verified. Please verify your email before logging in.',
                'email_not_verified'
            )
        return data

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    purpose = serializers.ChoiceField(choices=['signup', 'reset'])

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8)

class UserSerializer(serializers.ModelSerializer):
    business_profile = BusinessProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'address', 'phone_number', 'is_superuser', 'business_profile', 'is_verified', 'is_active', 'is_paid', 'date_joined']
        read_only_fields = ['email', 'full_name', 'address', 'phone_number', 'is_superuser', 'is_verified', 'is_active', 'date_joined']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('business_profile', None)
        if profile_data:
            profile = instance.business_profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        # Other fields are read_only, so they won't be in validated_data unless forced
        return super().update(instance, validated_data)

class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['is_paid', 'is_active']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs
