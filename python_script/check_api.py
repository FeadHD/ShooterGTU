import os

api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    print("✅ API Key is set correctly:", api_key)
else:
    print("❌ API Key is NOT set! Please configure it properly.")