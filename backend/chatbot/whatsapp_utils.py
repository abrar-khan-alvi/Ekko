"""
WhatsApp notification utilities.
Sends messages via an n8n webhook which handles delivery to WhatsApp.
All messages are sent in a background thread to avoid blocking.
"""
import logging
import threading
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

WHATSAPP_WEBHOOK_URL = getattr(settings, 'N8N_WHATSAPP_WEBHOOK_URL', None)


def _send_whatsapp(phone: str, message: str, business_name: str):
    """
    POST to the n8n WhatsApp webhook in a background thread.
    Payload: { "to": phone, "message": message, "businessName": business_name }
    """
    if not phone:
        return

    def _send():
        try:
            payload = {
                "to": phone,
                "message": message,
                "businessName": business_name,
            }
            response = requests.post(WHATSAPP_WEBHOOK_URL, json=payload, timeout=10)
            if response.status_code == 200:
                logger.info(f"[whatsapp] Message sent to {phone} via n8n")
            else:
                logger.warning(f"[whatsapp] n8n returned {response.status_code} for {phone}: {response.text[:200]}")
        except Exception as e:
            logger.error(f"[whatsapp] Failed to send WhatsApp to {phone}: {e}")

    threading.Thread(target=_send).start()


# ─── 1. Thank You Message ──────────────────────────────────────────────────────

def send_whatsapp_thank_you(appointment):
    """Sent when customer is marked as Visited."""
    phone = appointment.whatsapp_number or appointment.customer_phone
    if not phone:
        return

    biz_name = appointment.business_name or "Us"
    customer_name = appointment.customer_name or "there"
    service = appointment.service or "your appointment"

    message = (
        f"Hi {customer_name}! 👋\n\n"
        f"Thank you so much for visiting *{biz_name}* today for *{service}*. "
        f"We really appreciate your visit and hope you had a great experience! 🙏\n\n"
        f"We look forward to seeing you again soon. Feel free to reach out anytime!\n\n"
        f"— {biz_name}"
    )

    _send_whatsapp(phone, message, biz_name)


# ─── 2. 48hr Reminder Message ──────────────────────────────────────────────────

def send_whatsapp_48hr_reminder(appointment):
    """Sent ~48 hours before the appointment."""
    phone = appointment.whatsapp_number or appointment.customer_phone
    if not phone:
        return

    biz_name = appointment.business_name or "Us"
    customer_name = appointment.customer_name or "there"
    service = appointment.service or "your appointment"

    dt = appointment.appointment_datetime
    dt_str = dt.strftime("%A, %B %d at %I:%M %p") if dt else "your scheduled time"

    message = (
        f"Hi {customer_name}! ⏰\n\n"
        f"This is a friendly reminder from *{biz_name}* that you have an upcoming appointment:\n\n"
        f"📅 *Date & Time:* {dt_str}\n"
        f"✂️ *Service:* {service}\n"
        f"🏢 *Business:* {biz_name}\n\n"
        f"If you need to reschedule or have any questions, please contact us as soon as possible.\n\n"
        f"See you soon! 😊\n— {biz_name}"
    )

    _send_whatsapp(phone, message, biz_name)


# ─── 3. Overdue / No-show Message ─────────────────────────────────────────────

def send_whatsapp_overdue(appointment):
    """Sent when a customer didn't show up (action = No, 24hr after appointment)."""
    phone = appointment.whatsapp_number or appointment.customer_phone
    if not phone:
        return

    biz_name = appointment.business_name or "Us"
    customer_name = appointment.customer_name or "there"
    service = appointment.service or "your appointment"

    dt = appointment.appointment_datetime
    dt_str = dt.strftime("%A, %B %d") if dt else "your scheduled date"

    message = (
        f"Hi {customer_name}! 😢\n\n"
        f"We noticed you weren't able to make it to your appointment at *{biz_name}* "
        f"on *{dt_str}* for *{service}*.\n\n"
        f"We completely understand that things come up! We'd love to have you reschedule "
        f"at a time that works for you. 📅\n\n"
        f"Feel free to reply to this message or contact us directly to book your next visit.\n\n"
        f"Hope to see you soon! 💙\n— {biz_name}"
    )

    _send_whatsapp(phone, message, biz_name)
