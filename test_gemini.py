import requests
import json
import os

API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
response = requests.get(url)
print(response.json())
