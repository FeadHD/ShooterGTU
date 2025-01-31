import numpy as np
import os

# Define FAISS storage path
storage_folder = "python_script"
filenames_path = os.path.join(storage_folder, "game_filenames.npy")

# Check if the file exists
if os.path.exists(filenames_path):
    filenames = np.load(filenames_path)
    print("\n📂 FAISS Indexed Files:")
    for file in filenames:
        print(f"  - {file}")
else:
    print("❌ `game_filenames.npy` not found! Run `store_game_knowledge.py` first.")