import requests
import pandas as pd
import os

def fetch_argo_metadata(float_id):
    """
    Fetch metadata for a given Argo float ID from Argo API.
    Falls back to CSV data if API fails.
    """
    # Try ArgoVis API first
    try:
        url = f"https://argovis.colorado.edu/argoFloats/{float_id}"
        response = requests.get(url)
        if response.status_code == 200:
            # Check if response is JSON
            if response.headers.get('Content-Type', '').startswith('application/json'):
                data = response.json()
                # Extract latitude and longitude from metadata
                lat = data.get('latitude')
                lon = data.get('longitude')
                if lat is not None and lon is not None:
                    return lat, lon
    except Exception as e:
        print(f"API request failed: {e}")

    # Fallback to CSV data
    print(f"Falling back to CSV data for float {float_id}")
    try:
        csv_path = os.path.join(os.path.dirname(__file__), 'data', 'argo_sample_data.csv')
        df = pd.read_csv(csv_path)
        if not df.empty:
            # For demo purposes, return the first row's coordinates
            first_row = df.iloc[0]
            lat = first_row['LATITUDE']
            lon = first_row['LONGITUDE']
            return lat, lon
    except Exception as e:
        print(f"CSV fallback failed: {e}")

    print(f"Failed to fetch metadata for float {float_id}")
    return None, None

def read_argo_csv(file_path):
    """
    Read CSV file and extract location data (latitude, longitude).
    """
    try:
        df = pd.read_csv(file_path)
        return df['LATITUDE'].values, df['LONGITUDE'].values
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return None, None

def main():
    # Example 1: Fetch metadata from API for a float
    float_id = "4901234"  # Replace with a real float ID
    lat, lon = fetch_argo_metadata(float_id)
    if lat is not None and lon is not None:
        print(f"Float {float_id} location: Latitude={lat}, Longitude={lon}")

    # Example 2: Read location from a local CSV file
    csv_file = os.path.join(os.path.dirname(__file__), 'data', 'argo_sample_data.csv')
    latitudes, longitudes = read_argo_csv(csv_file)
    if latitudes is not None and longitudes is not None:
        print("Locations from CSV file:")
        for la, lo in zip(latitudes, longitudes):
            print(f"Latitude: {la}, Longitude: {lo}")

if __name__ == "__main__":
    main()