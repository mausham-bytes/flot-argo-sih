# services/query_service.py
from db.mongo_client import queries_collection
from datetime import datetime
import pandas as pd
from services.llm_service import generate_summary
from utils.ml_cleaning import ml_clean_argo_data
import os

LLM_SAMPLE_SIZE = 200  # Number of rows to send to LLM
CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/argo_sample_data.csv")

def parse_user_query_with_gemini(user_query: str):
    """
    Extract query parameters from user query using LLM.
    Returns default ranges if parsing fails.
    """
    # Placeholder for structured parsing; expand with LLM later
    return {
        "lat_range": [-90, 90],
        "lon_range": [-180, 180],
        "depth_range": [0, 2000],
        "year_range": ["2010-01-01", "2020-12-31"],
        "variables": ["TEMP", "PSAL", "PRES"]
    }

def handle_query(user_query: str):
    """
    Handle a user query:
    1. Parse query parameters
    2. Load local CSV as ARGO dataset
    3. ML-clean the data
    4. Sample 100-200 rows for LLM summary
    5. Generate LLM summary
    6. Store query + summary + cleaned data length in MongoDB
    7. Return cleaned JSON for frontend
    """
    # 1️⃣ Parse query parameters
    params = parse_user_query_with_gemini(user_query)

    # 2️⃣ Load CSV
    try:
        df = pd.read_csv(CSV_PATH)
    except Exception as e:
        print("⚠️ Failed to load local ARGO CSV:", e)
        return {
            "map": None,
            "metadata": {"source": "ARGO Conversational System (MVP)", "version": "0.1"},
            "plots": [],
            "text": "No ARGO data could be loaded for your query."
        }

    # 3️⃣ Filter based on query parameters
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
            "map": None,
            "metadata": {"source": "ARGO Conversational System (MVP)", "version": "0.1"},
            "plots": [],
            "text": "No ARGO data could be found for your query."
        }

    # 4️⃣ ML-based cleaning
    cleaned_df = ml_clean_argo_data(df)

    # 5️⃣ Keep full cleaned data for frontend
    cleaned_json_full = cleaned_df.to_dict(orient="records")

    # 6️⃣ Sample 100-200 rows for LLM summary
    sample_for_llm = cleaned_df.sample(
        n=min(len(cleaned_df), LLM_SAMPLE_SIZE),
        random_state=42
    ).to_dict(orient="records")

    # 7️⃣ Generate LLM summary using sample
    summary = generate_summary(user_query, sample_for_llm)

    # 8️⃣ Store in MongoDB
    doc = {
        "query": user_query,
        "response": summary,
        "cleaned_rows": len(cleaned_json_full),
        "timestamp": datetime.utcnow()
    }
    try:
        queries_collection.insert_one(doc)
    except Exception as e:
        print("⚠️ Failed to insert document into MongoDB:", e)

    # 9️⃣ Return structured JSON
    return {
        "text": summary,
        "cleaned_data": cleaned_json_full,
        "rows": len(cleaned_json_full)
    }
