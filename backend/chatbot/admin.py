from django.contrib import admin
from .models import ConversationLog, Appointment, Review

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

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('name', 'business_name', 'rating', 'email', 'phone', 'created_at_external')
    list_filter = ('business_name', 'rating', 'created_at_external')
    search_fields = ('name', 'email', 'phone', 'business_name', 'feedback')
    readonly_fields = ('created_at',)
    ordering = ('-created_at_external',)
