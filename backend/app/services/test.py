import time
import argopy

def fetch_with_retry(region_params, retries=5, delay=5):
    for i in range(retries):
        try:
            ds = argopy.DataFetcher().region(region_params).to_xarray()
            return ds
        except Exception as e:
            print(f"⚠️ Attempt {i+1} failed: {e}")
            time.sleep(delay)
    return None

region = [-60, -50, 30, 40, 0, 1000, "2020-01-01", "2021-01-01"]
ds = fetch_with_retry(region)
if ds is None:
    print("❌ Failed to fetch ARGO data after multiple retries")
else:
    df = ds.to_dataframe().reset_index()
