import json
import sys

try:
    import tiktoken
except ImportError:
    tiktoken = None

def count_tokens(text, model="cl100k_base"):
    """
    Use the tiktoken library to count tokens for a given text and model.
    If tiktoken is not available, we fall back to a simple approximate method.
    """
    if tiktoken:
        encoding = tiktoken.get_encoding(model)
        tokens = encoding.encode(text)
        return len(tokens)
    else:
        # Fallback: approximate token count by splitting on whitespace/punctuation
        # Not as accurate, but works if tiktoken is not installed
        return len(text.split())

def main(json_file, chunk_index):
    # Load the JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Convert chunk_index from string to int
    chunk_index = int(chunk_index)
    
    # Find the chunk with the specified chunk_index
    chunk_data = next((chunk for chunk in data if chunk['chunk_index'] == chunk_index), None)
    if not chunk_data:
        print(f"No chunk found with chunk_index={chunk_index}")
        return
    
    # Extract the chunk text
    chunk_text = chunk_data.get('chunk_text', '')
    
    # Count tokens
    token_count = count_tokens(chunk_text)
    
    # Print results
    print(f"File: {json_file}")
    print(f"Chunk Index: {chunk_index}")
    print(f"Method: {chunk_data.get('method', 'N/A')}")
    print(f"Token Count: {token_count}")
    print("------")
    print("Chunk Text Preview:")
    if len(chunk_text) > 200:
        print(chunk_text[:200] + "...")
    else:
        print(chunk_text)

if __name__ == "__main__":
    # Usage example:
    # python count_tokens_chunks.py config.js.chunks.json 1
    if len(sys.argv) < 3:
        print("Usage: python count_tokens_chunks.py <json_file> <chunk_index>")
        sys.exit(1)

    json_file_path = sys.argv[1]
    chunk_idx = sys.argv[2]
    main(json_file_path, chunk_idx)
