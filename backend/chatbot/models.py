from django.db import models

class ConversationLog(models.Model):
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    contact_number = models.CharField(max_length=50, null=True, blank=True)
    business_name = models.CharField(max_length=255, null=True, blank=True)
    business_id = models.CharField(max_length=100, null=True, blank=True)
    
    timestamp = models.BigIntegerField()
    received_message = models.TextField(null=True, blank=True)
    sent_message = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # contact_number + timestamp uniquely identifies each interaction from the webhook
        unique_together = ('contact_number', 'timestamp')
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.contact_name or self.contact_number} - {self.business_name} ({self.timestamp})"


class Appointment(models.Model):
    row_number = models.IntegerField(null=True, blank=True)
    tool_call_id = models.CharField(max_length=200, unique=True)  # unique identifier
    
    business_name = models.CharField(max_length=255, null=True, blank=True)
    business_id = models.CharField(max_length=100, null=True, blank=True)
    business_hours = models.CharField(max_length=255, null=True, blank=True)
    services_offered = models.CharField(max_length=500, null=True, blank=True)
    booking_policies = models.CharField(max_length=500, null=True, blank=True)
    
    customer_name = models.CharField(max_length=255, null=True, blank=True)
    customer_phone = models.CharField(max_length=50, null=True, blank=True)
    whatsapp_number = models.CharField(max_length=50, null=True, blank=True)
    customer_email = models.EmailField(null=True, blank=True)
    
    appointment_datetime = models.DateTimeField(null=True, blank=True)
    service = models.CharField(max_length=255, null=True, blank=True)
    
    # --- New Fields for Manual Sync & Tracking ---
    status = models.CharField(max_length=50, default='Pending', null=True, blank=True)
    action = models.CharField(max_length=50, default='No', null=True, blank=True)
    is_manual = models.BooleanField(default=False)

    # --- Email Tracking (prevents duplicate sends) ---
    reminder_sent = models.BooleanField(default=False)  # 48hr reminder email sent
    overdue_sent = models.BooleanField(default=False)   # Overdue email sent
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-appointment_datetime']

    def __str__(self):
        return f"{self.customer_name} @ {self.business_name} — {self.appointment_datetime}"

class Review(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    rating = models.CharField(max_length=50, null=True, blank=True) # stores emoji stars
    feedback = models.TextField(null=True, blank=True)
    business_name = models.CharField(max_length=255, null=True, blank=True)
    
    # Tracking
    external_id = models.IntegerField(unique=True, null=True, blank=True) # from n8n id field
    created_at_external = models.DateTimeField(null=True, blank=True) # from n8n createdAt
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at_external']

    def __str__(self):
        return f"Review by {self.name} for {self.business_name} — {self.rating}"
