import os
import tiktoken

# Load OpenAI tokenizer for `text-embedding-ada-002`
enc = tiktoken.encoding_for_model("text-embedding-ada-002")

# Function to count tokens in all `.js` files inside `src/`
def count_tokens(directory="src/"):
    total_tokens = 0
    file_token_counts = {}

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".js"):  # Only process JavaScript files
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    file_tokens = len(enc.encode(content))
                    file_token_counts[file_path] = file_tokens
                    total_tokens += file_tokens

    return total_tokens, file_token_counts

# Calculate total tokens and estimated cost
tokens, file_token_counts = count_tokens()
cost = (tokens / 1000) * 0.0001  # OpenAI price = $0.0001 per 1,000 tokens

# Display results
print("\n🔢 Token Count Per File:")
for file, token_count in file_token_counts.items():
    print(f"📄 {file}: {token_count} tokens")

print(f"\n🔢 Total Tokens: {tokens}")
print(f"💰 Estimated API Cost Per Run: ${cost:.5f}")
