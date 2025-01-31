import os
import faiss
import openai
import numpy as np

# Load API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

# Define FAISS storage path
storage_folder = "python_script"
index_path = os.path.join(storage_folder, "game_memory.index")
filenames_path = os.path.join(storage_folder, "game_filenames.npy")

# Function to get vector embedding
def get_embedding(text):
    response = openai.embeddings.create(
        input=[text],  
        model="text-embedding-ada-002"
    )
    return np.array(response.data[0].embedding)

# Function to search FAISS for relevant game files
def search_game_knowledge(query, top_k=3):
    if not os.path.exists(index_path):
        return "❌ FAISS index not found! Run `store_game_knowledge.py` first."

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
    relevant_files = search_game_knowledge(question)

    if isinstance(relevant_files, str):  # Error message
        return relevant_files

    if not relevant_files:
        return "❌ No relevant files found for your question."

    # Read relevant game files
    file_contents = []
    for file in relevant_files:
        try:
            with open(file, "r", encoding="utf-8") as f:
                file_contents.append(f.read())
        except Exception as e:
            print(f"Warning: Could not read file {file}: {str(e)}")
            continue

    if not file_contents:
        return "❌ Could not read any relevant files."

    # Create final prompt for GPT-4 Turbo
    context = "\n\n".join(file_contents)
    prompt = f"Context from ShooterGTU game files:\n{context}\n\nUser Question: {question}"

    # Send request to GPT-4 Turbo
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
    print("🎮 ShooterGTU AI Assistant Ready! Type your questions below:")
    while True:
        question = input("\n🧑‍💻 You: ")
        if question.lower() in ["exit", "quit"]:
            break
        
        response = ask_ai_with_memory(question)
        print("\n🤖 AI Assistant:", response)
