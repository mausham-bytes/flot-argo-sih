"""
Demo backend: Fetches Argo float data (from a local NetCDF file or remote API), extracts and prints location info.
"""

import os
import json
import pandas as pd
import numpy as np
from flask import Flask, jsonify

app = Flask(__name__)

# DEMO: Path to a sample CSV file
CSV_FILE = os.path.join(os.path.dirname(__file__), "../Argo_backend/data/argo_sample_data.csv")

def extract_location_from_csv(csv_path):
    """
    Extracts latitude and longitude from the CSV data file.
    Returns a dict with lat/lon or None if not found.
    """
    try:
        df = pd.read_csv(csv_path)
        if df.empty:
            print("CSV file is empty")
            return None
        # Take the first row
        first_row = df.iloc[0]
        latitude = first_row['LATITUDE']
        longitude = first_row['LONGITUDE']
        return {
            "latitude": float(latitude),
            "longitude": float(longitude)
        }
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return None

@app.route('/argo/location', methods=['GET'])
def get_argo_location():
    """
    API endpoint to get Argo float location from CSV data.
    """
    location = extract_location_from_csv(CSV_FILE)
    if location:
        return jsonify({"status": "success", "location": location})
    else:
        return jsonify({"status": "error", "message": "Could not extract location"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)