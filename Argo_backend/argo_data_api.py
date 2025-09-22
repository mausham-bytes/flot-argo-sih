#!/usr/bin/env python3
"""
FastAPI Service for On-Demand ARGO Data Fetching

Provides a REST API endpoint to fetch ARGO float data for any given year.
Uses argopy DataFetcher with ERDDAP source for faster time queries.

Endpoint: GET /fetch_argo?year=2015
Returns: JSON containing ARGO profile data or error message

Usage:
    uvicorn argo_data_api:app --reload --host 0.0.0.0 --port 8001

Rate Limited: 5 requests per minute per IP
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import time

import xarray as xr
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

try:
    from argopy import DataFetcher as ArgoDataFetcher
except ImportError:
    raise ImportError("argopy not installed. Run: pip install argopy")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ARGO Data API",
    description="Fetch ARGO float data for any given year using FastAPI and argopy",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting setup (5 requests per minute per IP)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "ARGO Data API", "endpoint": "/fetch_argo?year={year}"}

@app.get("/fetch_argo")
@limiter.limit("5/minute")
async def fetch_argo(request: Request, year: int = Query(..., description="Year to fetch ARGO data for (e.g., 2015)")):
    """
    Fetch ARGO profiles for the specified year.

    - **year**: Year in YYYY format (e.g., 2015)

    Returns JSON with profile data including lat/lon coordinates, temperatures, salinity, etc.
    """
    logger.info(f"Fetching ARGO data for year {year}")

    # Validate year (reasonable range)
    if year < 2000 or year > datetime.now().year:
        raise HTTPException(status_code=400, detail=f"Year {year} is out of valid range (2000 to current year)")

    # Fetch data with retries
    ds = await fetch_argo_data_with_retries(year)

    if ds is None:
        # No data available for this year
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "year": year,
                "data_available": False,
                "message": f"No ARGO data available for year {year}",
                "profiles": []
            }
        )

    # Transform and return data
    try:
        profiles_json = transform_dataset_to_json(ds, year)
        logger.info(f"Successfully processed {len(profiles_json)} profiles for year {year}")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "year": year,
                "data_available": True,
                "profile_count": len(profiles_json),
                "profiles": profiles_json
            }
        )

    except Exception as e:
        logger.error(f"Error transforming data for year {year}: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing ARGO data: {str(e)}")

async def fetch_argo_data_with_retries(year: int, max_retries: int = 3) -> Optional[xr.Dataset]:
    """
    Fetch ARGO data using argopy DataFetcher with ERDDAP source and retries.
    """
    for attempt in range(max_retries):
        try:
            logger.info(f"Fetching ARGO data for year {year} (attempt {attempt+1}/{max_retries})")

            # Use ERDDAP for faster time queries
            argo = (
                ArgoDataFetcher(src='erddap')
                .region([-180, 180, -90, 90])  # Global
                .date(f'{year}-01-01', f'{year}-12-31')  # Full year
            )

            # Load data asynchronously
            argo.load()
            ds = argo.to_xarray()

            # Check if we got any profiles
            if 'N_PROF' not in ds.coords or len(ds.coords['N_PROF']) == 0:
                logger.warning(f"No profiles returned for year {year}")
                return None

            logger.info(f"Successfully fetched {len(ds.coords['N_PROF'])} profiles for year {year}")
            return ds

        except Exception as e:
            logger.warning(f"Attempt {attempt+1} failed for year {year}: {e}")
            if attempt < max_retries - 1:
                # Exponential backoff
                sleep_time = 2 ** attempt
                logger.info(f"Retrying in {sleep_time} seconds...")
                await asyncio.sleep(sleep_time)
            else:
                logger.error(f"Failed to fetch data for year {year} after {max_retries} attempts")

    return None

def transform_dataset_to_json(ds: xr.Dataset, year: int) -> List[Dict[str, Any]]:
    """
    Transform xarray Dataset to JSON format with profiles containing lat/lon lists.
    """
    profiles = []

    # Get number of profiles
    n_profiles = len(ds.coords['N_PROF'])

    for profile_idx in range(n_profiles):
        try:
            profile = ds.isel(N_PROF=profile_idx)

            # Extract basic metadata
            wmo_id = int(profile.PLATFORM_NUMBER.values) if hasattr(profile, 'PLATFORM_NUMBER') else None
            latitude = float(profile.LATITUDE.values)
            longitude = float(profile.LONGITUDE.values)
            juld = profile.JULD.values  # Julian day
            date = pd.to_datetime(str(juld)).replace(tzinfo=None) if not np.isnan(juld) else None

            # Extract measurements (arrays)
            pres = profile.PRES.values  # Pressure (depth)
            temp = profile.TEMP.values  # Temperature
            psal = profile.PSAL.values  # Salinity

            # Handle oxygen if available
            oxygen = None
            if 'DOXY' in ds.data_vars and not np.isnan(profile.DOXY.values).all():
                oxygen = profile.DOXY.values

            # Create measurement lists, filtering out NaN
            depths = []
            temperatures = []
            salinities = []
            oxygens = []

            for level_idx in range(len(pres)):
                if (not np.isnan(pres[level_idx]) and
                    not np.isnan(temp[level_idx]) and
                    not np.isnan(psal[level_idx])):

                    depths.append(float(pres[level_idx]))
                    temperatures.append(float(temp[level_idx]))
                    salinities.append(float(psal[level_idx]))

                    if oxygen is not None and not np.isnan(oxygen[level_idx]):
                        oxygens.append(float(oxygen[level_idx]))
                    else:
                        oxygens.append(None)

            # Create profile dictionary
            profile_data = {
                "wmo_id": wmo_id,
                "latitude": latitude,
                "longitude": longitude,
                "date": date.isoformat() if date else None,
                "measurements": {
                    "depths": depths,  # Pressure in dbar ≈ depth in meters
                    "temperatures": temperatures,  # °C
                    "salinities": salinities,  # PSU
                    "oxygen": oxygens  # Optional, μmol/kg
                },
                "level_count": len(depths)
            }

            profiles.append(profile_data)

        except Exception as e:
            logger.error(f"Error processing profile {profile_idx}: {e}")
            continue

    return profiles

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)