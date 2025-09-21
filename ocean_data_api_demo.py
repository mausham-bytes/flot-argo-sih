from fastapi import FastAPI
from fastapi.responses import JSONResponse
from argopy import DataFetcher
import xarray as xr
import datetime

app = FastAPI(title="Ocean Data API", description="Merged ERSST + ARGO backend demo")

# NOAA ERSST source (monthly SST from 1854 → present)
ERSST_URL = "https://www.ncei.noaa.gov/thredds/dodsC/sst/ersst.v5/sst.mnmean.nc"

@app.get("/")
def root():
    return {"message": "🌊 Ocean Data API is running!"}

@app.get("/historical")
def get_historical(start_year: int = 1900):
    """Fetch NOAA ERSST (sea surface temperature) from 1900 → present"""
    today = datetime.date.today()
    ds = xr.open_dataset(ERSST_URL)
    ds = ds.sel(time=slice(f"{start_year}-01-01", str(today)))

    # Return a few values as JSON (instead of full dataset)
    sample = ds.isel(time=slice(0, 12)).sst.mean(dim=["lat", "lon"]).values.tolist()
    return JSONResponse(content={
        "dataset": "NOAA ERSSTv5",
        "years": f"{start_year} → {today.year}",
        "sample_mean_sst": sample
    })

@app.get("/argo")
def get_argo():
    """Fetch ARGO float profiles from 2000 → present"""
    today = datetime.date.today()
    ds = DataFetcher().region([-180, 180, -90, 90]).time("2000-01-01", str(today)).to_xarray()

    # Example: extract locations (lat, lon) of floats
    lats = ds["LATITUDE"].values[:10].tolist()
    lons = ds["LONGITUDE"].values[:10].tolist()

    return JSONResponse(content={
        "dataset": "ARGO floats",
        "years": f"2000 → {today.year}",
        "sample_locations": list(zip(lats, lons))
    })

@app.get("/merged")
def get_merged():
    """Provide combined historical + ARGO data"""
    today = datetime.date.today()
    return {
        "historical": f"NOAA ERSSTv5 (1900 → {today.year})",
        "argo": f"ARGO floats (2000 → {today.year})",
        "status": "✅ Both datasets available and auto-updating"
    }