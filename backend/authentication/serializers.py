from rest_framework import serializers, exceptions
import re
from .models import User, BusinessProfile
import requests
import threading
from django.conf import settings

# Matches: Mon-Fri 09:00-17:00 | Monday-Friday 09:00-17:00 etc.
_HOURS_RE = re.compile(
    r'^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)'
    r'[\s\-]+'
    r'(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)'
    r'\s+\d{1,2}:\d{2}-\d{1,2}:\d{2}$',
    re.IGNORECASE
)

class BusinessProfileSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(required=False, allow_blank=True)
    business_hours = serializers.CharField(required=False, allow_blank=True)
    services_offered = serializers.CharField(required=False, allow_blank=True)
    booking_policies = serializers.CharField(required=False, allow_blank=True)
    facebook_link = serializers.URLField(required=False, allow_blank=True)
    instagram_link = serializers.URLField(required=False, allow_blank=True)
    linkedin_link = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = BusinessProfile
        fields = ['business_name', 'business_hours', 'services_offered', 'booking_policies', 'facebook_link', 'instagram_link', 'linkedin_link']

    def validate_business_name(self, value):
        if value and len(value.strip()) > 100:
            raise serializers.ValidationError("Business name must be 100 characters or fewer.")
        if value and value.strip().isdigit():
            raise serializers.ValidationError("Business name cannot be purely numeric.")
        return value

    def validate_business_hours(self, value):
        if value and not _HOURS_RE.match(value.strip()):
            raise serializers.ValidationError(
                "Use format: Mon-Fri 09:00-17:00 or Sun-Sat 10:00-18:00"
            )
        return value

    def validate_services_offered(self, value):
        if value:
            services = [s.strip() for s in value.split(',') if s.strip()]
            if not services:
                raise serializers.ValidationError("At least one service must be listed.")
            if any(len(s) < 2 for s in services):
                raise serializers.ValidationError(
                    "Each service must be at least 2 characters, separated by commas."
                )
        return value

    def validate_booking_policies(self, value):
        if value and len(value.strip()) < 5:
            raise serializers.ValidationError(
                "Booking policy description must be at least 5 characters (e.g. Monday to Saturday)."
            )
        return value


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
        fields = ['id', 'email', 'full_name', 'address', 'phone_number', 'is_superuser', 'is_staff', 'last_login', 'business_profile', 'is_verified', 'is_active', 'is_paid', 'date_joined']
        read_only_fields = ['email', 'full_name', 'address', 'phone_number', 'is_superuser', 'is_staff', 'last_login', 'is_verified', 'is_active', 'date_joined']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('business_profile', None)
        has_business_change = False

        if profile_data is not None:
            if not instance.is_paid:
                raise exceptions.ValidationError({
                    "business_profile": "You must have an active PRO subscription to update your business profile."
                })
                
            try:
                profile = instance.business_profile
            except BusinessProfile.DoesNotExist:
                profile = BusinessProfile.objects.create(user=instance, business_name='', business_hours='', services_offered='', booking_policies='')

            changed_fields = []
            print(f"[DEBUG] Profile Update Receieved Fields: {profile_data}")
            for attr, value in profile_data.items():
                if getattr(profile, attr) != value:
                    print(f"[DEBUG] Profile Field Updating -> {attr} : {value}")
                    setattr(profile, attr, value)
                    changed_fields.append(attr)
                    has_business_change = True

            if changed_fields:
                profile.save(update_fields=changed_fields)

        # Trigger webhook whenever business profile data was sent in the request
        # (always keep n8n / Google Sheets in sync)
        if profile_data is not None and instance.is_paid:
            self._trigger_n8n_webhook(instance, endpoint='update-business')

        # Other fields are read_only, so they won't be in validated_data unless forced
        user = super().update(instance, validated_data)

        return user

    def _trigger_n8n_webhook(self, user, endpoint):
        def send_webhook():
            try:
                business = user.business_profile
                business_name = business.business_name if business else getattr(user, 'full_name', '')
                
                payload = {
                    "email": user.email,
                    "businessId": str(business.id) if business else str(getattr(user, 'id', '')),
                    "businessName": business_name,
                    "businessHours": business.business_hours if business else '',
                    "services": business.services_offered if business else '',
                    "bookingPolicies": business.booking_policies if business else '',
                    "bookingFacebook": business.facebook_link if business else '',
                    "bookingInstagram": business.instagram_link if business else '',
                    "bookingLinkedin": business.linkedin_link if business else ''
                }
                
                headers = {
                    "Content-Type": "application/json",
                    "x-admin-secret": getattr(settings, 'N8N_WEBHOOK_SECRET', '')
                }
                
                # Using the update endpoint provided by the user
                webhook_url = getattr(settings, 'N8N_UPDATE_WEBHOOK_URL', 'https://ekkoflow.app.n8n.cloud/webhook/update-business')
                
                requests.post(webhook_url, json=payload, headers=headers, timeout=5)
            except Exception as e:
                print(f"Failed to trigger n8n update webhook: {e}")

        threading.Thread(target=send_webhook).start()

