from django.urls import path
from .views import (
    ConversationListView, SyncConversationsView, 
    AppointmentListView, SyncAppointmentsView,
    ManualAppointmentCreateView, CSVUploadAppointmentsView,
    DashboardStatsView, AnalyticsStatsView, SyncManualToSheetsView,
    UpdateAppointmentActionView,
)

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/sync/', SyncConversationsView.as_view(), name='conversation-sync'),
    path('appointments/', AppointmentListView.as_view(), name='appointment-list'),
    path('appointments/sync/', SyncAppointmentsView.as_view(), name='appointment-sync'),
    path('appointments/manual/', ManualAppointmentCreateView.as_view(), name='appointment-manual-create'),
    path('appointments/upload/', CSVUploadAppointmentsView.as_view(), name='appointment-upload'),
    path('appointments/sync-to-sheets/', SyncManualToSheetsView.as_view(), name='appointment-sync-sheets'),
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('analytics/', AnalyticsStatsView.as_view(), name='dashboard-analytics'),
    path('appointments/<int:pk>/action/', UpdateAppointmentActionView.as_view(), name='appointment-action-update'),
]
