import openai
import numpy as np
import faiss
import os
from tiktoken import encoding_for_model

# Load OpenAI API key from environment
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_embedding(text):
    response = openai.embeddings.create(
        input=[text],
        model="text-embedding-ada-002"
    )
    return np.array(response.data[0].embedding)

# The code snippet we want to analyze
code_snippet = "this.eventManager.emit"

# 1. Tokenization Analysis
print("1. Tokenization Analysis")
print("-" * 50)
enc = encoding_for_model("text-embedding-ada-002")
tokens = enc.encode(code_snippet)
token_texts = [enc.decode([token]) for token in tokens]

print(f"Original text: {code_snippet}")
print(f"Number of tokens: {len(tokens)}")
print("Individual tokens:")
for i, (token, text) in enumerate(zip(tokens, token_texts)):
    print(f"Token {i+1}: {token} -> '{text}'")

# 2. Vector Analysis
print("\n2. Vector Analysis")
print("-" * 50)
vector = get_embedding(code_snippet)

# Load existing index
index = faiss.read_index("game_memory.index")
filenames = np.load("game_filenames.npy")

# Search for similar vectors
k = 5  # number of nearest neighbors to find
vector_reshaped = vector.reshape(1, -1)
D, I = index.search(vector_reshaped, k)

print("\nMost similar code files (grouped by directory):")
directory_distances = {}
for dist, idx in zip(D[0], I[0]):
    if idx < len(filenames):
        filepath = filenames[idx]
        directory = os.path.dirname(filepath.split(" (Category:")[0])
        if directory not in directory_distances:
            directory_distances[directory] = []
        directory_distances[directory].append((dist, filepath))

for directory, files in directory_distances.items():
    print(f"\nDirectory: {directory}")
    for dist, filepath in files:
        print(f"  Distance: {dist:.4f} -> {os.path.basename(filepath.split(' (Category:')[0])}")

# 3. Vector Statistics
print("\n3. Vector Statistics")
print("-" * 50)
print(f"Vector dimension: {len(vector)}")
print(f"Mean value: {np.mean(vector):.6f}")
print(f"Standard deviation: {np.std(vector):.6f}")
print(f"Max value: {np.max(vector):.6f}")
print(f"Min value: {np.min(vector):.6f}")
print(f"First 5 dimensions: {vector[:5]}")
