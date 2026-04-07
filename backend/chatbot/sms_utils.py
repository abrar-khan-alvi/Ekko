"""
SMS notification utilities.
Sends messages via an n8n webhook which handles delivery to SMS.
All messages are sent in a background thread to avoid blocking.
"""
import logging
import threading
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

SMS_WEBHOOK_URL = getattr(settings, 'N8N_SMS_WEBHOOK_URL', None)


def _send_sms(phone: str, message: str, business_name: str):
    """
    POST to the n8n SMS webhook in a background thread.
    Payload: { "to": phone, "message": message, "businessName": business_name }
    """
    if not phone:
        return

    # Check if the number has + in the number then don't add "+" if not "+" then add "+"
    phone = phone.strip()
    if not phone.startswith('+'):
        phone = '+' + phone

    def _send():
        try:
            payload = {
                "to": phone,
                "message": message,
                "businessName": business_name,
            }
            response = requests.post(SMS_WEBHOOK_URL, json=payload, timeout=10)
            if response.status_code == 200:
                logger.info(f"[sms] Message sent to {phone} via n8n")
            else:
                logger.warning(f"[sms] n8n returned {response.status_code} for {phone}: {response.text[:200]}")
        except Exception as e:
            logger.error(f"[sms] Failed to send SMS to {phone}: {e}")

    threading.Thread(target=_send).start()


# ─── 1. Thank You Message ──────────────────────────────────────────────────────

def send_sms_thank_you(appointment):
    """Sent when customer is marked as Visited."""
    phone = appointment.customer_phone
    if not phone:
        return

    biz_name = appointment.business_name or "Us"
    customer_name = appointment.customer_name or "there"
    service = appointment.service or "your appointment"

    message = (
        f"Hi {customer_name}! 👋\n\n"
        f"Thank you for visiting {biz_name} today for {service}. "
        f"We really appreciate it! 🙏\n\n"
        f"See you again soon!\n— {biz_name}"
    )

    _send_sms(phone, message, biz_name)


# ─── 2. 48hr Reminder Message ──────────────────────────────────────────────────

def send_sms_48hr_reminder(appointment):
    """Sent ~48 hours before the appointment."""
    phone = appointment.customer_phone
    if not phone:
        return

    biz_name = appointment.business_name or "Us"
    customer_name = appointment.customer_name or "there"
    service = appointment.service or "your appointment"

    dt = appointment.appointment_datetime
    dt_str = dt.strftime("%A, %m/%d at %I:%M %p") if dt else "your scheduled time"

    message = (
        f"Hi {customer_name}! Reminder from {biz_name}: "
        f"You have an upcoming appointment for {service} on {dt_str}. "
        f"See you soon! 😊"
    )

    _send_sms(phone, message, biz_name)


# ─── 3. Overdue / No-show Message ─────────────────────────────────────────────

def send_sms_overdue(appointment):
    """Sent when a customer didn't show up (action = No, 24hr after appointment)."""
    phone = appointment.customer_phone
    if not phone:
        return

    biz_name = appointment.business_name or "Us"
    customer_name = appointment.customer_name or "there"
    service = appointment.service or "your appointment"

    message = (
        f"Hi {customer_name}! 😢 We missed you at {biz_name} for your {service}. "
        f"We'd love to reschedule! Feel free to reach out to book your next visit. 📅"
    )

    _send_sms(phone, message, biz_name)
