# utils/data_cleaning.py
import pandas as pd

def clean_argo_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Basic cleaning for ARGO float data
    - Drop NaNs
    - Keep only relevant columns
    - Reset index
    """

    # Keep only common variables
    cols_to_keep = ["TIME", "LONGITUDE", "LATITUDE", "PRES", "TEMP", "PSAL"]
    df = df[cols_to_keep].dropna()

    # Reset index
    df = df.reset_index(drop=True)

    return df
