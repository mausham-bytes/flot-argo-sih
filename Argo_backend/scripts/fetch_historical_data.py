#!/usr/bin/env python3
"""
Historical Ocean Data Fetching Script

Fetches historical ocean data from NOAA ERSST, CMIP6, and Copernicus Marine API.
Transforms to unified schema and stores in MongoDB ocean_data collection.
Logs ingestion status to ingestion_logs collection.

For pre-2000 coverage: NOAA ERSST for SST (1950-1999)

Usage:
    python fetch_historical_data.py --data-source ersst --start-year 1950 --end-year 1999 --dry-run
"""

import os
import sys
import argparse
import logging
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
import xarray as xr
import requests

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, OperationFailure, BulkWriteError
except ImportError:
    print("pymongo not installed. Run: pip install pymongo")
    sys.exit(1)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class HistoricalFetcher:
    def __init__(self, mongo_uri: str, dry_run: bool = False):
        self.dry_run = dry_run
        self.mongo_uri = mongo_uri
        self.collection = None
        self.logs_collection = None

        if not self.dry_run:
            self._connect_db()

    def _connect_db(self):
        """Connect to MongoDB and set collections."""
        try:
            client = MongoClient(self.mongo_uri)
            # Ping to test connection
            client.admin.command('ping')
            db = client.get_default_database()
            self.collection = db['ocean_data']
            self.logs_collection = db['ingestion_logs']
            logger.info("Connected to MongoDB successfully")
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    def fetch_ersst_for_year(self, year: int, max_retries: int = 3) -> Optional[xr.Dataset]:
        """
        Fetch ERSST monthly SST data for a given year from ERDDAP.
        """
        time_range = f"[( {year}-01-01T12:00:00Z):1:( {year}-12-31T12:00:00Z)]"
        zlev_range = "[0.0]"  # Surface level
        lat_range = "[(-90.0):1:(90.0)]"
        lon_range = "[(-180.0):1:(180.0)]"
        
        subset = f"sst{time_range}{zlev_range}{lat_range}{lon_range}"
        url = f"https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg.nc?{subset}"

        for attempt in range(max_retries):
            try:
                logger.info(f"Fetching ERSST data for year {year} (attempt {attempt+1}/{max_retries})")
                
                response = requests.get(url, stream=True, timeout=300)  # 5 min timeout, stream to handle large files
                response.raise_for_status()
                
                # Load into xarray from the response
                import io
                ds = xr.open_dataset(io.BytesIO(response.content), engine='netcdf4')
                
                logger.info(f"Successfully fetched ERSST data for {year}: {ds.dims}")
                return ds
                
            except Exception as e:
                logger.warning(f"Attempt {attempt+1} failed for year {year}: {e}")
                if attempt < max_retries - 1:
                    sleep_time = 2 ** attempt * 10  # Longer backoff
                    logger.info(f"Retrying in {sleep_time} seconds...")
                    time.sleep(sleep_time)
                else:
                    logger.error(f"Failed to fetch ERSST data for year {year} after {max_retries} attempts")
                    return None
        return None

    def transform_grid_to_documents(self, ds: xr.Dataset, time_idx: int) -> List[Dict[str, Any]]:
        """
        Transform a single time slice of grid data to list of unified schema documents.
        Each grid cell becomes a separate document.
        """
        try:
            # Select the time slice
            time_slice = ds.isel(time=time_idx)
            timestamp = pd.to_datetime(time_slice.time.values).replace(tzinfo=None)
            
            # Get coordinates
            lats = time_slice.lat.values
            lons = time_slice.lon.values
            sst = time_slice.sst.values  # Shape: (lat, lon)
            
            documents = []
            
            for i, lat in enumerate(lats):
                for j, lon in enumerate(lons):
                    temp = sst[i, j]
                    
                    # Skip NaN values
                    if np.isnan(temp):
                        continue
                    
                    # Convert to float
                    temp = float(temp)
                    
                    # Create document - SST has no depth/pressure
                    doc = {
                        'data_source': 'ersst',
                        'timestamp': timestamp,
                        'location': {
                            'lat': float(lat),
                            'lon': float(lon)
                        },
                        'measurements': {
                            'temperature': temp
                            # No salinity, pressure for gridded surface
                        },
                        'metadata': {
                            'dataset': 'ncdcOisst21Agg',
                            'version': 'v2.1',
                            'grid_resolution': '1x1 degree'
                        },
                        'quality': {
                            'flags': []  # Can be extended for QC flags
                        }
                    }
                    
                    documents.append(doc)
                    
            logger.info(f"Transformed time slice {time_idx} ({timestamp}) to {len(documents)} documents")
            return documents
            
        except Exception as e:
            logger.error(f"Error transforming time slice {time_idx}: {e}")
            return []

    def insert_documents(self, documents: List[Dict[str, Any]]) -> int:
        """Insert documents into ocean_data collection, handling duplicates."""
        if self.dry_run:
            logger.info(f"DRY RUN: Would insert {len(documents)} documents")
            if documents:
                logger.info(f"Sample document: {documents[0]}")
            return len(documents)

        if not self.collection:
            logger.error("No MongoDB collection available")
            return 0

        try:
            # Use insert_many with ordered=False to continue on duplicate key errors
            if documents:
                result = self.collection.insert_many(documents, ordered=False)
                inserted_count = len(result.inserted_ids)
                logger.info(f"Inserted {inserted_count} documents")
                
                # Check for duplicates (if some failed due to duplicates)
                if inserted_count < len(documents):
                    duplicate_count = len(documents) - inserted_count
                    logger.warning(f"Skipped {duplicate_count} duplicate documents")
                
                return inserted_count
            return 0
        except BulkWriteError as e:
            # Get successful inserts and write errors
            inserted_count = e.details.get('nInserted', 0)
            logger.info(f"Inserted {inserted_count} documents, {e.details.get('nMatched', 0)} matched (duplicates skipped)")
            return inserted_count
        except OperationFailure as e:
            logger.error(f"Failed to insert documents: {e}")
            return 0

    def log_ingestion(self, year: int, month: int, count: int, status: str, error_msg: Optional[str] = None):
        """Log ingestion status to ingestion_logs collection."""
        if self.dry_run:
            logger.info(f"DRY RUN: Would log ingestion: year={year}, month={month}, count={count}, status={status}")
            return

        if not self.logs_collection:
            logger.error("No MongoDB logs collection available")
            return

        period = f"{year}-{month:02d}"
        log_doc = {
            'year': year,
            'month': month,
            'period': period,
            'count': count,
            'status': status,
            'data_source': 'ersst',
            'timestamp': datetime.utcnow(),
            'error_message': error_msg
        }

        try:
            self.logs_collection.insert_one(log_doc)
            logger.info(f"Logged ingestion status for {period}")
        except OperationFailure as e:
            logger.error(f"Failed to log ingestion: {e}")

    def process_ersst(self, start_year: int, end_year: int) -> int:
        """Process ERSST data year by year."""
        logger.info(f"Processing ERSST from {start_year} to {end_year}...")

        total_inserted = 0
        batch_size = 10000  # Insert in batches to avoid memory issues

        for year in range(start_year, end_year + 1):
            ds = self.fetch_ersst_for_year(year)
            if ds is None:
                logger.warning(f"No data fetched for ERSST {year}, skipping year")
                self.log_ingestion(year, 0, 0, 'error', 'Fetch failed')
                # Rate limiting: wait between years to be respectful
                time.sleep(5)
                continue

            logger.info(f"Processing {len(ds.time.values)} time slices for {year}")

            # Process each time slice (monthly)
            for time_idx in range(len(ds.time.values)):
                try:
                    documents = self.transform_grid_to_documents(ds, time_idx)

                    # Insert in batches if too many
                    if len(documents) > batch_size:
                        for i in range(0, len(documents), batch_size):
                            batch = documents[i:i+batch_size]
                            inserted = self.insert_documents(batch)
                            total_inserted += inserted
                    else:
                        inserted = self.insert_documents(documents)
                        total_inserted += inserted

                    # For logging, get timestamp
                    timestamp = pd.to_datetime(ds.time.values[time_idx])
                    month = timestamp.month
                    self.log_ingestion(year, month, inserted, 'success')

                except Exception as e:
                    logger.error(f"Error processing time index {time_idx} for {year}: {e}")
                    timestamp = pd.to_datetime(ds.time.values[time_idx]) if time_idx < len(ds.time.values) else datetime(year, 1, 1)
                    month = timestamp.month
                    self.log_ingestion(year, month, 0, 'error', str(e))
                    continue

            # Rate limiting: delay between years to be respectful to servers
            if year < end_year:
                time.sleep(10)

        logger.info(f"Completed ERSST processing {start_year}-{end_year}: {total_inserted} measurements inserted")
        return total_inserted

    def process_cmip6(self, start_year: int, end_year: int) -> int:
        """Placeholder for CMIP6 data fetching."""
        logger.info("CMIP6 processing not yet implemented")
        return 0

    def process_copernicus(self, start_year: int, end_year: int) -> int:
        """Placeholder for Copernicus data fetching."""
        logger.info("Copernicus processing not yet implemented")
        return 0

