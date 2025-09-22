import os
import pandas as pd
import random

def load_demo_data(year, ocean=None):
    """
    Load ARGO demo data for a given year from the 2-year chunk CSVs.

    Example: year=2007 will load argo_demo_2007_2008.csv
    If ocean is specified, filter by that ocean (Pacific, Atlantic, etc.)
    """
    # Figure out which 2-year file to use
    if year % 2 == 0:
        start_year = year - 1
    else:
        start_year = year
    end_year = start_year + 1

    filename = f"argo_demo_{start_year}_{end_year}.csv"
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'data_chunks', filename)

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"No chunk file found for year {year} ({file_path})")

    print(f"📂 Loading demo data from {filename} ...")
    df = pd.read_csv(file_path, parse_dates=["time"])

    # Filter by ocean if specified
    if ocean:
        df = df[df["ocean"] == ocean]

    # Convert to list of float dictionaries matching the data service format
    floats = []
    for _, row in df.iterrows():
        status = 'active' if random.random() > 0.15 else 'inactive'  # ~15% inactive

        float_data = {
            'id': f"WMO_{row['year']}_{row['ocean'][:3]}_{row['platform_number']}_{row['cycle_number']}",
            'lat': round(float(row['latitude']), 3),
            'lon': round(float(row['longitude']), 3),
            'temperature': round(float(row['temp']), 1) if pd.notna(row['temp']) else None,
            'salinity': round(float(row['psal']), 1) if pd.notna(row['psal']) else None,
            'pressure': round(float(row['pres']), 1) if pd.notna(row['pres']) else None,
            'oxygen': round(random.uniform(1.0, 8.0), 1) if pd.notna(row['temp']) else None,  # Add simulated oxygen
            'cycle': int(row['cycle_number']),
            'time': str(row['time']),
            'status': status,
            'data_source': 'demo'
        }
        floats.append(float_data)

    return floats