import json
import os

def format_json(input_file):
    """Format a JSON file with consistent indentation and bracket positioning."""
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Reformatting the JSON data to ensure consistent field alignment
        formatted_data = json.dumps(data, indent=2, ensure_ascii=False)

        # Replacing line breaks in the tags array to make sure they're on the same line
        formatted_data = formatted_data.replace('"tags": [', '"tags": [ ').replace('],\n', ']\n    ')  # tags on the same line

        # Write back with consistent formatting
        with open(input_file, 'w', encoding='utf-8') as f:
            f.write(formatted_data)
            f.write('\n')  # Add newline at the end of the file to ensure proper format
        
        print(f"Successfully formatted: {input_file}")
    
    except Exception as e:
        print(f"Error processing {input_file}: {str(e)}")

def process_files(directory):
    """Process all chunk JSON files in the directory."""
    chunk_files = []
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.endswith('.chunks.json'):
                file_path = os.path.join(root, filename)
                chunk_files.append(file_path)
                print(f"Found chunk file: {file_path}")
    
    print(f"\nFound {len(chunk_files)} chunk files to process")
    
    for file_path in chunk_files:
        format_json(file_path)

if __name__ == '__main__':
    base_dir = r'c:\Users\laber\Desktop\ShooterGTU-master\public\dataset\chunks'
    print("Starting JSON formatting process...")
    print(f"Base directory: {base_dir}\n")
    process_files(base_dir)
    print("\nJSON formatting complete!")