def main():
    parser = argparse.ArgumentParser(description='Fetch historical ocean data')
    parser.add_argument('--data-source', choices=['ersst', 'cmip6', 'copernicus'], default='ersst',
                        help='Data source to fetch (default: ersst)')
    parser.add_argument('--start-year', type=int, default=1950,
                        help='Start year (default: 1950)')
    parser.add_argument('--end-year', type=int, default=1999,
                        help='End year (default: 1999)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Dry run: print actions without inserting to database')
    parser.add_argument('--mongo-uri', type=str, default=os.environ.get('MONGO_URI'),
                        help='MongoDB URI (default: from MONGO_URI env var)')

    args = parser.parse_args()

    # Validate years
    if args.start_year > args.end_year:
        logger.error("Start year cannot be greater than end year")
        sys.exit(1)

    if args.dry_run:
        logger.info("Running in DRY RUN mode - no database modifications will be made")

    # Check MongoDB URI
    mongo_uri = args.mongo_uri
    if not mongo_uri and not args.dry_run:
        logger.error("MongoDB URI not provided. Use --mongo-uri or set MONGO_URI environment variable")
        sys.exit(1)

    # Initialize fetcher
    try:
        fetcher = HistoricalFetcher(mongo_uri, args.dry_run)
    except Exception as e:
        logger.error(f"Failed to initialize fetcher: {e}")
        sys.exit(1)

    # Process based on data source
    total_processed = 0
    if args.data_source == 'ersst':
        total_processed = fetcher.process_ersst(args.start_year, args.end_year)
    elif args.data_source == 'cmip6':
        total_processed = fetcher.process_cmip6(args.start_year, args.end_year)
    elif args.data_source == 'copernicus':
        total_processed = fetcher.process_copernicus(args.start_year, args.end_year)

    logger.info(f"Processing complete for {args.data_source}. Total measurements processed: {total_processed}")

if __name__ == '__main__':
    main()