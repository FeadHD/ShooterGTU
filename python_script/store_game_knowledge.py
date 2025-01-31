import os
import faiss
import openai
import numpy as np

# Load API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

# OpenAI Embedding Model
EMBEDDING_MODEL = "text-embedding-ada-002"

# Function to get vector embedding
def get_embedding(text):
    response = openai.embeddings.create(
        input=[text],  
        model=EMBEDDING_MODEL
    )
    return np.array(response.data[0].embedding)

# Function to store game files in FAISS
def store_game_knowledge(directory="src/"):
    vector_data = []
    file_paths = []

    print("📂 Scanning game files...")

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".js"):  
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    print(f"📄 Processing: {file_path} ...")
                    vector_data.append(get_embedding(content))
                    file_paths.append(file_path)

    if not vector_data:
        print("❌ No game files found! Ensure your game files are inside 'src/'.")
        return

    # Convert embeddings to FAISS format
    embeddings = np.array(vector_data, dtype="float32")

    print("🚀 Creating FAISS index...")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    # Define storage folder
    storage_folder = "python_script"
    os.makedirs(storage_folder, exist_ok=True)

    # Save FAISS index and filenames
    faiss.write_index(index, os.path.join(storage_folder, "game_memory.index"))
    np.save(os.path.join(storage_folder, "game_filenames.npy"), file_paths)

    print(f"✅ Game knowledge stored successfully in {storage_folder}/!")

# Run storage process
if __name__ == "__main__":
    store_game_knowledge()
