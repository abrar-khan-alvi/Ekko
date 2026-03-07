from django.contrib import admin
from .models import User, BusinessProfile, OTP

admin.site.register(User)
admin.site.register(BusinessProfile)
admin.site.register(OTP)
