import sys
import os

# Import data_loader dynamically
import importlib.util

module_path = os.path.join(os.path.dirname(__file__), "../app/services/data_loader.py")
spec = importlib.util.spec_from_file_location("data_loader", module_path)
data_loader_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(data_loader_module)

load_demo_data = data_loader_module.load_demo_data

print("Testing load_demo_data(2015)")
floats = load_demo_data(2015)
print(f"Loaded {len(floats)} floats for 2015")
if floats:
    print("Sample float:", floats[0])

print("\nTesting load_demo_data(2015, 'Pacific')")
floats_pacific = load_demo_data(2015, 'Pacific')
print(f"Loaded {len(floats_pacific)} floats for 2015 Pacific")

print("\nTesting invalid year 1999")
try:
    load_demo_data(1999)
except FileNotFoundError as e:
    print(f"Expected error: {e}")