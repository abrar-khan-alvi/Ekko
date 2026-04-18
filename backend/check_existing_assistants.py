import requests
import os

api_key = "a97ed574-69c5-4446-8751-1aed6c70ed90"
headers = {"Authorization": f"Bearer {api_key}"}

try:
    response = requests.get("https://api.vapi.ai/assistant", headers=headers)
    assistants = response.json()
    if isinstance(assistants, list) and len(assistants) > 0:
        for a in assistants:
            print(f"Name: {a.get('name')}")
            print(f"Voice: {a.get('voice')}")
            print("-" * 20)
    else:
        print("No assistants found or error.")
        print(assistants)
except Exception as e:
    print(f"Error: {e}")
