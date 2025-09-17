# # services/query_service.py
# from db.mongo_client import queries_collection
# from datetime import datetime
# import argopy
# from services.llm_service import generate_summary
# from utils.ml_cleaning import ml_clean_argo_data
# import pandas as pd

# LLM_SAMPLE_SIZE = 200  # Limit to 100–200 rows

# # Map user variables to ERDDAP variable names
# VARIABLE_MAP = {
#     "TEMP": "temperature",
#     "PSAL": "salinity",
#     "PRES": "pressure"
# }

# def parse_user_query_with_gemini(user_query: str):
#     """
#     Extract ARGO query parameters from user query using LLM.
#     Returns default ranges if parsing fails.
#     """
#     return {
#         "lat_range": [0, 90],
#         "lon_range": [-180, 180],
#         "depth_range": [0, 2000],
#         "year_range": ["2010-01-01", "2020-12-31"],
#         "variables": ["TEMP", "PSAL", "PRES"]
#     }

# def handle_query(user_query: str):
#     """
#     Handle a user query:
#     1. Parse query parameters
#     2. Fetch ARGO data (limited to small subset)
#     3. ML-clean the data
#     4. Sample 100–200 rows for LLM summary
#     5. Generate LLM summary
#     6. Store query + summary + cleaned data length in MongoDB
#     7. Return cleaned JSON for frontend
#     """

#     # 1️⃣ Parse query parameters
#     params = parse_user_query_with_gemini(user_query)
#     variables = [VARIABLE_MAP.get(v, v) for v in params["variables"]]

#     # 2️⃣ Fetch ARGO data with timeout and small region/time for performance
#     try:
#         ds = argopy.DataFetcher().region([
#             params["lon_range"][0], params["lon_range"][1],
#             params["lat_range"][0], params["lat_range"][1],
#             params["depth_range"][0], params["depth_range"][1],
#             params["year_range"][0], params["year_range"][1]
#         ]).to_xarray()

#         df = ds[variables].to_dataframe().reset_index()
#     except Exception as e:
#         print("⚠️ Failed to fetch ARGO data:", e)
#         return {
#             "text": "No ARGO data could be fetched for your query.",
#             "cleaned_data": [],
#             "rows": 0,
#             "plots": [],
#             "map": None,
#             "metadata": {
#                 "source": "ARGO Conversational System (MVP)",
#                 "version": "0.1"
#             }
#         }

#     # 3️⃣ ML-based cleaning
#     cleaned_df = ml_clean_argo_data(df)

#     # 4️⃣ Keep full cleaned data for frontend (limit to 200 rows max)
#     cleaned_json_full = cleaned_df.head(LLM_SAMPLE_SIZE).to_dict(orient="records")

#     # 5️⃣ Sample 100–200 rows for LLM summary
#     sample_for_llm = cleaned_df.sample(
#         n=min(len(cleaned_df), LLM_SAMPLE_SIZE),
#         random_state=42
#     ).to_dict(orient="records")

#     # 6️⃣ Generate LLM summary using sample
#     summary = generate_summary(user_query, sample_for_llm)

#     # 7️⃣ Store in MongoDB
#     doc = {
#         "query": user_query,
#         "response": summary,
#         "cleaned_rows": len(cleaned_json_full),
#         "timestamp": datetime.utcnow()
#     }
#     queries_collection.insert_one(doc)

#     # 8️⃣ Return structured JSON
#     return {
#         "text": summary,
#         "cleaned_data": cleaned_json_full,
#         "rows": len(cleaned_json_full),
#         "plots": [],
#         "map": None,
#         "metadata": {
#             "source": "ARGO Conversational System (MVP)",
#             "version": "0.1"
#         }
#     }

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
    queries_collection.insert_one(doc)

    # 1️⃣1️⃣ Return structured JSON
    return {
        "text": summary_text,
        "data": {"records": cleaned_json_full, "rows": len(cleaned_json_full)},
        "plots": plots,
        "map": None,
        "metadata": {"source": "ARGO Conversational System (MVP)", "version": "0.1"}
    }
