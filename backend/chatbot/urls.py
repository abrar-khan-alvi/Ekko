from django.urls import path
from .views import (
    ConversationListView, SyncConversationsView, 
    AppointmentListView, SyncAppointmentsView, 
    DashboardStatsView, AnalyticsStatsView
)

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/sync/', SyncConversationsView.as_view(), name='conversation-sync'),
    path('appointments/', AppointmentListView.as_view(), name='appointment-list'),
    path('appointments/sync/', SyncAppointmentsView.as_view(), name='appointment-sync'),
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('analytics/', AnalyticsStatsView.as_view(), name='dashboard-analytics'),
]
