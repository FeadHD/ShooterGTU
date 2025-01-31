import os

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("❌ API Key is NOT set! Please configure it properly.")
else:
    print(f"✅ API Key Length: {len(api_key)} characters")
    print(f"✅ API Key (Sanitized): '{api_key.strip()}'")