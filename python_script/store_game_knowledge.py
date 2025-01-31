import os
import faiss
import openai
import numpy as np

# Load API key from environment variable (recommended)
openai.api_key = os.getenv("OPENAI_API_KEY")  # Or manually set: openai.api_key = "your-api-key-here"

# OpenAI Embedding Model
EMBEDDING_MODEL = "text-embedding-ada-002"

# Function to get vector embedding for a query
def get_embedding(text):
    response = openai.embeddings.create(
        input=[text],  # Wrap text in a list
        model=EMBEDDING_MODEL
    )
    return np.array(response.data[0].embedding)

# Function to read game files and store them in FAISS
def store_game_knowledge(directory="src/"):
    vector_data = []
    file_paths = []

    print("📂 Scanning game files...")
    
    # Read all JavaScript files in the game directory
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".js"):  # Process only JavaScript files
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
    index = faiss.IndexFlatL2(embeddings.shape[1])  # L2 distance index
    index.add(embeddings)

    # Define storage directory
    storage_folder = "python_script"

    # Ensure the folder exists
    os.makedirs(storage_folder, exist_ok=True)

    # Save FAISS index and filenames in the correct folder
    faiss.write_index(index, os.path.join(storage_folder, "game_memory.index"))
    np.save(os.path.join(storage_folder, "game_filenames.npy"), file_paths)

    print(f"✅ Game knowledge stored successfully in {storage_folder}/!")

# Function to search FAISS for the most relevant game files
def search_game_knowledge(query, top_k=3):
    storage_folder = "python_script"  # Add storage folder reference
    index_path = os.path.join(storage_folder, "game_memory.index")
    filenames_path = os.path.join(storage_folder, "game_filenames.npy")

    if not os.path.exists(index_path):
        print("❌ FAISS index not found! Please run `store_game_knowledge.py` first.")
        return []

    query_embedding = get_embedding(query).reshape(1, -1)

    # Load FAISS index and filenames
    index = faiss.read_index(index_path)
    filenames = np.load(filenames_path)

    # Search for top K matches
    distances, indices = index.search(query_embedding, top_k)

    # Return most relevant files
    results = [filenames[i] for i in indices[0] if i < len(filenames)]
    
    return results

# Function to ask GPT-4 Turbo (O1) using retrieved game files
def ask_ai_with_memory(question):
    # Find relevant game files
    relevant_files = search_game_knowledge(question)

    if not relevant_files:
        return "❌ No relevant files found for your question."

    # Read file contents
    file_contents = []
    for file in relevant_files:
        try:
            with open(file.split(" - ")[0], "r", encoding="utf-8") as f:
                file_contents.append(f.read())
        except Exception as e:
            print(f"Warning: Could not read file {file}: {str(e)}")
            continue

    if not file_contents:
        return "❌ Could not read any relevant files."

    # Create final prompt for O1
    context = "\n\n".join(file_contents)
    prompt = f"Context from ShooterGTU game files:\n{context}\n\nUser Question: {question}"

    # Send to GPT-4 Turbo (O1)
    try:
        response = openai.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are an expert game developer specializing in Phaser 3."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"❌ Error getting AI response: {str(e)}"

# Main loop for AI assistant
if __name__ == "__main__":
    print("📚 Storing game knowledge in FAISS...")
    store_game_knowledge()

    print("🎮 ShooterGTU AI Assistant Ready!")
    while True:
        question = input("\n🧑‍💻 You: ")
        if question.lower() in ["exit", "quit"]:
            break
        
        response = ask_ai_with_memory(question)
        print("\n🤖 AI Assistant:", response)
