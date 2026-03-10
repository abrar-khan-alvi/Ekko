import random
import string
import logging
import threading
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
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


# ─── Subscription notification emails ─────────────────────────────────────────

def _send_subscription_email(email, name, subject, html_body):
    """Internal helper — sends an HTML email in a background thread."""
    def _send():
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=html_body,  # fallback plain-text (browsers strip tags)
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"[email] Subscription email '{subject}' sent to {email}")
        except Exception as e:
            logger.error(f"[email] Failed to send subscription email to {email}: {e}")

    threading.Thread(target=_send).start()


def send_subscription_activated_email(user):
    """Notify a user that their subscription has been activated."""
    name = user.full_name or user.email
    subject = "🎉 Your Ekko Loop Subscription is Active!"
    html = render_to_string('authentication/email_subscription_activated.html', {
        'name': name,
        'subject': subject,
    })
    _send_subscription_email(user.email, name, subject, html)


def send_subscription_deactivated_email(user):
    """Notify a user that their subscription has been deactivated."""
    name = user.full_name or user.email
    subject = "Your Ekko Loop Subscription Has Ended"
    html = render_to_string('authentication/email_subscription_deactivated.html', {
        'name': name,
        'subject': subject,
    })
    _send_subscription_email(user.email, name, subject, html)

