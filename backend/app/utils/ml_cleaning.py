import pandas as pd
import numpy as np

try:
    from sklearn.ensemble import IsolationForest
    from sklearn.impute import KNNImputer
    sklearn_available = True
except ImportError:
    sklearn_available = False
    print("sklearn not installed, using basic pandas cleaning")

def ml_clean_argo_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    ML-based cleaning for ARGO float data:
    - Detect and remove outliers
    - Fill missing values
    """
    df = df.copy()

    # Keep relevant columns, but TIME might be dropped if already filtered
    cols_to_keep = ["lon", "lat", "pressure", "temperature", "salinity"]
    if "time" in df.columns:
        cols_to_keep.append("time")
    df = df[cols_to_keep]

    numeric_cols = ["pressure", "temperature", "salinity"]

    if sklearn_available:
        # 1️⃣ Handle missing values with KNN imputer
        imputer = KNNImputer(n_neighbors=5)
        df[numeric_cols] = imputer.fit_transform(df[numeric_cols])

        # 2️⃣ Detect outliers using Isolation Forest
        iso = IsolationForest(contamination=0.01, random_state=42)
        df["outlier_flag"] = iso.fit_predict(df[numeric_cols])

        # Keep only non-outliers
        df_clean = df[df["outlier_flag"] == 1].drop(columns=["outlier_flag"])
    else:
        # Fallback: simple mean imputation and remove NaN rows
        df_clean = df.fillna(df.mean(numeric_only=True))
        df_clean = df_clean.dropna()

    # 3️⃣ Optional: round numeric values for consistency
    for col, decimals in [("temperature", 2), ("salinity", 2), ("pressure", 1)]:
        df_clean[col] = df_clean[col].round(decimals)

    df_clean.reset_index(drop=True, inplace=True)
    return df_clean
