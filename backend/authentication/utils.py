import random
import string
import logging
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
from .models import OTP

logger = logging.getLogger(__name__)

def generate_otp(user, purpose):
    """Legacy OTP for existing users (e.g. password reset)"""
    OTP.objects.filter(user=user, purpose=purpose).delete()
    code = ''.join(random.choices(string.digits, k=6))
    expires_at = timezone.now() + timedelta(minutes=10)
    otp = OTP.objects.create(user=user, code=code, purpose=purpose, expires_at=expires_at)
    return otp

def generate_cache_otp(email, signup_data, purpose='signup'):
    """Generate OTP and store signup data in cache for unverified users"""
    code = ''.join(random.choices(string.digits, k=6))
    cache_key_otp = f"otp_{purpose}_{email}"
    cache_key_data = f"data_{purpose}_{email}"
    
    # Store OTP and signup data for 10 minutes
    cache.set(cache_key_otp, code, timeout=600)
    cache.set(cache_key_data, signup_data, timeout=600)
    return code

def verify_cache_otp(email, code, purpose='signup'):
    """Verify OTP from cache and return signup data if valid"""
    cache_key_otp = f"otp_{purpose}_{email}"
    cache_key_data = f"data_{purpose}_{email}"
    
    cached_code = cache.get(cache_key_otp)
    if cached_code and cached_code == code:
        signup_data = cache.get(cache_key_data)
        # Clear cache after successful verification
        cache.delete(cache_key_otp)
        cache.delete(cache_key_data)
        return signup_data
    return None

def send_otp_email(email, code, purpose):
    subject = "Verify your email" if purpose == 'signup' else "Reset your password"
    message = f"Your OTP for {purpose} is: {code}. It will expire in 10 minutes."
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        logger.error(f"Failed to send {purpose} OTP to {email}: {str(e)}")
