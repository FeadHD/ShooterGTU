import openai
import os

# Load API Key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Test API Request
try:
    response = openai.chat.completions.create(
        model="gpt-4-turbo",
        messages=[{"role": "user", "content": "What is the capital of France?"}]
    )
    print("✅ OpenAI API is working! Response:", response.choices[0].message.content)
except openai.OpenAIError as e:
    print("❌ OpenAI API Error:", e)
