from django.contrib import admin
from .models import User, BusinessProfile, OTP, Notification

admin.site.register(User)
admin.site.register(BusinessProfile)
admin.site.register(OTP)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'business_name', 'customer_name', 'created_at')
    list_filter = ('notification_type', 'business_name')
    search_fields = ('business_name', 'customer_name', 'customer_phone', 'message')
