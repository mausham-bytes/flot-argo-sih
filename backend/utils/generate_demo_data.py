import pandas as pd
import numpy as np

# Config
start_date = "2005-01-01"
end_date = pd.to_datetime("today").strftime("%Y-%m-%d")
years = pd.date_range(start=start_date, end=end_date, freq="Y").year

# Oceans with lat/lon ranges
oceans = {
    "Pacific": {"lat": (-60, 60), "lon": (-170, -70)},
    "Atlantic": {"lat": (-60, 70), "lon": (-70, 20)},
    "Indian": {"lat": (-40, 30), "lon": (20, 120)},
    "Southern": {"lat": (-90, -40), "lon": (-180, 180)},
    "Arctic": {"lat": (70, 90), "lon": (-180, 180)}
}

platform_numbers = ["6902746", "6902750", "6903001", "6903010", "6903055"]

rows_per_year_per_ocean = 1000  # adjustable for dataset size
records = []

np.random.seed(42)

cycle_counter = 1

for year in years:
    for ocean, bounds in oceans.items():
        for i in range(rows_per_year_per_ocean):
            lat = np.random.uniform(*bounds["lat"])
            lon = np.random.uniform(*bounds["lon"])
            time = pd.to_datetime(f"{year}-01-01") + pd.to_timedelta(
                np.random.randint(0, 365*24), unit="h"
            )
            record = [
                year,
                ocean,
                np.random.choice(platform_numbers),
                cycle_counter,
                lat,
                lon,
                time,
                np.random.uniform(0, 2000),   # pres
                np.random.uniform(-2, 35),    # temp
                np.random.uniform(30, 40)     # psal
            ]
            records.append(record)
            cycle_counter += 1

# Build dataframe
df = pd.DataFrame(records, columns=[
    "year", "ocean", "platform_number", "cycle_number",
    "latitude", "longitude", "time", "pres", "temp", "psal"
])

# Save to CSV in data directory
import os
data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'data')
os.makedirs(data_dir, exist_ok=True)
file_path = os.path.join(data_dir, 'argo_demo_20yrs_oceans.csv')
df.to_csv(file_path, index=False)

print(f"✅ Demo data generated: {len(df)} rows, covering {len(years)} years.")
print(f"File saved to: {file_path}")

if __name__ == "__main__":
    pass