import time
import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
import xarray as xr
import numpy as np
from argopy import DataFetcher

app = FastAPI(title="Enhanced Ocean Data API", description="Merged ERSST + ARGO backend with caching and querying")

# NOAA ERSST source (monthly SST from 1854 → present)
ERSST_URL = "https://www.ncei.noaa.gov/thredds/dodsC/sst/ersst.v5/sst.mnmean.nc"

# Simple in-memory cache to avoid re-fetching (use Redis/Redis for production)
cache = {}

@app.get("/")
def root():
    return {"message": "🌊 Enhanced Ocean Data API is running! Auto-updates from NOAA + ARGO."}

@app.get("/historical")
def get_historical(
    start_year: int = Query(1900, ge=1854, le=datetime.date.today().year),
    end_year: int = None,
    export: bool = False
):
    """Fetch NOAA ERSST SST data with optional anomaly calculation and export."""
    try:
        cache_key = f"ersst_{start_year}_{end_year or datetime.date.today().year}"
        if cache_key in cache:
            ds = cache[cache_key]
        else:
            start_time = time.time()
            ds = xr.open_dataset(ERSST_URL)
            end_date = str(datetime.date.today() if end_year is None else datetime.date(end_year, 12, 31))
            ds = ds.sel(time=slice(f"{start_year}-01-01", end_date))
            cache[cache_key] = ds  # Cache the dataset
            print(".2f")

        # Calculate global mean SST and anomalies
        mean_sst = ds.sst.mean(dim=["lat", "lon"])
        climatology = mean_sst.groupby("time.month").mean()
        anomalies = mean_sst.groupby("time.month") - climatology

        sample_anomalies = anomalies.isel(time=slice(0, 12)).values.tolist()

        if export:
            # Export to NetCDF (or CSV for simplicity)
            filename = f"ersst_{start_year}_{end_year or datetime.date.today().year}.nc"
            ds.to_netcdf(filename)
            return FileResponse(filename, media_type='application/octet-stream', filename=filename)

        return JSONResponse(content={
            "dataset": "NOAA ERSSTv5",
            "years": f"{start_year} → {end_year or datetime.date.today().year}",
            "sample_anomalies": sample_anomalies,
            "global_mean_sst": mean_sst.mean().values.item()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ERSST: {str(e)}")

@app.get("/argo")
def get_argo(
    region: str = Query("global", regex="^(global|atlantic|atlantic_w|atlantic_e|indian|pacific|arctic|southern)$"),
    start_date: str = "2002-01-01",
    export: bool = False
):
    """Fetch ARGO float data with spatial querying and optional export."""
    try:
        cache_key = f"argo_{region}_{start_date}"
        if cache_key in cache:
            ds = cache[cache_key]
        else:
            start_time = time.time()
            # Define regions mapping for spatial queries
            regions = {
                "global": [-180, 180, -90, 90],
                "atlantic": [-70, -15, 0, 60],
                "atlantic_w": [-70, -45, 0, 60],
                "atlantic_e": [-45, -15, 0, 60],
                "indian": [20, 120, -65, 30],
                "pacific": [120, -70, -65, 70],
                "arctic": [-180, 180, 65, 90],
                "southern": [-180, 180, -90, -50]
            }
            min_lon, max_lon, min_lat, max_lat = regions[region]
            today = datetime.date.today()
            ds = DataFetcher().region([min_lon, max_lon, min_lat, max_lat]).time(start_date, str(today)).to_xarray()
            cache[cache_key] = ds  # Cache the dataset
            print(".2f")

        # Extract sample profiles (temperature at surface)
        temp_surface = ds["TEMP"].isel(N_LEVELS=0).values[:10].tolist() if "TEMP" in ds.data_vars and len(ds["TEMP"].dims) > 0 else []
        locations = list(zip(ds["LATITUDE"].values[:10].tolist(), ds["LONGITUDE"].values[:10].tolist()))

        if export:
            filename = f"argo_{region}_{start_date}.csv"
            # Convert to pandas for CSV export (simulate)
            ds_pd = ds.to_pandas() if hasattr(ds, 'to_pandas') else ds
            # For demo, create sample CSV
            with open(filename, 'w') as f:
                f.write("latitiude,longitude,surface_temp\n")
                for i in range(min(10, len(locations))):
                    f.write(f"{locations[i][0]}, {locations[i][1]}, {temp_surface[i] if i < len(temp_surface) else 'N/A'}\n")
            return FileResponse(filename, media_type='text/csv', filename=filename)

        return JSONResponse(content={
            "dataset": "ARGO floats",
            "region": region,
            "years": f"{start_date[:4]} → {today.year}",
            "sample_temp_surface": temp_surface,
            "sample_locations": locations,
            "total_floats_in_region": int(ds.argo_float.size) if "argo_float" in ds.dims else 0
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ARGO: {str(e)}")

@app.get("/merged")
def get_merged(
    query_year: int = Query(None),
    region: str = "global"
):
    """Merge datasets: Use ERSST for pre-2002, ARGO for 2002+, with computed summaries."""
    try:
        today = datetime.date.today()
        if query_year is None or query_year < 2002:
            # Use ERSST for historical (pre-2002)
            target_year = query_year or 2001
            ersst_response = get_historical(
                start_year=max(target_year, 1854),
                end_year=min(target_year, 2001) if not query_year else target_year
            )
            return {
                "source": "ERSST (pre-2002)",
                "data": ersst_response.body,
                "merged_note": "For 2002+, switch to /argo endpoint or specify year >= 2002."
            }
        else:
            # Use ARGO for modern (2002+)
            argo_response = get_argo(region=region, start_date=f"{query_year}-01-01")
            return {
                "source": "ARGO (2002+)",
                "data": argo_response.body,
                "merged_note": "Auto-selected based on query_year. Use /argo for more options."
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error merging: {str(e)}")

@app.get("/clear_cache")
def clear_cache():
    """Clear in-memory cache to free RAM."""
    global cache
    cache.clear()
    return {"message": "Cache cleared.", "items_removed": len(cache)}

@app.get("/status")
def get_status():
    """Check API status and cached data."""
    today = datetime.date.today()
    return {
        "api_status": "running",
        "cache_entries": len(cache),
        "supported_datasets": {
            "NOAA_ErSST": f"1854 → {today.year} (Sea surface temperature)",
            "ARGO_floats": f"2002 → {today.year} (Temperature, salinity profiles)"
        },
        "supported_regions": ["global", "atlantic", "atlantic_w", "atlantic_e", "indian", "pacific", "arctic", "southern"],
        "last_checked": datetime.datetime.now().isoformat()
    }