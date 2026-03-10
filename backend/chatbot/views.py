from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import requests
from django.conf import settings
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from django.utils.dateparse import parse_datetime
from .models import ConversationLog, Appointment

class ConversationListView(APIView):
    """
    Returns the user's conversation logs natively from the PostgreSQL database cache.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_superuser:
            logs = ConversationLog.objects.all()
            business_filter = request.query_params.get('business', None)
            if business_filter:
                logs = logs.filter(Q(business_name=business_filter) | Q(business_id=business_filter))
        else:
            if not hasattr(request.user, 'business_profile'):
                return Response([])
            
            profile = request.user.business_profile
            stringified_id = str(profile.id) if profile.id else ""
            logs = ConversationLog.objects.filter(
                Q(business_id=stringified_id) | Q(business_name=profile.business_name)
            )

        # Serialize
        data = []
        for log in logs:
            data.append({
                "Contact_name": log.contact_name,
                "Contact_number": log.contact_number,
                "timestamp": log.timestamp,
                "Business_Name": log.business_name,
                "Business_ID": log.business_id,
                "Recieved_Message": log.received_message,
                "Sent_message": log.sent_message
            })
            
        return Response(data)

class SyncConversationsView(APIView):
    """
    Pulls data from the live n8n webhook and rigidly checks against duplicates before writing to the database.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        webhook_url = getattr(
            settings, 
            'N8N_CONVERSATION_WEBHOOK_URL', 
            'https://ekkoflow.app.n8n.cloud/webhook/12a447b8-54c0-472c-9ec8-0b7455695e85'
        )

        try:
            response = requests.get(webhook_url, timeout=15)
            
            if response.status_code != 200:
                return Response(
                    {"error": "Failed to fetch conversations from external service."}, 
                    status=status.HTTP_502_BAD_GATEWAY
                )

            data = response.json()
            messages = data.get('messages', []) if isinstance(data, dict) else data

            if not isinstance(messages, list):
                messages = []

            created_count = 0
            for m in messages:
                ts = int(m.get('timestamp') or 0)
                contact_number = m.get('Contact_number') or ''
                
                # Only use contact_number + timestamp as the lookup key
                # Everything else goes in defaults so it can be updated
                _, created = ConversationLog.objects.get_or_create(
                    contact_number=contact_number,
                    timestamp=ts,
                    defaults={
                        'contact_name': m.get('Contact_name'),
                        'business_name': m.get('Business_Name'),
                        'business_id': m.get('Business_ID'),
                        'received_message': m.get('Recieved_Message'),  # capital M
                        'sent_message': m.get('Sent_message'),           # lowercase m
                    }
                )
                if created:
                    created_count += 1

            return Response({"status": "success", "new_messages_synced": created_count})

        except requests.RequestException as e:
            return Response(
                {"error": f"Error connecting to webhook service: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {"error": f"An unexpected error occurred: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ─── APPOINTMENTS ──────────────────────────────────────────────────────────

APPOINTMENT_WEBHOOK_URL = 'https://ekkoflow.app.n8n.cloud/webhook/193cc923-2bd8-40b9-89b0-5c4090e94d35'


class AppointmentListView(APIView):
    """
    Returns appointments from the local DB, filtered by user role.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_superuser:
            appts = Appointment.objects.all()
        else:
            if not hasattr(request.user, 'business_profile'):
                return Response([])
            profile = request.user.business_profile
            biz_id = str(profile.id) if profile.id else ''
            appts = Appointment.objects.filter(
                Q(business_id=biz_id) | Q(business_name=profile.business_name)
            )

        data = []
        for a in appts:
            data.append({
                'id': a.id,
                'row_number': a.row_number,
                'tool_call_id': a.tool_call_id,
                'BusinessName': a.business_name,
                'businessId': a.business_id,
                'Business_hours': a.business_hours,
                'Services_offered': a.services_offered,
                'Booking_policies': a.booking_policies,
                'customerName': a.customer_name,
                'customerPhone': a.customer_phone,
                'Whatsapp_Number': a.whatsapp_number,
                'customerEmail': a.customer_email,
                'appointmentDateTime': a.appointment_datetime.isoformat() if a.appointment_datetime else None,
                'service': a.service,
            })
        return Response(data)


class SyncAppointmentsView(APIView):
    """
    Pulls latest appointments from n8n webhook and stores new ones in the DB.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        webhook_url = getattr(
            settings,
            'N8N_APPOINTMENTS_WEBHOOK_URL',
            APPOINTMENT_WEBHOOK_URL
        )
        try:
            response = requests.get(webhook_url, timeout=15)
            if response.status_code != 200:
                return Response({'error': 'Failed to fetch appointments.'}, status=status.HTTP_502_BAD_GATEWAY)

            raw = response.json()
            rows = raw if isinstance(raw, list) else raw.get('appointments', [])

            created_count = 0
            for row in rows:
                tool_call_id = row.get('toolCallId') or ''
                if not tool_call_id:
                    continue

                dt_str = row.get('appointmentDateTime')
                parsed_dt = None
                if dt_str:
                    try:
                        parsed_dt = parse_datetime(dt_str.replace(' ', 'T'))
                    except Exception:
                        parsed_dt = None

                _, created = Appointment.objects.update_or_create(
                    tool_call_id=tool_call_id,
                    defaults={
                        'row_number': row.get('row_number'),
                        'business_name': row.get('BusinessName'),
                        'business_id': str(row.get('businessId') or ''),
                        'business_hours': row.get('Business hours'),
                        'services_offered': row.get('Services offered'),
                        'booking_policies': row.get('Booking policies'),
                        'customer_name': row.get('customerName'),
                        'customer_phone': str(row.get('customerPhone') or ''),
                        'whatsapp_number': str(row.get('Whatsapp_Number') or ''),
                        'customer_email': row.get('customerEmail') or '',
                        'service': row.get('service'),
                        'appointment_datetime': parsed_dt,
                    }
                )
                if created:
                    created_count += 1

            return Response({'status': 'success', 'new_appointments_synced': created_count})

        except requests.RequestException as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardStatsView(APIView):
    """
    Returns aggregated statistics for the dashboard overview.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_superuser:
            # Global stats for superuser
            total_appts = Appointment.objects.count()
            total_convs = ConversationLog.objects.count()
            total_customers = ConversationLog.objects.values('contact_number').distinct().count()
            
            # Booking trend (last 7 days)
            today = timezone.now().date()
            booking_trend = []
            for i in range(6, -1, -1):
                day = today - timedelta(days=i)
                count = Appointment.objects.filter(appointment_datetime__date=day).count()
                booking_trend.append({
                    'name': day.strftime('%a'),
                    'bookings': count
                })
        else:
            if not hasattr(request.user, 'business_profile'):
                return Response({
                    'total_appointments': 0,
                    'total_conversations': 0,
                    'total_customers': 0,
                    'booking_trend': []
                })
            
            profile = request.user.business_profile
            biz_name = profile.business_name
            biz_id = str(profile.id)

            appt_filter = Q(business_id=biz_id) | Q(business_name=biz_name)
            conv_filter = Q(business_id=biz_id) | Q(business_name=biz_name)

            total_appts = Appointment.objects.filter(appt_filter).count()
            total_convs = ConversationLog.objects.filter(conv_filter).count()
            total_customers = ConversationLog.objects.filter(conv_filter).values('contact_number').distinct().count()

            # Booking trend (last 7 days)
            today = timezone.now().date()
            booking_trend = []
            for i in range(6, -1, -1):
                day = today - timedelta(days=i)
                count = Appointment.objects.filter(appt_filter, appointment_datetime__date=day).count()
                booking_trend.append({
                    'name': day.strftime('%a'),
                    'bookings': count
                })

        return Response({
            'total_appointments': total_appts,
            'total_conversations': total_convs,
            'total_customers': total_customers,
            'booking_trend': booking_trend
        })


class AnalyticsStatsView(APIView):
    """
    Returns detailed analytics statistics with yearly filtering.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = request.query_params.get('year')
        try:
            year = int(year) if year else timezone.now().year
        except ValueError:
            year = timezone.now().year

        if request.user.is_superuser:
            appt_qs = Appointment.objects.all()
            conv_qs = ConversationLog.objects.all()
        else:
            if not hasattr(request.user, 'business_profile'):
                return Response({
                    'monthly_growth': [],
                    'conversion_rate': 0,
                    'growth_percentage': 0,
                    'total_appointments': 0
                })
            
            profile = request.user.business_profile
            biz_name = profile.business_name
            biz_id = str(profile.id)
            
            filter_q = Q(business_id=biz_id) | Q(business_name=biz_name)
            appt_qs = Appointment.objects.filter(filter_q)
            conv_qs = ConversationLog.objects.filter(filter_q)

        # Monthly growth data for the selected year
        monthly_growth = []
        months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
        
        for i, month_name in enumerate(months, 1):
            count = appt_qs.filter(
                appointment_datetime__year=year,
                appointment_datetime__month=i
            ).count()
            monthly_growth.append({
                'name': month_name,
                'value': count
            })

        # Conversion Rate: (Appointments / Conversations) * 100
        total_appts = appt_qs.filter(appointment_datetime__year=year).count()
        total_convs = conv_qs.filter(created_at__year=year).count()
        
        conversion_rate = 0
        if total_convs > 0:
            conversion_rate = round((total_appts / total_convs) * 100, 1)

        # Growth Percentage (Compared to previous month)
        now = timezone.now()
        current_month = now.month
        current_year = now.year
        
        last_month = current_month - 1 or 12
        last_month_year = current_year if current_month > 1 else current_year - 1
        
        curr_month_count = appt_qs.filter(
            appointment_datetime__year=current_year,
            appointment_datetime__month=current_month
        ).count()
        
        prev_month_count = appt_qs.filter(
            appointment_datetime__year=last_month_year,
            appointment_datetime__month=last_month
        ).count()
        
        growth_percentage = 0
        if prev_month_count > 0:
            growth_percentage = round(((curr_month_count - prev_month_count) / prev_month_count) * 100, 1)
        elif curr_month_count > 0:
            growth_percentage = 100.0

        return Response({
            'monthly_growth': monthly_growth,
            'conversion_rate': conversion_rate,
            'growth_percentage': growth_percentage,
            'total_appointments': total_appts,
            'selected_year': year
        })
