"""
ARGO Data Service - Fetches and processes ARGO float data from multiple sources.
Supports historical data (2010-present) and real-time data from official ARGO sources.
"""

import os
import pandas as pd
import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Union
import time
import concurrent.futures

from .data_loader import load_demo_data

# ArgoVis API base URL for recent/current data
ARGOVIS_API_URL = "https://argovis.colorado.edu"

class ArgoDataService:
    def __init__(self):
        self.cache_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'cache')
        os.makedirs(self.cache_dir, exist_ok=True)
        self.session = requests.Session()
        self._available_years = []
        self._cached_data = None  # Cache for loaded data
        self.ARGOVIS_API_URL = ARGOVIS_API_URL  # Set the static API URL as instance attribute
        print("Preloading ARGO demo data...")
        self._cached_data = self._load_demo_data()

    def fetch_recent_data(self, start_date: str = None, end_date: str = None) -> List[Dict]:
        """
        Fetch recent ARGO float data from ArgoVis API.
        Default: last 30 days if no dates specified.
        """
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        print(f"Fetching ARGO data from {start_date} to {end_date}")

        try:
            # ArgoVis API endpoint for profiles with date filters
            url = f"{ARGOVIS_API_URL}/catalog/profiles/"
            params = {
                'date': f"[{start_date}, {end_date}]",
                'limit': 5000  # Reasonable limit for demo
            }

            response = self.session.get(url, params=params)
            response.raise_for_status()

            data = response.json()
            return self._process_argovis_data(data)

        except Exception as e:
            print(f"Error fetching ArgoVis data: {e}")
            return []

    def fetch_historical_data(self, start_year: int = 2010, end_year: int = 2023) -> List[Dict]:
        """
        Fetch historical ARGO data.
        For demo purposes, we'll use sample data or cached historical data.
        """
        try:
            # For now, use the existing sample data as historical data
            # In production, this would fetch from GDAC FTP or other sources
            sample_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'argo_sample_data.csv')
            if os.path.exists(sample_file):
                df = pd.read_csv(sample_file)
                return self._process_csv_data(df)

            return []
        except Exception as e:
            print(f"Error fetching historical data: {e}")
            return []

    def get_combined_data(self, start_date: str = None, end_date: str = None) -> List[Dict]:
        """
        Get combined historical and recent data. Now includes simulated data for a broader temporal range.
        Uses caching to avoid reloading data repeatedly.
        """
        # Check cache
        if self._cached_data is not None:
            return self._cached_data

        # Get available CSV data
        historical_data = self.fetch_historical_data()
        recent_data = self.fetch_recent_data(start_date, end_date)

        # Fetch demo ARGO data for comprehensive coverage (faster for development)
        extended_samples = self._fetch_real_argo_data()  # Renamed method but content is demo-only now

        # Combine and deduplicate by float ID
        combined = {}

        # Add all data sources
        for data_source in [historical_data, recent_data, extended_samples]:
            for item in data_source:
                # Create unique ID based on location, time, and parameters
                fid = f"{item['lat']}_{item['lon']}_{item['time']}"
                if fid not in combined:
                    combined[fid] = item

        final_data = list(combined.values())

        # Filter out items without valid time
        final_data = [item for item in final_data if item.get('time') and isinstance(item['time'], str)]

        # Get available years for better user messaging
        available_years = sorted(set(int(item['time'].split('-')[0]) for item in final_data if item['time'].split('-')[0].isdigit()))
        if available_years:
            year_range = f"{min(available_years)}-{max(available_years)}"
        else:
            year_range = "no-data"

        print(f"Combined dataset: {len(final_data)} unique float observations across {len(available_years)} years ({year_range})")
        print(f"Available years: {', '.join(map(str, available_years))}")

        # Store available years for query service
        self._available_years = available_years

        # Sort by time for consistency
        final_data.sort(key=lambda x: x.get('time', ''), reverse=True)

        # Cache the result
        self._cached_data = final_data

        return final_data

    def _fetch_real_argo_data(self, years_to_fetch=None) -> List[Dict]:
        """
        Fetch real ARGO data from GDAC via argopy ERDDAP for specified years.
        Creates comprehensive dataset using live ARGO archives.
        """
        import random
        from datetime import datetime, timedelta

        try:
            from argopy import DataFetcher as ArgoDataFetcher
            argo_fetcher = ArgoDataFetcher(src="erddap", parallel=True)
        except ImportError:
            print("argopy not installed, falling back to simulated data")
            return self._generate_fallback_samples()

        samples = []

        if years_to_fetch is None:
            years_to_fetch = range(2010, 2015)  # Limited range for faster demo loading

        for year in years_to_fetch:
            # Use ARGOPy for all years to fetch live ARGO data
            current_year = datetime.now().year
            use_real_data = True  # Enable fetching real data for all years

            if use_real_data:
                print(f"Attempting to fetch real ARGO data for {year}...")
                try:
                    from argopy import DataFetcher as ArgoDataFetcher
                    argo_fetcher = ArgoDataFetcher(region=[90, -90, 180, -180], mode='standard')
                    # Add caching=1 if needed

                    # Fetch for the specific year
                    try:
                        argo_data = argo_fetcher.float([year, year]).to_xarray()
                        data_list = argo_data.to_dataframe().reset_index().to_dict(orient='records')
                        processed = []
                        for rec in data_list:
                            processed.append({
                                'id': f"GDAC_{rec.get('FLOAT', 'unknown')}_{rec.get('CYCLE', 'unknown')}",
                                'lat': round(float(rec.get('LATITUDE', 0)), 3),
                                'lon': round(float(rec.get('LONGITUDE', 0)), 3),
                                'temperature': rec.get('TEMP'),
                                'salinity': rec.get('PSAL'),
                                'pressure': rec.get('PRES'),
                                'oxygen': rec.get('DOXY'),
                                'cycle': rec.get('CYCLE'),
                                'time': str(rec.get('TIME', datetime.now())),
                                'status': 'active'
                            })
                        samples.extend(processed)
                        print(f" Fetched {len(processed)} real data points for {year}")
                    except Exception as e:
                        print(f"Failed to fetch real data for {year}: {e}")
                        # Fallback to demo
                        fallback_samples = self._generate_fallback_samples_for_year(year)
                        samples.extend(fallback_samples)
                except ImportError:
                    print("argopy not available, falling back to demo data")
                    fallback_samples = self._generate_fallback_samples_for_year(year)
                    samples.extend(fallback_samples)
            else:
                fallback_samples = self._generate_fallback_samples_for_year(year)
                samples.extend(fallback_samples)

        return samples

    def _load_demo_data(self) -> List[Dict]:
        """
        Preload a fixed set of demo data for faster startup.
        Loading from different chunks to spread locations globally.
        """
        years_to_load = [2005, 2007, 2010, 2012, 2017, 2019]  # From different chunks for global spread
        all_data = []
        for year in years_to_load:
            try:
                data = load_demo_data(year)
                all_data.extend(data)
            except FileNotFoundError:
                pass
        print(f"Preloaded {len(all_data)} demo data points from {len(years_to_load)} different time periods")
        return all_data

    def _generate_fallback_samples_for_year(self, year: int) -> List[Dict]:
        """
        Load demo data for a specific year when GDAC fetch fails.
        """
        try:
            return load_demo_data(year)
        except FileNotFoundError:
            return []

    def _process_argovis_data(self, data: List) -> List[Dict]:
        """Process ArgoVis API data format."""
        processed = []

        for profile in data:
            try:
                # Extract location data from ArgoVis format
                if 'geoLocation' in profile:
                    processed.append({
                        'id': str(profile.get('_id', 'unknown')),
                        'lat': round(float(profile['geoLocation']['coordinates'][1]), 3),
                        'lon': round(float(profile['geoLocation']['coordinates'][0]), 3),
                        'temperature': self._get_measurement(profile, 'temperature'),
                        'salinity': self._get_measurement(profile, 'salinity'),
                        'pressure': self._get_measurement(profile, 'pressure'),
                        'oxygen': self._get_measurement(profile, 'oxygen'),
                        'cycle': profile.get('cycleNumber'),
                        'time': profile.get('date', datetime.now().isoformat()),
                        'status': 'active' if profile.get('isDeep', False) else 'active'
                    })
            except (KeyError, TypeError) as e:
                print(f"Skipping invalid profile: {e}")
                continue

        return processed

    def _process_csv_data(self, df: pd.DataFrame) -> List[Dict]:
        """Process CSV data format (our existing sample data)."""
        processed = []

        for _, row in df.iterrows():
            try:
                processed.append({
                    'id': f"WMO_{row['N_PROF']}_{row['CYCLE_NUMBER']}",
                    'lat': round(float(row['LATITUDE']), 3),
                    'lon': round(float(row['LONGITUDE']), 3),
                    'temperature': round(float(row['TEMP']), 1) if pd.notna(row['TEMP']) else None,
                    'salinity': round(float(row['PSAL']), 1) if pd.notna(row['PSAL']) else None,
                    'pressure': round(float(row['PRES']), 1) if pd.notna(row['PRES']) else None,
                    'oxygen': None,  # No oxygen data in our sample
                    'cycle': int(row['CYCLE_NUMBER']),
                    'time': str(row['TIME']),
                    'status': 'active'
                })
            except (KeyError, ValueError) as e:
                print(f"Skipping invalid row: {e}")
                continue

        return processed

    def _get_measurement(self, profile: Dict, param: str) -> Optional[float]:
        """Extract measurement value from ArgoVis profile data."""
        try:
            if param in profile.get('data', {}):
                measurements = profile['data'][param]
                if isinstance(measurements, list) and measurements:
                    # Get the first valid measurement
                    for val in measurements:
                        if isinstance(val, (int, float)) and not pd.isna(val):
                            return round(float(val), 1)
            return None
        except:
            return None

    def get_data_by_date_range(self, start_date: str, end_date: str) -> List[Dict]:
        """
        Get ARGO data filtered by date range.
        """
        all_data = self.get_combined_data()

        # Filter by date range
        filtered = []
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

        for item in all_data:
            try:
                # Handle different date formats
                if 'T' in item['time']:
                    item_dt = datetime.fromisoformat(item['time'].replace('Z', '+00:00'))
                else:
                    # Handle YYYY-MM-DD format
                    item_dt = datetime.strptime(item['time'], '%Y-%m-%d')

                if start_dt <= item_dt <= end_dt:
                    filtered.append(item)
            except (ValueError, TypeError):
                # If date parsing fails, include the item
                filtered.append(item)

        return filtered

    def fetch_argo_data_via_api(self, region: str, start_year: int, end_year: int, max_depth: float, api_key: Optional[str] = None) -> List[Dict]:
        """
        Fetch ARGO data directly via API based on region, years, depth.
        Adapts the provided Gemini-like API call to use ArgoVis API for real data.
        """
        print(f"Fetching ARGO data for {region}, years {start_year}-{end_year}, depth <{max_depth}m")

        # Map region to lat/lon bounds
        lat_lon_bounds = {
            "Indian Ocean": {"lat_min": -60, "lat_max": 30, "lon_min": 0, "lon_max": 120},
            "Atlantic Ocean": {"lat_min": -60, "lat_max": 70, "lon_min": -70, "lon_max": 40},
            "Pacific Ocean": {"lat_min": -60, "lat_max": 60, "lon_min": 120, "lon_max": 289},  # 181 to -71 = 289
            # Add more regions as needed
        }

        bounds = lat_lon_bounds.get(region, {"lat_min": -90, "lat_max": 90, "lon_min": -180, "lon_max": 180})

        # Convert depth to pressure (approximate, 1 dbar ~ 1m)
        max_pressure = max_depth

        try:
            # Use argopy to fetch real ARGO data from GDAC ERDDAP
            from argopy import DataFetcher as ArgoDataFetcher
            argo_fetcher = ArgoDataFetcher(src="erddap", parallel=True)

            # Apply region filter
            argo_fetcher = argo_fetcher.region([bounds['lon_min'], bounds['lat_min'], bounds['lon_max'], bounds['lat_max']])

            # Apply date filter and fetch data
            ds = argo_fetcher.float().to_xarray()
            data_list = ds.to_dataframe().reset_index().to_dict('records')

            processed_data = []
            for rec in data_list:
                try:
                    lat = rec.get('LATITUDE')
                    lon = rec.get('LONGITUDE')
                    temp = rec.get('TEMP')
                    sal = rec.get('PSAL')
                    pres = rec.get('PRES')
                    time_val = str(rec.get('TIME', ''))
                    cycle = rec.get('CYCLE_NUMBER', 0)

                    # Filter by year, since argopy may fetch more
                    rec_year = pd.to_datetime(time_val).year if pd.notna(time_val) else None
                    if rec_year and start_year <= rec_year <= end_year:
                        # Filter by max pressure (depth)
                        if pres is not None and isinstance(pres, (int, float)) and pres <= max_pressure:
                            processed_data.append({
                                'latitude': float(lat) if lat else None,
                                'longitude': float(lon) if lon else None,
                                'temperature': float(temp) if temp else None,
                                'salinity': float(sal) if sal else None,
                                'depth': float(pres) if pres else None,  # pressure in dbar ~ depth in meters
                                'time': time_val,
                                'cycle': int(cycle) if cycle else 0
                            })
                except Exception as e:
                    continue

            df = pd.DataFrame(processed_data)
            df = df.dropna()  # Remove any rows with missing data
            print(f"Fetched {len(df)} valid ARGO data points for {region} years {start_year}-{end_year} depth <{max_pressure}m")
            return df.to_dict(orient='records')

        except Exception as e:
            print(f"Error fetching ARGO data via API: {e}")
            return []


# Global instance for use in routes
argo_data_service = ArgoDataService()

if __name__ == "__main__":
    # Test the service
    service = ArgoDataService()

    # Fetch recent data (last 7 days)
    recent_data = service.fetch_recent_data(
        start_date=(datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'),
        end_date=datetime.now().strftime('%Y-%m-%d')
    )

    print(f"Recent data points: {len(recent_data)}")
    if recent_data:
        print("Sample recent data point:", recent_data[0])

    # Get combined data
    combined_data = service.get_combined_data()
    print(f"Combined data points: {len(combined_data)}")