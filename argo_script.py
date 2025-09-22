import requests
import pandas as pd
import os

try:
    import matplotlib.pyplot as plt
except ImportError:
    plt = None


def fetch_argo_data(region, start_year, end_year, max_depth, api_key=None):
    """
    Fetch ARGO data directly via ArgoVis API (simulating Gemini-like API)
    """
    # Map region to lat/lon bounds
    region_bounds = {
        "Indian Ocean": {"lat_min": -60, "lat_max": 30, "lon_min": 0, "lon_max": 120},
        "Atlantic Ocean": {"lat_min": -60, "lat_max": 70, "lon_min": -71, "lon_max": 40},
        "Pacific Ocean": {"lat_min": -60, "lat_max": 60, "lon_min": 120, "lon_max": 289},
    }

    bounds = region_bounds.get(region, {"lat_min": -90, "lat_max": 90, "lon_min": -180, "lon_max": 180})

    base_url = "https://argovis.colorado.edu/download/catalog/profiles"
    params = {
        'date': f"[{start_year}-01-01,{end_year}-12-31]",
        'dataLat': f"[{bounds['lat_min']},{bounds['lat_max']}]",
        'dataLon': f"[{bounds['lon_min']},{bounds['lon_max']}]",
        'limit': 5000
    }

    try:
        response = requests.get(base_url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        print(f"Fetched {len(data)} profiles from ArgoVis")

        # Process data
        processed = []
        for profile in data[:500]:  # Limit for demo
            lat = profile.get('geoLocation', {}).get('coordinates', [None, None])[1]
            lon = profile.get('geoLocation', {}).get('coordinates', [None, None])[0]
            temp = get_measurement(profile, 'temperature')
            sal = get_measurement(profile, 'salinity')
            dep = get_measurement(profile, 'pressure')  # depth approx pressure

            if all([lat, lon, temp, sal, dep]) and dep <= max_depth:
                processed.append({
                    'latitude': lat,
                    'longitude': lon,
                    'temperature': temp,
                    'salinity': sal,
                    'depth': dep,
                    'year': int(pd.to_datetime(profile.get('date')).year)
                })

        df = pd.DataFrame(processed)
        print(f"Processed {len(df)} valid data points")
        return df

    except Exception as e:
        print(f"Error fetching data: {e}")
        return pd.DataFrame()


def get_measurement(profile, param):
    measurements = profile.get('data', {}).get(param, [])
    if measurements and isinstance(measurements, list):
        return measurements[0] if len(measurements) > 0 else None
    return None


def create_plots(df):
    if df.empty:
        print("No data to plot")
        return

    if plt is None:
        print("Matplotlib not available. Install matplotlib for plotting functionality.")
        return

    # Temperature Profile (Depth vs Temp)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))

    # Scatter plot Temperature vs Depth
    ax1.scatter(df['temperature'], df['depth'], alpha=0.6, c=df['year'], cmap='viridis')
    ax1.set_xlabel('Temperature (°C)')
    ax1.set_ylabel('Depth (m)')
    ax1.set_title('Temperature Profile')
    ax1.invert_yaxis()
    ax1.grid(True)

    # Salinity Map
    scatter = ax2.scatter(df['longitude'], df['latitude'], c=df['salinity'], cmap='viridis', alpha=0.8, s=20)
    ax2.set_xlabel('Longitude')
    ax2.set_ylabel('Latitude')
    ax2.set_title('Salinity Distribution')
    ax2.grid(True)
    plt.colorbar(scatter, ax=ax2, label='Salinity (PSU)')

    plt.tight_layout()
    plt.show()


def main():
    # Example query: Indian Ocean floats from 2010 to 2012 at depths < 500m
    df = fetch_argo_data("Indian Ocean", 2010, 2012, 500)

    if not df.empty:
        print("Summary:")
        print(f"Average Temperature: {df['temperature'].mean():.2f}°C")
        print(f"Average Salinity: {df['salinity'].mean():.2f} PSU")
        print(f"Total data points: {len(df)}")

        create_plots(df)
    else:
        print("No data fetched")


if __name__ == "__main__":
    main()