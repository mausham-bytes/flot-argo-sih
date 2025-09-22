# services/query_service.py
from app.db.mongo_client import get_db
from datetime import datetime
import pandas as pd
import numpy as np
from app.services.llm_service import generate_summary
from app.services.data_service import ArgoDataService
from app.utils.ml_cleaning import ml_clean_argo_data
import os

LLM_SAMPLE_SIZE = 200  # Rows for LLM
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "data", "argo_sample_data.csv")

# Hardcoded available years for demo since CSV only has 2010
# Extended to allow querying up to recent years via API
AVAILABLE_YEARS = list(range(2010, 2026))  # 2010 to 2025
data_service = None

def initialize_data_service():
    global data_service
    if data_service is None:
        try:
            data_service = ArgoDataService()
        except Exception as e:
            print(f"Failed to initialize data service: {e}")

def get_available_years_message():
    """Provide user-friendly message about available data."""
    initialize_data_service()
    if AVAILABLE_YEARS:
        min_year = min(AVAILABLE_YEARS)
        max_year = max(AVAILABLE_YEARS)
        return f"Available data: {min_year}-{max_year} ({', '.join(map(str, AVAILABLE_YEARS))})"
    return "No data currently available."

def check_years_available(parsed_years):
    """Check if requested years exist in dataset."""
    initialize_data_service()
    if not parsed_years:
        return True, None

    missing_years = []
    for year in parsed_years:
        if year not in AVAILABLE_YEARS:
            missing_years.append(year)

    if missing_years:
        available_str = ', '.join(map(str, AVAILABLE_YEARS))
        missing_str = ', '.join(map(str, missing_years))
        return False, f"I can't find data for year(s): {missing_str}. Available years: {available_str}"

    return True, None

def parse_user_query_with_gemini(user_query: str):
    """
    Enhanced parser that provides better year availability information.
    Extracts year references from queries to check data availability.
    """
    initialize_data_service()
    query_lower = user_query.lower()

    # Extract years from query (look for 4-digit numbers likely to be years)
    import re
    possible_years = re.findall(r'\b20\d{2}\b', query_lower)
    requested_years = [int(year) for year in possible_years]

    # Extract month from query
    month_dict = {
        "january": 1, "jan": 1, "february": 2, "feb": 2, "march": 3, "mar": 3,
        "april": 4, "apr": 4, "may": 5, "june": 6, "jun": 6,
        "july": 7, "jul": 7, "august": 8, "aug": 8, "september": 9, "sep": 9, "sept": 9,
        "october": 10, "oct": 10, "november": 11, "nov": 11, "december": 12, "dec": 12
    }
    requested_month = None
    for month_str in month_dict:
        if month_str in query_lower:
            requested_month = month_dict[month_str]
            break

    # Extract depth filter (e.g., "depths < 500m" or "at depths < 500")
    depth_match = re.search(r'depths?\s*([<>=]+)\s*(\d+)', query_lower)
    requested_depth_op = None
    requested_depth_value = None
    if depth_match:
        requested_depth_op = depth_match.group(1).strip()
        requested_depth_value = int(depth_match.group(2))

    # Check if requested years are available
    available, year_message = check_years_available(requested_years)

    if not available:
        # Return special response indicating unavailable data
        return {
            "lat_range": [-90, 90],
            "lon_range": [-180, 180],
            "depth_range": [0, 2000],
            "year_range": ["2010-01-01", "2020-12-31"],
            "month": requested_month,
            "variables": ["TEMP", "PSAL", "PRES"],
            "unavailable_years": year_message
        }

    # Default params
    lat_range = [-90, 90]
    lon_range = [-180, 180]
    depth_range = [0, 2000]
    year_range = ["2010-01-01", "2020-12-31"]

    # Simple location parsing
    if 'indian' in query_lower or 'india' in query_lower:
        lon_range = [0, 120]
        lat_range = [-60, 30]
    elif 'atlantic' in query_lower:
        lon_range = [-70, 40]
        lat_range = [-60, 70]
    elif 'pacific' in query_lower:
        lon_range = [120, 289]  # 180 to -180 = 289
        lat_range = [-60, 60]
    elif 'caribbean' in query_lower or 'america' in query_lower:
        lon_range = [-60, -55]
        lat_range = [10, 15]
    elif 'southern' in query_lower or 'antarctic' in query_lower:
        lat_range = [-90, -23]
    elif 'arctic' in query_lower:
        lat_range = [66, 90]
    elif 'northern' in query_lower:
        lat_range = [0, 90]
    elif 'equatorial' in query_lower or 'equator' in query_lower:
        lat_range = [-10, 10]
        lon_range = [-180, 180]

    # Year filtering - use year range if mentioned
    if requested_years:
        min_year = min(requested_years)
        max_year = max(requested_years)
        year_range = [f"{min_year}-01-01", f"{max_year}-12-31"]

    # Depth filtering - adjust depth_range based on depth operator
    if requested_depth_value:
        if requested_depth_op == '<':
            depth_range = [0, requested_depth_value - 1]
        elif requested_depth_op == '<=':
            depth_range = [0, requested_depth_value]
        elif requested_depth_op == '>':
            depth_range = [requested_depth_value + 1, 2000]
        elif requested_depth_op == '>=':
            depth_range = [requested_depth_value, 2000]
        elif requested_depth_op == '=':
            depth_range = [requested_depth_value, requested_depth_value]
        else:
            depth_range = [0, 2000]  # fallback

    return {
        "lat_range": lat_range,
        "lon_range": lon_range,
        "depth_range": depth_range,
        "year_range": year_range,
        "month": requested_month,
        "variables": ["TEMP", "PSAL", "PRES"]
    }


