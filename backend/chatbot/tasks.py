"""
Celery tasks for appointment email automation.
Runs via Celery Beat every hour (configurable in settings.py).
"""
import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Appointment
from .email_utils import send_48hr_reminder_email, send_overdue_email
from .whatsapp_utils import send_whatsapp_48hr_reminder, send_whatsapp_overdue
from .sms_utils import send_sms_48hr_reminder, send_sms_overdue

logger = logging.getLogger(__name__)


@shared_task(name='chatbot.tasks.send_48hr_reminder_emails')
def send_48hr_reminder_emails():
    """
    Find appointments happening in 47–49 hours from now that haven't been reminded yet.
    Runs every hour via Celery Beat.
    The 2-hour window ensures we don't miss any appointment even if the task runs slightly late.
    """
    now = timezone.now()
    window_start = now + timedelta(hours=47)
    window_end   = now + timedelta(hours=49)

    appointments = Appointment.objects.filter(
        appointment_datetime__gte=window_start,
        appointment_datetime__lte=window_end,
        reminder_sent=False,
        customer_email__isnull=False,
    ).exclude(customer_email='')

    count = 0
    for appt in appointments:
        try:
            send_48hr_reminder_email(appt)
            send_whatsapp_48hr_reminder(appt)
            send_sms_48hr_reminder(appt)
            appt.reminder_sent = True
            appt.status = 'Reminder Sent'
            appt.save(update_fields=['reminder_sent', 'status'])
            count += 1
            logger.info(f"[tasks] 48hr reminder sent for appointment {appt.id} ({appt.customer_name})")
        except Exception as e:
            logger.error(f"[tasks] Failed to send reminder for appointment {appt.id}: {e}")

    logger.info(f"[tasks] send_48hr_reminder_emails: processed {count} appointments")
    return f"Sent {count} reminder emails"


@shared_task(name='chatbot.tasks.send_overdue_emails')
def send_overdue_emails():
    """
    Find appointments that:
    - Happened more than 24 hours ago
    - action is still 'No' (customer did not visit)
    - overdue email has not been sent yet
    Runs every hour via Celery Beat.
    """
    cutoff = timezone.now() - timedelta(hours=24)

    appointments = Appointment.objects.filter(
        appointment_datetime__lt=cutoff,
        action='No',
        overdue_sent=False,
        customer_email__isnull=False,
    ).exclude(customer_email='')

    count = 0
    for appt in appointments:
        try:
            send_overdue_email(appt)
            send_whatsapp_overdue(appt)
            send_sms_overdue(appt)
            appt.overdue_sent = True
            appt.status = 'Overdue'
            appt.save(update_fields=['overdue_sent', 'status'])
            count += 1
            logger.info(f"[tasks] Overdue email sent for appointment {appt.id} ({appt.customer_name})")
        except Exception as e:
            logger.error(f"[tasks] Failed to send overdue email for appointment {appt.id}: {e}")

    logger.info(f"[tasks] send_overdue_emails: processed {count} appointments")
    return f"Sent {count} overdue emails"
