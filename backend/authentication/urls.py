from django.urls import path, re_path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    SignupView, UserProfileView, VerifyEmailView, 
    ForgotPasswordView, ResetPasswordView, MyTokenObtainPairView, ChangePasswordView,
    UserListView, UserDetailView, n8nWebhookReceiverView, 
    NotificationListView, NotificationReadView, NotificationMarkAllReadView, NotificationUnreadCountView,
    VapiProxyView
)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    
    # Notifications and Webhooks
    path('webhooks/n8n/reminder/', n8nWebhookReceiverView.as_view(), name='n8n-webhook-reminder'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notification-read'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    
    # Vapi Proxy
    path('vapi/assistants/', VapiProxyView.as_view(), name='vapi-assistants'),
    re_path(r'vapi/assistants/(?P<assistant_id>[^/]+)/$', VapiProxyView.as_view(), name='vapi-assistant-detail'),
]
