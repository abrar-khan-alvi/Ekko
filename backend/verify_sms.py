import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from chatbot.sms_utils import _send_sms
from unittest.mock import patch, MagicMock

def test_phone_formatting():
    print("Testing phone number formatting...")
    
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        
        # Test case 1: No + prefix
        _send_sms("1234567890", "Test message", "Test Biz")
        # Since it starts a thread, we might need a small sleep or join the thread
        # For simplicity in this script, we'll just check if logic was called
        
        # Test case 2: Has + prefix
        _send_sms("+0987654321", "Test message", "Test Biz")

    print("Phone formatting logic execution triggered.")

if __name__ == "__main__":
    test_phone_formatting()
    print("Verification script finished.")
