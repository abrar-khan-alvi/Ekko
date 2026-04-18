import requests
import os

api_key = "a97ed574-69c5-4446-8751-1aed6c70ed90"
headers = {"Authorization": f"Bearer {api_key}"}

try:
    response = requests.get("https://api.vapi.ai/voice", headers=headers)
    print(f"Status: {response.status_code}")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
