import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.impute import KNNImputer

def ml_clean_argo_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    ML-based cleaning for ARGO float data:
    - Detect and remove outliers
    - Fill missing values
    """
    df = df.copy()

    # Keep relevant columns
    cols_to_keep = ["TIME", "LONGITUDE", "LATITUDE", "PRES", "TEMP", "PSAL"]
    df = df[cols_to_keep]

    # 1️⃣ Handle missing values with KNN imputer
    numeric_cols = ["PRES", "TEMP", "PSAL"]
    imputer = KNNImputer(n_neighbors=5)
    df[numeric_cols] = imputer.fit_transform(df[numeric_cols])

    # 2️⃣ Detect outliers using Isolation Forest
    iso = IsolationForest(contamination=0.01, random_state=42)
    df["outlier_flag"] = iso.fit_predict(df[numeric_cols])

    # Keep only non-outliers
    df_clean = df[df["outlier_flag"] == 1].drop(columns=["outlier_flag"])

    # 3️⃣ Optional: round numeric values for consistency
    for col, decimals in [("TEMP", 2), ("PSAL", 2), ("PRES", 1)]:
        df_clean[col] = df_clean[col].round(decimals)

    df_clean.reset_index(drop=True, inplace=True)
    return df_clean