class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['is_paid', 'is_active', 'is_staff', 'is_superuser']

    def update(self, instance, validated_data):
        from .utils import send_subscription_activated_email, send_subscription_deactivated_email

        # Capture state before saving
        was_paid = instance.is_paid
        becomes_paid = validated_data.get('is_paid', was_paid)

        was_active = instance.is_active
        becomes_active = validated_data.get('is_active', was_active)

        # Call super to actually update the user
        user = super().update(instance, validated_data)

        # ── Subscription status changed → fire webhook + email ──
        if not was_paid and becomes_paid:
            # Newly activated
            self._trigger_n8n_webhook(user, endpoint='activate-business')
            send_subscription_activated_email(user)

        elif was_paid and not becomes_paid:
            # Deactivated
            self._trigger_n8n_webhook(user, endpoint='deactivate-business')
            send_subscription_deactivated_email(user)

        elif was_paid and becomes_paid and (was_active != becomes_active):
            # Still paid but active flag changed
            self._trigger_n8n_webhook(user, endpoint='update-business')

        return user

    def _trigger_n8n_webhook(self, user, endpoint):
        def send_webhook():
            try:
                business = user.business_profile
                business_name = business.business_name if business else getattr(user, 'full_name', '')
                
                if endpoint == 'deactivate-business':
                    payload = {
                        "businessId": str(business.id) if business else str(getattr(user, 'id', '')),
                        "businessName": business_name
                    }
                else:
                    payload = {
                        "businessId": str(business.id) if business else str(getattr(user, 'id', '')),
                        "businessName": business_name,
                        "businessHours": business.business_hours if business else '',
                        "services": business.services_offered if business else '',
                        "bookingPolicies": business.booking_policies if business else '',
                        "bookingFacebook": business.facebook_link if business else '',
                        "bookingInstagram": business.instagram_link if business else '',
                        "bookingLinkedin": business.linkedin_link if business else ''
                    }
                
                # Exclude the "x-admin-secret" headers as your tested payload didn't strictly require auth OR we can safely leave it.
                # Let's keep it as is, but ensure Content-Type is set.
                headers = {
                    "Content-Type": "application/json",
                    "x-admin-secret": getattr(settings, 'N8N_WEBHOOK_SECRET', '')
                }
                
                webhook_url = getattr(settings, f'N8N_{endpoint.upper().replace("-", "_")}_WEBHOOK_URL', f'https://ekkoflow.app.n8n.cloud/webhook/{endpoint}')
                
                print(f"[n8n] Firing '{endpoint}' webhook → {webhook_url}")
                print(f"[n8n] Payload: {payload}")
                response = requests.post(webhook_url, json=payload, headers=headers, timeout=5)
                print(f"[n8n] Response: {response.status_code} — {response.text[:300]}")
            except Exception as e:
                print(f"[n8n] FAILED to trigger '{endpoint}' webhook: {e}")

        # Run in background to avoid blocking the API response
        threading.Thread(target=send_webhook).start()

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'is_read', 'created_at',
            'business_name', 'customer_name', 'customer_phone', 'appointment_time'
        ]
        read_only_fields = fields

    def get_is_read(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return obj.read_by.filter(id=user.id).exists()
