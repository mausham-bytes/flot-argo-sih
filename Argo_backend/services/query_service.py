# services/query_service.py
# services/query_service.py
from db.mongo_client import queries_collection
from datetime import datetime
import pandas as pd
import numpy as np
from services.llm_service import generate_summary
from utils.ml_cleaning import ml_clean_argo_data
import os

LLM_SAMPLE_SIZE = 200  # Rows for LLM
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "data", "argo_sample_data.csv")


def parse_user_query_with_gemini(user_query: str):
    """
    Placeholder parser - returns default ranges if parsing fails.
    """
    return {
        "lat_range": [-90, 90],
        "lon_range": [-180, 180],
        "depth_range": [0, 2000],
        "year_range": ["2010-01-01", "2020-12-31"],
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
    # 1️⃣ Parse user query
    params = parse_user_query_with_gemini(user_query)

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

    if df.empty:
        return {
            "data": {"records": [], "rows": 0},
            "text": "No ARGO data found for your query.",
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
        queries_collection.insert_one(doc)
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