def assign_dynamic_region(df, num_lat_bands=3, num_lon_bands=3):
    """
    Divide the dataframe into dynamic lat/lon bands for visualization.
    """
    df = df.copy()
    df['lat_band'] = pd.cut(df['lat'], bins=num_lat_bands, labels=False)
    df['lon_band'] = pd.cut(df['lon'], bins=num_lon_bands, labels=False)
    df['region'] = df['lat_band'].astype(str) + "-" + df['lon_band'].astype(str)
    return df


def handle_query(user_query: str):
    initialize_data_service()
    # 1️⃣ Parse user query to extract region, years, depth
    params = parse_user_query_with_gemini(user_query)

    # Check if years are unavailable (though now dynamic)
    if 'unavailable_years' in params:
        return {
            "plot": None,  # Add plot data
            "data": {"records": [], "rows": 0},
            "summary": params['unavailable_years'],
            "map": {"points": []},
            "metadata": {"source": "Direct ARGO API System", "version": "0.1"}
        }

    # Determine region name from params
    region = "Global"  # default
    if params["lon_range"][0] == 20 and params["lon_range"][1] == 120 and params["lat_range"][0] == -60 and params["lat_range"][1] == 30:
        region = "Indian Ocean"
    elif params["lon_range"][0] == -70 and params["lon_range"][1] == 40 and params["lat_range"][0] == -60 and params["lat_range"][1] == 70:
        region = "Atlantic Ocean"
    elif params["lon_range"][0] == 120 and params["lon_range"][1] == 289 and params["lat_range"][0] == -60 and params["lat_range"][1] == 60:
        region = "Pacific Ocean"
    # Add more as needed

    # Extract years
    start_year = int(params["year_range"][0].split('-')[0])
    end_year = int(params["year_range"][1].split('-')[0])
    max_depth = params["depth_range"][1]  # in meters

    # 2️⃣ Fetch data directly via API
    try:
        argo_data = data_service.fetch_argo_data_via_api(region, start_year, end_year, max_depth)
        df = pd.DataFrame(argo_data)

        if df.empty:
            raise Exception("No data fetched")
    except Exception as e:
        print("⚠️ Failed to fetch ARGO data:", e)
        return {
            "plot": None,
            "data": {"records": [], "rows": 0},
            "summary": f"Unable to fetch data for {region} {start_year}-{end_year} at depths <{max_depth}m. Error: {str(e)}",
            "map": {"points": []},
            "metadata": {"source": "Direct ARGO API System", "version": "0.1"}
        }

    # 3️⃣ Process data for visualization
    df.rename(columns={'latitude': 'lat', 'longitude': 'lon'}, inplace=True)

    # Generate plot data: Temperature Profile
    plot_data = {"temperatures": [], "depths": [], "years": []}
    for _, row in df.iterrows():
        plot_data["temperatures"].append(row['temperature'])
        plot_data["depths"].append(row['depth'])
        year = int(pd.to_datetime(row['time']).year) if pd.notna(row['time']) else start_year
        plot_data["years"].append(year)

    # Salinity map points
    map_points = [{"lat": row['lat'], "lon": row['lon'], "salinity": row['salinity']} for _, row in df.iterrows()]

    # Summary statistics
    avg_temp = df['temperature'].mean() if 'temperature' in df.columns else None
    avg_salinity = df['salinity'].mean() if 'salinity' in df.columns else None
    num_points = len(df)

    summary = f"Fetched {num_points} ARGO float data points for {region} ({start_year}-{end_year}) at depths <{max_depth}m. "
    if avg_temp:
        summary += f"Average Temperature: {avg_temp:.1f}°C. "
    if avg_salinity:
        summary += f"Average Salinity: {avg_salinity:.2f} PSU."

    # Cleaned data for frontend
    cleaned_df = ml_clean_argo_data(df)  # Still use ML cleaning
    cleaned_json_full = cleaned_df.to_dict(orient="records")

    # 1️⃣1️⃣ Return structured JSON
    return {
        "plot": plot_data,
        "data": {"records": cleaned_json_full, "rows": len(cleaned_json_full)},
        "summary": summary,
        "map": {"points": map_points},
        "metadata": {"source": "Direct ARGO API System", "version": "0.1"}
    }
