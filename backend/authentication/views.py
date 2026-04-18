from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    UserSignupSerializer, UserSerializer, VerifyOTPSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, MyTokenObtainPairSerializer,
    ChangePasswordSerializer, NotificationSerializer
)
from .models import User, OTP, Notification
from .utils import generate_otp, send_otp_email
import requests
import logging
from django.db import models
from rest_framework.pagination import PageNumberPagination

logger = logging.getLogger(__name__)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            from .utils import generate_cache_otp, send_otp_email
            code = generate_cache_otp(email, request.data)
            send_otp_email(email, code, 'signup')
            return Response(
                {"message": "OTP sent to your email. Please verify to complete registration."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            purpose = serializer.validated_data['purpose']
            
            if purpose == 'signup':
                from .utils import verify_cache_otp
                signup_data = verify_cache_otp(email, code)
                if signup_data:
                    serializer = UserSignupSerializer(data=signup_data)
                    if serializer.is_valid():
                        user = serializer.save()
                        user.is_verified = True
                        user.is_active = True
                        user.save()
                        return Response({"message": "Registration and verification successful"}, status=status.HTTP_201_CREATED)
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                otp = OTP.objects.get(user__email=email, code=code, purpose=purpose)
                if otp.is_valid():
                    if purpose != 'reset':
                        otp.delete()
                    return Response({"message": "Verification successful"}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)
            except OTP.DoesNotExist:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                otp = generate_otp(user, 'reset')
                send_otp_email(user.email, otp.code, 'reset')
                return Response({"message": "OTP sent to your email"}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"message": "If this email is registered, you will receive an OTP"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            new_password = serializer.validated_data['new_password']
            
            try:
                otp = OTP.objects.get(user__email=email, code=code, purpose='reset')
                if otp.is_valid():
                    user = otp.user
                    user.set_password(new_password)
                    user.save()
                    otp.delete()
                    return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)
            except OTP.DoesNotExist:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            from .serializers import AdminUserUpdateSerializer
            return AdminUserUpdateSerializer
        return UserSerializer

class n8nWebhookReceiverView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.data
        if not isinstance(payload, list):
            payload = [payload]
            
        created_count = 0
        for item in payload:
            business_name = item.get('businessName')
            customer_name = item.get('customerName')
            customer_phone = str(item.get('customerPhone', ''))
            appointment_time = item.get('AppointmentTIme')
            
            user = None
            if business_name:
                try:
                    from .models import BusinessProfile
                    profile = BusinessProfile.objects.filter(business_name=business_name).first()
                    if profile:
                        user = profile.user
                except Exception as e:
                    logger.error(f"Error finding user for business '{business_name}': {e}")

            Notification.objects.create(
                user=user,
                title="Reminder Sent",
                message=f"Reminder sent to {customer_name} for their appointment at {business_name} on {appointment_time}.",
                notification_type="reminder",
                business_name=business_name,
                customer_name=customer_name,
                customer_phone=customer_phone,
                appointment_time=appointment_time
            )
            created_count += 1
            
        return Response({"message": f"Successfully processed {created_count} notifications"}, status=status.HTTP_201_CREATED)

class NotificationPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Notification.objects.all().order_by('-created_at')
        try:
            from .models import BusinessProfile
            profile = BusinessProfile.objects.filter(user=user).first()
            if profile and profile.business_name:
                return Notification.objects.filter(
                    models.Q(user=user) | models.Q(business_name=profile.business_name)
                ).order_by('-created_at')
        except Exception:
            pass
        return Notification.objects.filter(user=user).order_by('-created_at')

class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
            if not (request.user.is_staff or request.user.is_superuser):
                if notification.user and notification.user != request.user:
                    from .models import BusinessProfile
                    profile = BusinessProfile.objects.filter(user=request.user).first()
                    if not (profile and profile.business_name == notification.business_name):
                        return Response(status=status.HTTP_403_FORBIDDEN)
            notification.read_by.add(request.user)
            return Response({"status": "read"}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_staff or user.is_superuser:
            notifications = Notification.objects.all()
        else:
            from .models import BusinessProfile
            profile = BusinessProfile.objects.filter(user=user).first()
            if profile and profile.business_name:
                notifications = Notification.objects.filter(
                    models.Q(user=user) | models.Q(business_name=profile.business_name)
                )
            else:
                notifications = Notification.objects.filter(user=user)
        unread_notifications = notifications.exclude(read_by=user)
        count = unread_notifications.count()
        for notif in unread_notifications:
            notif.read_by.add(user)
        return Response({"status": "all_read", "marked_count": count}, status=status.HTTP_200_OK)

class NotificationUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_staff or user.is_superuser:
            notifications = Notification.objects.all()
        else:
            from .models import BusinessProfile
            profile = BusinessProfile.objects.filter(user=user).first()
            if profile and profile.business_name:
                notifications = Notification.objects.filter(
                    models.Q(user=user) | models.Q(business_name=profile.business_name)
                )
            else:
                notifications = Notification.objects.filter(user=user)
        unread_count = notifications.exclude(read_by=user).count()
        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)

class VapiProxyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_all_tool_ids(self, api_key):
        """
        Fetches the IDs of all pre-created Vapi tools for this account.
        Since both 'google_sheets_tool' (google.sheets.row.append) and
        'Save_the_appoinment' (function) are already created in the Vapi dashboard,
        we just list them and return their IDs to attach via model.toolIds.
        """
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        tool_ids = []
        try:
            list_resp = requests.get("https://api.vapi.ai/tool", headers=headers, timeout=10)
            if list_resp.status_code == 200:
                tools = list_resp.json()
                tool_list = tools if isinstance(tools, list) else tools.get('results', [])
                for tool in tool_list:
                    tid = tool.get('id')
                    ttype = tool.get('type', '')
                    tname = tool.get('name', '')
                    # Only attach the Google Sheets tool
                    if ttype == 'google.sheets.row.append' and tid:
                        tool_ids.append(tid)
                        logger.info(f"Attaching Vapi tool '{tname}' ({ttype}) id={tid}")
            else:
                logger.error(f"Failed to list Vapi tools: {list_resp.status_code} {list_resp.text}")
        except Exception as e:
            logger.error(f"Exception listing Vapi tools: {e}")
        return tool_ids

    def get(self, request, assistant_id=None):
        from django.conf import settings
        api_key = getattr(settings, 'VAPI_API_KEY', '')
        if not api_key:
            return Response({"error": "Vapi API Key not configured"}, status=500)
        headers = {"Authorization": f"Bearer {api_key}"}
        url = "https://api.vapi.ai/assistant"
        if assistant_id:
            url = f"{url}/{assistant_id}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            return Response(response.json(), status=response.status_code)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        from django.conf import settings
        from .models import BusinessProfile
        
        api_key = getattr(settings, 'VAPI_API_KEY', '')
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        url = "https://api.vapi.ai/assistant"
        payload = request.data.get('assistant_data', {})
        
        # Fetch real business profile from DB for robust prompting
        profile = BusinessProfile.objects.filter(user=request.user).first()
        business_name = profile.business_name if profile and profile.business_name else "Ekko Assistant"
        
        # Override name
        payload['name'] = f"Ekko - {business_name}"
        
        # Construct Advanced Structured System Prompt
        role = payload.get('model', {}).get('systemPrompt', 'Appointment Booking Assistant')
        hours = profile.business_hours if profile and profile.business_hours else '9 to 5'
        services = profile.services_offered if profile and profile.services_offered else 'Hair color'
        policies = profile.booking_policies if profile and profile.booking_policies else 'No refund'
        
        system_prompt = f"""[Identity]
You are an efficient and precise {role} for {business_name}. Your primary role is to collect required booking and contact details from the user, one field at a time, and produce a single, properly formatted CSV line with specific columns. Do not mention or refer to any underlying system, spreadsheet, technology, or data storage actions, and never explain, confirm, or discuss back-end processes with the user.

[Style]
- Maintain a strictly professional, concise, and neutral tone at all times.
- Ask only one clear and direct question per interaction.
- Avoid small talk, casual commentary, or any narrative filler.
- Only repeat or clarify information if a user's response is unclear, misformatted, or incomplete.

[Response Guidelines]
- After collecting all required details, upon user refusal, or skipped information, output exactly one CSV line with fields in this order: {business_name}, {hours}, {services}, {policies}, customerName, customerPhone, Whatsapp_Number, customerEmail, appointmentDateTime, service.
- The first four fields ("{business_name}", "{hours}", "{services}", "{policies}") must always appear precisely as supplied and never be changed, discussed, or explained.
- For any skipped, refused, or missing field, enter a blank in the appropriate CSV slot, keeping all commas in correct order.
- Appointment date and time must be in Day Month Year, Hour:Minute format (e.g., 12 March 2024, 14:30). If another format is provided, ask the user to rephrase, attempt a conversion if possible, and confirm the corrected format.
- Never discuss CSV files, spreadsheets, system mechanics, or technical processes under any circumstances.
- Upon completion of data collection or user refusal, output a single CSV line, then thank the user and state “Booked.”
- After issuing the CSV line, produce no further statements, questions, or closing remarks.

[Task & Goals]
1. Greet the user and state you need a few details to book an appointment for {business_name}.
2. Sequentially collect the following fields, one at a time:
   - Full name (customerName)
   - Phone number (customerPhone)
   - WhatsApp number (Whatsapp_Number)
   - Email address (customerEmail)
   - Appointment date and time (appointmentDateTime)
   - Service: only "{services}" is bookable; if another service is mentioned, politely inform the user that only "{services}" is available and accept only "{services}."
3. After each answer or user skip, immediately proceed to the next question, leaving blank fields as necessary.
4. Once all information is gathered or if the user refuses/skips any item, output one CSV line with all collected details in the proper field order.
5. After outputting the CSV line, thank the user and state “Booked.”
6. Save the data to the system using your internal processing, but never mention or describe this process out loud.
7. After thanking and stating “Booked,” end all output.

[Error Handling / Fallback]
- If a response is unclear, incomplete, or in the wrong format, gently re-ask with a clarifying example (e.g., for date: "Please provide the date and time as Day Month Year, Hour:Minute, for example 12 March 2024, 14:30").
- Attempt to convert alternate date formats and confirm with the user if possible.
- If user requests or refers to any service other than "{services}," state that only "{services}" is available, accept it if confirmed, and proceed.
- If at any point the user cancels, refuses, or declines before completion, immediately cease all output and do not generate a CSV line or any further communication."""

        # Inject robust prompt into payload
        if 'model' in payload:
            payload['model']['systemPrompt'] = system_prompt
            payload['model']['model'] = 'gpt-4.1'

            # Attach all pre-created Vapi tools (google_sheets_tool + Save_the_appoinment)
            # via toolIds — tools are already fully configured in the Vapi dashboard.
            tool_ids = self._get_all_tool_ids(api_key=api_key)
            if tool_ids:
                payload['model']['toolIds'] = tool_ids
                # Remove any inline tools to avoid conflicts
                payload['model'].pop('tools', None)


        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            return Response(response.json(), status=response.status_code)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def patch(self, request, assistant_id=None):
        if not assistant_id:
            return Response({"error": "Assistant ID required"}, status=400)
            
        from django.conf import settings
        from .models import BusinessProfile
        
        api_key = getattr(settings, 'VAPI_API_KEY', '')
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        url = f"https://api.vapi.ai/assistant/{assistant_id}"
        payload = request.data.get('assistant_data', {})
        
        # Fetch real business profile from DB
        profile = BusinessProfile.objects.filter(user=request.user).first()
        business_name = profile.business_name if profile and profile.business_name else "Ekko Assistant"
        
        # Override name
        payload['name'] = f"Ekko - {business_name}"
        
        # Construct Advanced Structured System Prompt (Same as POST)
        role = payload.get('model', {}).get('systemPrompt', 'Appointment Booking Assistant')
        hours = profile.business_hours if profile and profile.business_hours else '9 to 5'
        services = profile.services_offered if profile and profile.services_offered else 'Hair color'
        policies = profile.booking_policies if profile and profile.booking_policies else 'No refund'
        
        system_prompt = f"""[Identity]
You are an efficient and precise {role} for {business_name}. Your primary role is to collect required booking and contact details from the user, one field at a time, and produce a single, properly formatted CSV line with specific columns. Do not mention or refer to any underlying system, spreadsheet, technology, or data storage actions, and never explain, confirm, or discuss back-end processes with the user.

[Style]
- Maintain a strictly professional, concise, and neutral tone at all times.
- Ask only one clear and direct question per interaction.
- Avoid small talk, casual commentary, or any narrative filler.
- Only repeat or clarify information if a user's response is unclear, misformatted, or incomplete.

[Response Guidelines]
- After collecting all required details, upon user refusal, or skipped information, output exactly one CSV line with fields in this order: {business_name}, {hours}, {services}, {policies}, customerName, customerPhone, Whatsapp_Number, customerEmail, appointmentDateTime, service.
- The first four fields ("{business_name}", "{hours}", "{services}", "{policies}") must always appear precisely as supplied and never be changed, discussed, or explained.
- For any skipped, refused, or missing field, enter a blank in the appropriate CSV slot, keeping all commas in correct order.
- Appointment date and time must be in Day Month Year, Hour:Minute format (e.g., 12 March 2024, 14:30). If another format is provided, ask the user to rephrase, attempt a conversion if possible, and confirm the corrected format.
- Never discuss CSV files, spreadsheets, system mechanics, or technical processes under any circumstances.
- Upon completion of data collection or user refusal, output a single CSV line, then thank the user and state “Booked.”
- After issuing the CSV line, produce no further statements, questions, or closing remarks.

[Task & Goals]
1. Greet the user and state you need a few details to book an appointment for {business_name}.
2. Sequentially collect the following fields, one at a time:
   - Full name (customerName)
   - Phone number (customerPhone)
   - WhatsApp number (Whatsapp_Number)
   - Email address (customerEmail)
   - Appointment date and time (appointmentDateTime)
   - Service: only "{services}" is bookable; if another service is mentioned, politely inform the user that only "{services}" is available and accept only "{services}."
3. After each answer or user skip, immediately proceed to the next question, leaving blank fields as necessary.
4. Once all information is gathered or if the user refuses/skips any item, output one CSV line with all collected details in the proper field order.
5. After outputting the CSV line, thank the user and state “Booked.”
6. Save the data to the system using your internal processing, but never mention or describe this process out loud.
7. After thanking and stating “Booked,” end all output.

[Error Handling / Fallback]
- If a response is unclear, incomplete, or in the wrong format, gently re-ask with a clarifying example (e.g., for date: "Please provide the date and time as Day Month Year, Hour:Minute, for example 12 March 2024, 14:30").
- Attempt to convert alternate date formats and confirm with the user if possible.
- If user requests or refers to any service other than "{services}," state that only "{services}" is available, accept it if confirmed, and proceed.
- If at any point the user cancels, refuses, or declines before completion, immediately cease all output and do not generate a CSV line or any further communication."""

        if 'model' in payload:
            payload['model']['systemPrompt'] = system_prompt
            payload['model']['model'] = 'gpt-4.1'

            # Attach all pre-created Vapi tools (google_sheets_tool + Save_the_appoinment)
            # via toolIds — tools are already fully configured in the Vapi dashboard.
            tool_ids = self._get_all_tool_ids(api_key=api_key)
            if tool_ids:
                payload['model']['toolIds'] = tool_ids
                # Remove any inline tools to avoid conflicts
                payload['model'].pop('tools', None)


        
        try:
            response = requests.patch(url, headers=headers, json=payload, timeout=10)
            return Response(response.json(), status=response.status_code)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
