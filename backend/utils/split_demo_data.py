import pandas as pd
import os

# Load dataset
base_dir = os.path.dirname(os.path.dirname(__file__))
csv_path = os.path.join(base_dir, 'app', 'data', 'argo_demo_20yrs_oceans.csv')
print(f"csv_path: {csv_path}")
df = pd.read_csv(csv_path, parse_dates=["time"])

# Create output directory
out_dir = os.path.join(base_dir, 'app', 'data', 'data_chunks')
os.makedirs(out_dir, exist_ok=True)

# Divide into 2-year chunks
for start_year in range(2005, 2025, 2):
    end_year = start_year + 1
    chunk = df[(df["year"] >= start_year) & (df["year"] <= end_year)]
    chunk_file = os.path.join(out_dir, f"argo_demo_{start_year}_{end_year}.csv")
    chunk.to_csv(chunk_file, index=False)
    print(f"Saved {chunk_file} with {len(chunk)} rows")

print(f"Chunks created: {os.listdir(out_dir)}")
print(f"Total chunks: {len(os.listdir(out_dir))}")