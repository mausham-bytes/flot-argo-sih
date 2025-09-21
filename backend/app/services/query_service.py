# services/query_service.py
from db.mongo_client import get_db
from datetime import datetime
import pandas as pd
import numpy as np
from services.llm_service import generate_summary
from services.data_service import ArgoDataService
from utils.ml_cleaning import ml_clean_argo_data
import os

LLM_SAMPLE_SIZE = 200  # Rows for LLM
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "data", "argo_sample_data.csv")

# Hardcoded available years for demo since CSV only has 2010
AVAILABLE_YEARS = list(range(2010, 2024))  # 2010 to 2023
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
        lon_range = [20, 120]
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
        lat_range = [-90, 0]
    elif 'northern' in query_lower or 'arctic' in query_lower:
        lat_range = [0, 90]
    elif 'equatorial' in query_lower or 'equator' in query_lower:
        lat_range = [-10, 10]
        lon_range = [-180, 180]

    # Year filtering - use specific year if mentioned
    if requested_years:
        min_year = min(requested_years)
        year_range = [f"{min_year}-01-01", f"{min_year}-12-31"]

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
    df['lat_band'] = pd.cut(df['LATITUDE'], bins=num_lat_bands, labels=False)
    df['lon_band'] = pd.cut(df['LONGITUDE'], bins=num_lon_bands, labels=False)
    df['region'] = df['lat_band'].astype(str) + "-" + df['lon_band'].astype(str)
    return df


def handle_query(user_query: str):
    initialize_data_service()
    # 1️⃣ Parse user query
    params = parse_user_query_with_gemini(user_query)

    # Check if years are unavailable
    if 'unavailable_years' in params:
        return {
            "text": params['unavailable_years'],
            "data": {"records": [], "rows": 0},
            "plots": [],
            "map": None,
            "metadata": {"source": "ARGO Conversational System (MVP)", "version": "0.1"}
        }

    # 2️⃣ Load CSV
    try:
        df = pd.read_csv(CSV_PATH)
    except Exception as e:
        print("⚠️ Failed to load ARGO CSV:", e)
        return {
            "data": {"records": [], "rows": 0},
            "text": "No ARGO data could be loaded.",
            "map": None,
            "plots": [],
            "metadata": {"source": "ARGO Conversational System (MVP)", "version": "0.1"}
        }

    # 3️⃣ Filter based on user query
    df = df[
        (df["LATITUDE"] >= params["lat_range"][0]) &
        (df["LATITUDE"] <= params["lat_range"][1]) &
        (df["LONGITUDE"] >= params["lon_range"][0]) &
        (df["LONGITUDE"] <= params["lon_range"][1]) &
        (df["PRES"] >= params["depth_range"][0]) &
        (df["PRES"] <= params["depth_range"][1])
    ].copy()

    # Add time filtering if year range is specific
    if params["year_range"][0] != "2010-01-01" or params["year_range"][1] != "2020-12-31":
        df['TIME'] = pd.to_datetime(df['TIME'], errors='coerce')
        start_date = pd.to_datetime(params["year_range"][0])
        end_date = pd.to_datetime(params["year_range"][1])
        df = df[(df['TIME'] >= start_date) & (df['TIME'] <= end_date)]
        # Filter by month if specific month is requested
        if params.get("month") and 'TIME' in df.columns:
            df = df[df['TIME'].dt.month == params["month"]]
        # Remove temporary TIME column if added
        if 'TIME' in df.columns:
            df = df.drop(columns=['TIME'])

    if df.empty:
        return {
            "data": {"records": [], "rows": 0},
            "text": "No ARGO data found for your specific location in the current dataset. The dataset covers global oceans but may be sparse in some regions. Available data periods: 2010. Try broader region or different coordinates.",
            "map": None,
            "plots": [],
            "metadata": {"source": "ARGO Conversational System (MVP)", "version": "0.1"}
        }

    # 4️⃣ ML-based cleaning
    cleaned_df = ml_clean_argo_data(df)

    # 5️⃣ Assign dynamic regions for visualization
    cleaned_df = assign_dynamic_region(cleaned_df)

    # 6️⃣ Full cleaned data for frontend table / map
    cleaned_json_full = cleaned_df.to_dict(orient="records")

    # 7️⃣ Sample for LLM summary
    sample_for_llm = cleaned_df.sample(
        n=min(len(cleaned_df), LLM_SAMPLE_SIZE),
        random_state=42
    ).to_dict(orient="records")

    # 8️⃣ Generate LLM summary
    summary_text = generate_summary(user_query, sample_for_llm)

    # 9️⃣ Aggregate for bar/pie plots
    # Example: average temperature and salinity per region
    plot_df = cleaned_df.groupby('region').agg(
        avg_temp=('TEMP', 'mean'),
        avg_psal=('PSAL', 'mean')
    ).reset_index()

    plots = [
        {"region": row['region'], "avg_temp": row['avg_temp'], "avg_psal": row['avg_psal']}
        for _, row in plot_df.iterrows()
    ]

    # 🔟 Store query + response in MongoDB
    doc = {
        "query": user_query,
        "response": summary_text,
        "cleaned_rows": len(cleaned_json_full),
        "timestamp": datetime.utcnow()
    }
    try:
        db = get_db()
        if db is not None:
            db['queries'].insert_one(doc)
        else:
            print("ℹ️ MongoDB not available, skipping query logging")
    except Exception as e:
        print("⚠️ Failed to insert document into MongoDB:", e)

    # 1️⃣1️⃣ Return structured JSON
    return {
        "text": summary_text,
        "data": {"records": cleaned_json_full, "rows": len(cleaned_json_full)},
        "plots": plots,
        "map": None,
        "metadata": {"source": "ARGO Conversational System (MVP)", "version": "0.1"}
    }
