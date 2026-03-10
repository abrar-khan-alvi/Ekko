from django.contrib import admin
from .models import ConversationLog, Appointment

@admin.register(ConversationLog)
class ConversationLogAdmin(admin.ModelAdmin):
    list_display = ('contact_name', 'contact_number', 'business_name', 'timestamp', 'received_message', 'sent_message', 'created_at')
    list_filter = ('business_name',)
    search_fields = ('contact_name', 'contact_number', 'business_name')
    readonly_fields = ('created_at',)
    ordering = ('-timestamp',)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('customer_name', 'customer_phone', 'appointment_datetime', 'service', 'business_name', 'created_at')
    list_filter = ('business_name', 'service', 'appointment_datetime')
    search_fields = ('customer_name', 'customer_phone', 'customer_email', 'business_name')
    readonly_fields = ('created_at',)
    ordering = ('-appointment_datetime',)
