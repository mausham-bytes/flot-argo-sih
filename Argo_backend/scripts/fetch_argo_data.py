#!/usr/bin/env python3
"""
ARGO Data Fetching Script

Fetches ARGO float data year-by-year from 2000 to present using argopy library.
Transforms data to unified schema and stores in MongoDB ocean_data collection.
Logs ingestion status to ingestion_logs collection.

Usage:
    python fetch_argo_data.py [--start-year YEAR] [--end-year YEAR] [--dry-run]
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

try:
    from argopy import DataFetcher as ArgoDataFetcher
except ImportError:
    print("argopy not installed. Run: pip install argopy")
    sys.exit(1)

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, OperationFailure
except ImportError:
    print("pymongo not installed. Run: pip install pymongo")
    sys.exit(1)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ArgoFetcher:
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

    def fetch_year_data(self, year: int, max_retries: int = 3) -> Optional[xr.Dataset]:
        """
        Fetch ARGO data for a specific year with retries.
        """
        for attempt in range(max_retries):
            try:
                logger.info(f"Fetching ARGO data for year {year} (attempt {attempt+1}/{max_retries})")

                # Create data fetcher for global region and full year
                argo = (
                    ArgoDataFetcher(src='gdac')
                    .region([-180, 180, -90, 90])  # Global
                    .date(f'{year}-01-01', f'{year}-12-31')  # Full year
                )

                # Load data
                argo.load()

                # Convert to xarray Dataset
                ds = argo.to_xarray()
                logger.info(f"Successfully fetched {len(ds.coords['N_PROF'])} profiles for year {year}")

                # Add small delay between requests to be respectful to servers
                time.sleep(2)

                return ds

            except Exception as e:
                logger.warning(f"Attempt {attempt+1} failed for year {year}: {e}")
                if attempt < max_retries - 1:
                    # Exponential backoff
                    sleep_time = 2 ** attempt
                    logger.info(f"Retrying in {sleep_time} seconds...")
                    time.sleep(sleep_time)
                else:
                    logger.error(f"Failed to fetch data for year {year} after {max_retries} attempts")
                    return None

        return None

    def transform_profile_to_documents(self, ds: xr.Dataset, profile_idx: int) -> List[Dict[str, Any]]:
        """
        Transform a single profile to list of unified schema documents.
        Each subsurface measurement level becomes a separate document.
        """
        try:
            # Get profile data
            profile = ds.isel(N_PROF=profile_idx)

            # Extract metadata
            wmo_id = int(profile.PLATFORM_NUMBER.values)
            n_prof = int(profile.N_PROF.values)
            date = pd.to_datetime(str(profile.JULD.values)).replace(tzinfo=None)  # Convert to naive datetime

            # Location (same for all levels)
            location = {
                'lat': float(profile.LATITUDE.values),
                'lon': float(profile.LONGITUDE.values)
            }

            documents = []

            # Get pressure (depth) levels
            pressures = profile.PRES.values
            temperatures = profile.TEMP.values
            salinities = profile.PSAL.values

            # Handle oxygen if available
            oxygen = None
            if 'DOXY' in ds.data_vars and not np.isnan(profile.DOXY.values).all():
                oxygen = profile.DOXY.values

            # Process each measurement level
            for level_idx in range(len(pressures)):
                try:
                    press = float(pressures[level_idx])
                    temp = float(temperatures[level_idx])
                    sal = float(salinities[level_idx])

                    # Skip invalid measurements
                    if np.isnan(press) or np.isnan(temp) or np.isnan(sal):
                        continue

                    measurements = {
                        'temperature': temp,
                        'salinity': sal,
                        'pressure': press  # Pressure in dbar, represents depth
                    }

                    if oxygen is not None and not np.isnan(oxygen[level_idx]):
                        measurements['oxygen'] = float(oxygen[level_idx])

                    # Create document
                    doc = {
                        'data_source': 'argo',
                        'timestamp': date,
                        'location': location,
                        'measurements': measurements,
                        'metadata': {
                            'wmo_id': wmo_id,
                            'profile_id': n_prof,
                            'cycle_number': int(profile.CYCLE_NUMBER.values) if hasattr(profile, 'CYCLE_NUMBER') else None,
                            'level': level_idx
                        },
                        'quality': {
                            'flags': []  # Can be extended for QC flags
                        }
                    }

                    documents.append(doc)

                except (ValueError, TypeError) as e:
                    # Skip invalid level
                    continue

            return documents

        except Exception as e:
            logger.error(f"Error transforming profile {profile_idx}: {e}")
            return []

    def insert_documents(self, documents: List[Dict[str, Any]]) -> int:
        """Insert documents into ocean_data collection."""
        if self.dry_run:
            logger.info(f"DRY RUN: Would insert {len(documents)} documents")
            # Print first document as sample
            if documents:
                logger.info(f"Sample document: {documents[0]}")
            return len(documents)

        if not self.collection:
            logger.error("No MongoDB collection available")
            return 0

        try:
            if documents:
                result = self.collection.insert_many(documents)
                inserted_count = len(result.inserted_ids)
                logger.info(f"Inserted {inserted_count} documents")
                return inserted_count
            return 0
        except OperationFailure as e:
            logger.error(f"Failed to insert documents: {e}")
            return 0

    def log_ingestion(self, year: int, count: int, status: str, error_msg: Optional[str] = None):
        """Log ingestion status to ingestion_logs collection."""
        if self.dry_run:
            logger.info(f"DRY RUN: Would log ingestion: year={year}, count={count}, status={status}")
            return

        if not self.logs_collection:
            logger.error("No MongoDB logs collection available")
            return

        log_doc = {
            'year': year,
            'count': count,
            'status': status,
            'data_source': 'argo',
            'timestamp': datetime.utcnow(),
            'error_message': error_msg
        }

        try:
            self.logs_collection.insert_one(log_doc)
            logger.info(f"Logged ingestion status for year {year}")
        except OperationFailure as e:
            logger.error(f"Failed to log ingestion: {e}")

    def process_year(self, year: int) -> int:
        """Process a single year: fetch, transform, insert."""
        logger.info(f"Processing year {year}...")

        # Fetch data
        ds = self.fetch_year_data(year)
        if ds is None:
            logger.warning(f"No data fetched for year {year}, skipping")
            self.log_ingestion(year, 0, 'error', 'No data available or fetch failed')
            return 0

        # Check if we have profiles
        n_profiles = len(ds.coords['N_PROF'])
        if n_profiles == 0:
            logger.warning(f"No profiles found for year {year}, skipping")
            self.log_ingestion(year, 0, 'error', 'No profiles found')
            return 0

        total_inserted = 0

        # Process each profile
        for profile_idx in range(n_profiles):
            try:
                documents = self.transform_profile_to_documents(ds, profile_idx)
                inserted = self.insert_documents(documents)
                total_inserted += inserted
            except Exception as e:
                logger.error(f"Error processing profile {profile_idx} in year {year}: {e}")
                continue

        self.log_ingestion(year, total_inserted, 'success')
        logger.info(f"Completed year {year}: {total_inserted} measurements inserted")
        return total_inserted

def main():
    parser = argparse.ArgumentParser(description='Fetch ARGO data year-by-year')
    parser.add_argument('--start-year', type=int, default=2000,
                       help='Start year (default: 2000)')
    parser.add_argument('--end-year', type=int, default=datetime.now().year,
                       help='End year (default: current year)')
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
    if not mongo_uri:
        logger.error("MongoDB URI not provided. Use --mongo-uri or set MONGO_URI environment variable")
        sys.exit(1)

    # Initialize fetcher
    try:
        fetcher = ArgoFetcher(mongo_uri, args.dry_run)
    except Exception as e:
        logger.error(f"Failed to initialize fetcher: {e}")
        sys.exit(1)

    # Process years
    total_processed = 0
    for year in range(args.start_year, args.end_year + 1):
        inserted = fetcher.process_year(year)
        total_processed += inserted

        # Optional: add delay between years to be kind to servers
        if year < args.end_year:
            time.sleep(5)

    logger.info(f"Processing complete. Total measurements processed: {total_processed}")

if __name__ == '__main__':
    main()