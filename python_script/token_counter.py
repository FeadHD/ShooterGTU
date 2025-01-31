import tiktoken
import sys
import os

def count_tokens(file_path):
    enc = tiktoken.encoding_for_model("gpt-4")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            token_count = len(enc.encode(content))
            print(f"Token count for {os.path.basename(file_path)}: {token_count}")
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python token_counter.py <file_path>")
        print("Example: python token_counter.py src/scenes/elements/BaseScene.js")
    else:
        count_tokens(sys.argv[1])
