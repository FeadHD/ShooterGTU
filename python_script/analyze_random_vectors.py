import faiss
import numpy as np
import random

# Load the FAISS index
print("Loading FAISS index...")
index = faiss.read_index("game_memory.index")

# Get 5 random indices
random_indices = random.sample(range(index.ntotal), 5)

print(f"\nAnalyzing {len(random_indices)} random vectors from total {index.ntotal} vectors")
print(f"Each vector has {index.d} dimensions")
print("-" * 50)

# Get and analyze the vectors
for i, idx in enumerate(random_indices):
    # Get the vector
    vector = np.zeros((1, index.d), dtype='float32')
    index.reconstruct(idx, vector[0])
    
    # Calculate some statistics about this vector
    mean_val = np.mean(vector)
    std_val = np.std(vector)
    max_val = np.max(vector)
    min_val = np.min(vector)
    
    print(f"\nVector {i+1} (Index {idx}):")
    print(f"Mean value: {mean_val:.6f}")
    print(f"Standard deviation: {std_val:.6f}")
    print(f"Max value: {max_val:.6f}")
    print(f"Min value: {min_val:.6f}")
    print(f"First 5 dimensions: {vector[0][:5]}")
