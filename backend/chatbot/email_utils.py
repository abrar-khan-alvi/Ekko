"""
Appointment email utilities.
All emails are sent FROM the business (display name = business name).
No Ekko Loop branding or logo.
"""
import logging
import threading
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)


def _send_appointment_email(to_email, subject, html_body, text_body, from_name):
    """
    Send a business-branded email in a background thread.
    The From header appears as: BusinessName <systems@ekkoltd.co.uk>
    """
    def _send():
        try:
            from_email = f"{from_name} <{settings.DEFAULT_FROM_EMAIL}>"
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=from_email,
                to=[to_email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"[email] '{subject}' sent to {to_email} (from: {from_email})")
        except Exception as e:
            logger.error(f"[email] Failed to send '{subject}' to {to_email}: {e}")

    threading.Thread(target=_send).start()


# ─── 1. Thank You Email ────────────────────────────────────────────────────────

def send_thank_you_email(appointment):
    """Sent immediately when customer is marked as 'Visited'."""
    if not appointment.customer_email:
        return

    biz_name = appointment.business_name or "Us"
    customer_name = appointment.customer_name or "there"
    service = appointment.service or "your appointment"

    subject = f"Thanks for visiting {biz_name}!"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
        .header {{ background-color: #1a1a2e; padding: 32px; text-align: center; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; }}
        .body {{ padding: 32px; color: #333333; line-height: 1.6; }}
        .body p {{ margin: 0 0 16px; }}
        .highlight {{ color: #7c3aed; font-weight: bold; }}
        .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Visiting! </h1>
        </div>
        <div class="body">
          <p>Hi <span class="highlight">{customer_name}</span>,</p>
          <p>Thank you so much for visiting <strong>{biz_name}</strong> today for <strong>{service}</strong>.</p>
          <p>We hope you had a great experience and we look forward to seeing you again soon!</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://ekkoflow.app.n8n.cloud/form/431b8d3f-3821-4c63-bc25-8c7fd3dcef95" 
               style="background-color: #7c3aed; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);">
               Leave a Review ⭐
            </a>
          </div>
          <p>If you have any feedback or questions, feel free to reach out to us anytime.</p>
          <p>Warm regards,<br><strong>{biz_name}</strong></p>
        </div>
        <div class="footer">
          This email was sent by {biz_name}. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
    """

    text_body = (
        f"Hi {customer_name},\n\n"
        f"Thank you for visiting {biz_name} for {service}. "
        f"We hope you had a great experience!\n\n"
        f"Please leave us a review here: https://ekkoflow.app.n8n.cloud/form/431b8d3f-3821-4c63-bc25-8c7fd3dcef95\n\n"
        f"Warm regards,\n{biz_name}"
    )

    _send_appointment_email(
        to_email=appointment.customer_email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        from_name=biz_name,
    )


# ─── 2. 48hr Reminder Email ────────────────────────────────────────────────────

def send_48hr_reminder_email(appointment):
    """Sent ~48 hours before the appointment."""
    if not appointment.customer_email:
        return

    biz_name = appointment.business_name or "Us"
    customer_name = appointment.customer_name or "there"
    service = appointment.service or "your appointment"

    # Format datetime nicely
    dt = appointment.appointment_datetime
    dt_str = dt.strftime("%A, %B %d at %I:%M %p") if dt else "your scheduled time"

    subject = f"Reminder: Your appointment at {biz_name} is coming up!"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
        .header {{ background-color: #0f3460; padding: 32px; text-align: center; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; }}
        .body {{ padding: 32px; color: #333333; line-height: 1.6; }}
        .body p {{ margin: 0 0 16px; }}
        .appt-box {{ background: #f0f4ff; border-left: 4px solid #0f3460; border-radius: 4px; padding: 16px; margin: 20px 0; }}
        .appt-box p {{ margin: 4px 0; }}
        .highlight {{ color: #0f3460; font-weight: bold; }}
        .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Reminder</h1>
        </div>
        <div class="body">
          <p>Hi <span class="highlight">{customer_name}</span>,</p>
          <p>This is a friendly reminder that you have an upcoming appointment with <strong>{biz_name}</strong>.</p>
          <div class="appt-box">
            <p> <strong>Date & Time:</strong> {dt_str}</p>
            <p><strong>Service:</strong> {service}</p>
            <p><strong>Business:</strong> {biz_name}</p>
          </div>
          <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
          <p>We look forward to seeing you!</p>
          <p>Best regards,<br><strong>{biz_name}</strong></p>
        </div>
        <div class="footer">
          This email was sent by {biz_name}. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
    """

    text_body = (
        f"Hi {customer_name},\n\n"
        f"Reminder: You have an appointment at {biz_name} on {dt_str} for {service}.\n\n"
        f"If you need to reschedule, please contact us.\n\n"
        f"Best regards,\n{biz_name}"
    )

    _send_appointment_email(
        to_email=appointment.customer_email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        from_name=biz_name,
    )


# ─── 3. Overdue Email ──────────────────────────────────────────────────────────

def send_overdue_email(appointment):
    """Sent when appointment has passed and customer did not show up (action = No)."""
    if not appointment.customer_email:
        return

    biz_name = appointment.business_name or "Us"
    customer_name = appointment.customer_name or "there"
    service = appointment.service or "your appointment"

    dt = appointment.appointment_datetime
    dt_str = dt.strftime("%A, %B %d") if dt else "your scheduled date"

    subject = f"We missed you at {biz_name}!"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
        .header {{ background-color: #7c2d12; padding: 32px; text-align: center; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; }}
        .body {{ padding: 32px; color: #333333; line-height: 1.6; }}
        .body p {{ margin: 0 0 16px; }}
        .highlight {{ color: #7c2d12; font-weight: bold; }}
        .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>We Missed You!</h1>
        </div>
        <div class="body">
          <p>Hi <span class="highlight">{customer_name}</span>,</p>
          <p>We noticed you weren't able to make it to your appointment at <strong>{biz_name}</strong> on <strong>{dt_str}</strong> for <strong>{service}</strong>.</p>
          <p>We completely understand that things come up! We'd love to reschedule and see you soon.</p>
          <p>Feel free to get in touch with us to book your next appointment at a time that works for you.</p>
          <p>We hope to see you soon!</p>
          <p>Warm regards,<br><strong>{biz_name}</strong></p>
        </div>
        <div class="footer">
          This email was sent by {biz_name}. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
    """

    text_body = (
        f"Hi {customer_name},\n\n"
        f"We missed you at {biz_name} on {dt_str} for {service}. "
        f"We'd love to reschedule — feel free to reach out!\n\n"
        f"Warm regards,\n{biz_name}"
    )

    _send_appointment_email(
        to_email=appointment.customer_email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        from_name=biz_name,
    )
