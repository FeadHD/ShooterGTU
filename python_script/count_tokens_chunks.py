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

def main(json_file):
    # Load the JSON file containing an array of chunks
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Iterate over all chunks
    for chunk in data:
        chunk_index = chunk.get('chunk_index', 'N/A')
        method = chunk.get('method', 'N/A')
        chunk_text = chunk.get('chunk_text', '')
        
        # Count tokens in this chunk
        token_count = count_tokens(chunk_text)
        
        # Print results for this chunk
        print(f"Chunk Index: {chunk_index}")
        print(f"Method: {method}")
        print(f"Token Count: {token_count}")
        print("------")
        
        # Optional preview
        if len(chunk_text) > 200:
            print("Chunk Text Preview:")
            print(chunk_text[:200] + "...")
        else:
            print("Chunk Text:")
            print(chunk_text)
        
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    # Usage example:
    # python count_tokens_chunks.py config.js.chunks.json
    if len(sys.argv) < 2:
        print("Usage: python count_tokens_chunks.py <json_file>")
        sys.exit(1)

    json_file_path = sys.argv[1]
    main(json_file_path)
