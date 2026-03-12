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
from .email_utils import send_thank_you_email
from .whatsapp_utils import send_whatsapp_thank_you

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
                'status': a.status,
                'action': a.action,
                'is_manual': a.is_manual,
                'is_synced_to_sheets': a.is_synced_to_sheets,
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


class ManualAppointmentCreateView(APIView):
    """
    Creates a new manual appointment in the database and forwards it to n8n to sync to Google Sheets.
    Expects data matching: customerName, customerPhone, customerEmail, appointmentDateTime, service, businessId
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import uuid
        data = request.data

        # If user isn't assigned to a business profile, reject (unless superuser testing)
        biz_id = data.get('businessId') or data.get('business_id')
        biz_name = data.get('BusinessName') or data.get('businessName') or data.get('business_name')
        
        if not request.user.is_superuser:
            if hasattr(request.user, 'business_profile'):
                profile = request.user.business_profile
                biz_id = str(profile.id) if profile.id else ''
                biz_name = profile.business_name
                biz_hours = profile.business_hours
                biz_services = profile.services_offered
                biz_policies = profile.booking_policies
            else:
                return Response({"error": "No business profile attached."}, status=status.HTTP_403_FORBIDDEN)

        tool_call_id = f"manual_{uuid.uuid4().hex[:12]}"
        status_val = data.get('status', 'Pending')
        action_val = data.get('action', 'No')

        # Parse datetime
        dt_str = data.get('appointmentDateTime')
        parsed_dt = None
        if dt_str:
            try:
                parsed_dt = parse_datetime(dt_str.replace(' ', 'T')) if isinstance(dt_str, str) else dt_str
            except Exception:
                parsed_dt = None

        # Create localized appointment
        try:
            appt = Appointment.objects.create(
                tool_call_id=tool_call_id,
                is_manual=True,
                status=status_val,
                action=action_val,
                business_name=biz_name,
                business_id=biz_id,
                business_hours=biz_hours if not request.user.is_superuser else None,
                services_offered=biz_services if not request.user.is_superuser else None,
                booking_policies=biz_policies if not request.user.is_superuser else None,
                customer_name=data.get('customerName'),
                customer_phone=data.get('customerPhone'),
                customer_email=data.get('customerEmail'),
                appointment_datetime=parsed_dt,
                service=data.get('service')
            )
            # We no longer auto-forward here. User must explicitly sync manually via the UI.

            return Response({
                'message': 'Manual appointment queued for sync successfully',
                'appointment': {
                    'id': appt.id,
                    'toolCallId': appt.tool_call_id,
                    'customerName': appt.customer_name,
                    'status': appt.status
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CSVUploadAppointmentsView(APIView):
    """
    Accepts a bulk CSV upload of existing appointments, saving them to DB and passing to n8n.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        import uuid
        import pandas as pd
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Determine business context
        if request.user.is_superuser:
            biz_id = request.data.get('businessId', '')
            biz_name = request.data.get('BusinessName', 'Admin Upload')
        else:
            if not hasattr(request.user, 'business_profile'):
                return Response({"error": "No business profile attached."}, status=status.HTTP_403_FORBIDDEN)
            profile = request.user.business_profile
            biz_id = str(profile.id) if profile.id else ''
            biz_name = profile.business_name
            biz_hours = profile.business_hours
            biz_services = profile.services_offered
            biz_policies = profile.booking_policies

        try:
            # Detect CSV or Excel
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            elif file_obj.name.endswith('.xls') or file_obj.name.endswith('.xlsx'):
                df = pd.read_excel(file_obj)
            else:
                return Response({'error': 'Unsupported file format. Use .csv or .xlsx'}, status=400)
                
            # Replace NaNs with None
            df = df.where(pd.notnull(df), None)
            
            created_count = 0
            skipped_count = 0
            
            for index, row in df.iterrows():
                # Extract using loose matching on column names
                def get_val(possible_names, default=None):
                    for name in possible_names:
                        if name in row and row[name] is not None:
                            val = str(row[name]).strip()
                            if val.lower() != 'nan' and val.lower() != 'none':
                                return val
                    return default

                c_name = get_val(['customerName', 'Name', 'Customer Name', 'customer_name'])
                c_phone = get_val(['customerPhone', 'Phone', 'customer_phone', 'Phone Number', 'phone'])
                
                # Skip completely blank lines
                if not c_name and not c_phone:
                    continue  

                c_email = get_val(['customerEmail', 'Email', 'customer_email', 'email'])
                c_service = get_val(['service', 'Service', 'Appointment Type'])
                a_time = get_val(['appointmentDateTime', 'appointment_datetime', 'Date', 'DateTime', 'Time'])
                
                parsed_dt = None
                if a_time:
                    try:
                        # Attempt to parse as strict datetime first
                        parsed_dt = pd.to_datetime(a_time).to_pydatetime()
                        # Make timezone aware if settings demand it
                        if timezone.is_naive(parsed_dt):
                            parsed_dt = timezone.make_aware(parsed_dt)
                    except Exception:
                        # If parsing fails (e.g. they typed '12ta'), we just leave parsed_dt as None but the raw string is lost from db unless we use a CharField. 
                        # However, Ekko seems to pass the original string directly to n8n if we just don't crash.
                        pass
                
                # Duplicate Check: Prevent double-booking same number around same time for same business
                # If parsed_dt failed, we only check by phone
                if parsed_dt:
                    is_duplicate = Appointment.objects.filter(
                        business_id=biz_id,
                        customer_phone=c_phone,
                        appointment_datetime=parsed_dt
                    ).exists()
                else:
                    # If date is invalid/'12ta', just check if they recently manually uploaded this person
                    is_duplicate = Appointment.objects.filter(
                        business_id=biz_id,
                        customer_phone=c_phone,
                        is_manual=True
                    ).exists()

                if is_duplicate:
                    skipped_count += 1
                    continue

                tool_call_id = f"manual_upload_{uuid.uuid4().hex[:12]}"
                status_val = get_val(['status', 'Status'], 'Pending')
                action_val = get_val(['action', 'Action'], 'No')
                
                appt = Appointment(
                    tool_call_id=tool_call_id,
                    is_manual=True,
                    status=status_val,
                    action=action_val,
                    business_name=biz_name,
                    business_id=biz_id,
                    business_hours=biz_hours if not request.user.is_superuser else None,
                    services_offered=biz_services if not request.user.is_superuser else None,
                    booking_policies=biz_policies if not request.user.is_superuser else None,
                    customer_name=c_name,
                    customer_phone=c_phone,
                    customer_email=c_email,
                    appointment_datetime=parsed_dt,
                    service=c_service
                )
                appt.save()
                created_count += 1

            # We no longer auto-forward here. User must explicitly sync via the UI.

            return Response({
                "message": f"Successfully imported {created_count} appointments.",
                "imported_count": created_count,
                "skipped_count": skipped_count
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f"Error parsing file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)



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
            
            # Booking trend (today + next 6 days)
            today = timezone.now().date()
            booking_trend = []
            for i in range(0, 7):
                day = today + timedelta(days=i)
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

            # Booking trend (today + next 6 days)
            today = timezone.now().date()
            booking_trend = []
            for i in range(0, 7):
                day = today + timedelta(days=i)
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

class SyncManualToSheetsView(APIView):
    """
    Finds all unsynced manual appointments for the logged-in business and pushes them one by one
    to the specific n8n webhook. Marks them as synced if successful.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.db.models import Q
        
        if not request.user.is_superuser:
            if not hasattr(request.user, 'business_profile'):
                return Response({'error': 'No business profile attached.'}, status=status.HTTP_403_FORBIDDEN)
            profile = request.user.business_profile
            biz_id = str(profile.id) if profile.id else ''
            biz_name = profile.business_name
            biz_hours = profile.business_hours
            biz_services = profile.services_offered
            biz_policies = profile.booking_policies
        else:
            # Superuser could specify which business to sync, or we default to testing.
            biz_id = request.data.get('businessId') or request.data.get('business_id', '')
            biz_name = request.data.get('BusinessName') or request.data.get('business_name', 'Admin Test')
            biz_hours = biz_services = biz_policies = None

        # Webhook URL provided by user
        n8n_webhook = getattr(
            settings, 
            'N8N_EXPLICIT_SYNC_WEBHOOK_URL', 
            'https://ekkoflow.app.n8n.cloud/webhook/insertesisitngdata'
        )
        
        # Only query unsynced manual appointments for this business
        query = Q(is_manual=True, is_synced_to_sheets=False)
        if biz_id:
            query &= Q(business_id=biz_id)
        
        unsynced_appts = Appointment.objects.filter(query)
        
        if unsynced_appts.exists():
            import time
            create_sheet_webhook = getattr(
                settings,
                'N8N_CREATE_SHEET_WEBHOOK_URL',
                'https://ekkoflow.app.n8n.cloud/webhook/9aa020f9-e8a3-4d15-af18-3f52a305a5c6'
            )
            try:
                # Trigger the webhook to ensure the sheet exists
                requests.post(create_sheet_webhook, json={
                    "businessName": biz_name,
                    "businessId": biz_id
                }, timeout=10)
            except Exception as e:
                print(f"Failed to trigger sheet creation webhook: {e}")
        
        success_count = 0
        failure_count = 0

        for appt in unsynced_appts:
            # Backfill static business info if it's missing (for older manual uploads)
            save_needed = False
            if not appt.business_hours and biz_hours:
                appt.business_hours = biz_hours
                appt.services_offered = biz_services
                appt.booking_policies = biz_policies
                save_needed = True
            
            if save_needed:
                try:
                    appt.save(update_fields=['business_hours', 'services_offered', 'booking_policies'])
                except Exception:
                    pass

            payload = {
                "businessName": appt.business_name or biz_name,
                "customerName": appt.customer_name or "",
                "customerPhone": appt.customer_phone or "",
                "customerEmail": appt.customer_email or "",
                "appointmentDateTime": appt.appointment_datetime.isoformat() if appt.appointment_datetime else "",
                "service": appt.service or "",
                "businessId": appt.business_id or biz_id,
                "toolCallId": appt.tool_call_id,
                "status": appt.status or "Pending",
                "action": appt.action or "No"
            }
            try:
                # Send the exact format expected by the PowerShell script
                response = requests.post(n8n_webhook, json=payload, timeout=10)
                if response.status_code == 200:
                    appt.is_synced_to_sheets = True
                    appt.save()
                    success_count += 1
                else:
                    failure_count += 1
            except Exception as e:
                print(f"Failed to sync appointment {appt.id} to n8n: {e}")
                failure_count += 1

        return Response({
            'message': 'Sync process complete.',
            'success_count': success_count,
            'failure_count': failure_count,
            'total_attempted': len(unsynced_appts)
        }, status=status.HTTP_200_OK)


class UpdateAppointmentActionView(APIView):
    """
    PATCH /api/appointments/<pk>/action/
    Payload: { "action": "Yes" | "No" }

    Updates the appointment action field.
    If action is changed to "Yes" (customer visited) and a customer email exists,
    immediately fires the Thank You email from the business.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only the owner business (or superuser) may update this appointment
        if not request.user.is_superuser:
            if hasattr(request.user, 'business_profile'):
                profile = request.user.business_profile
                biz_id = str(profile.id)
                if appt.business_id != biz_id and appt.business_name != profile.business_name:
                    return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
            else:
                return Response({'error': 'No business profile attached.'}, status=status.HTTP_403_FORBIDDEN)

        new_action = request.data.get('action')
        if new_action not in ('Yes', 'No'):
            return Response(
                {'error': 'Invalid action value. Must be "Yes" or "No".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_action = appt.action
        appt.action = new_action
        appt.save(update_fields=['action'])

        # Fire Thank You email + WhatsApp when transitioning to "Yes"
        if new_action == 'Yes' and old_action != 'Yes':
            if appt.customer_email:
                send_thank_you_email(appt)
            send_whatsapp_thank_you(appt)  # uses whatsapp_number or customer_phone

        return Response({
            'id': appt.id,
            'action': appt.action,
            'message': 'Action updated successfully.'
        }, status=status.HTTP_200_OK)
