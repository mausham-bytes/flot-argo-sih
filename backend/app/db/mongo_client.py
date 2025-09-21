from pymongo import MongoClient
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy initialization variables
client = None
db = None
ocean_data_collection = None
ingestion_logs_collection = None
source_metadata_collection = None
queries_collection = None

def get_db():
    global client, db, ocean_data_collection, ingestion_logs_collection, source_metadata_collection, queries_collection
    if client is None:
        try:
            from config import Config
            client = MongoClient(Config.MONGO_URI)
            client.admin.command('ping')
            logger.info("Connected to MongoDB successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return None
    if db is None:
        db = client.get_default_database()
    if queries_collection is None:
        queries_collection = db['queries']
    if ocean_data_collection is None:
        ocean_data_collection = db['ocean_data']
        # Lazy initialize indexes when first accessed
        try:
            ocean_data_collection.create_index([
                ('timestamp', 1),
                ('location.lat', 1),
                ('location.lon', 1),
                ('data_source', 1)
            ], name='ocean_data_compound_index')
            logger.info("Ocean data index initialized.")
        except Exception as e:
            logger.warning(f"Failed to create index: {e}")
    if ingestion_logs_collection is None:
        ingestion_logs_collection = db['ingestion_logs']
        try:
            ingestion_logs_collection.create_index([
                ('timestamp', 1),
                ('data_source', 1)
            ], name='ingestion_logs_index')
        except Exception as e:
            logger.warning(f"Failed to create logs index: {e}")
    if source_metadata_collection is None:
        source_metadata_collection = db['source_metadata']
        try:
            source_metadata_collection.create_index(
                ('data_source', 1),
                unique=True,
                name='source_metadata_unique_index'
            )
        except Exception as e:
            logger.warning(f"Failed to create metadata index: {e}")
    return db

# Remove the global functions and print as they are not needed now

def initialize_collections_and_indexes():
    try:
        # Ocean data: compound index on timestamp, location.lat, location.lon, data_source
        ocean_data_collection.create_index([
            ('timestamp', 1),
            ('location.lat', 1),
            ('location.lon', 1),
            ('data_source', 1)
        ], name='ocean_data_compound_index')

        # Ingestion logs: index on timestamp and data_source
        ingestion_logs_collection.create_index([
            ('timestamp', 1),
            ('data_source', 1)
        ], name='ingestion_logs_index')

        # Source metadata: unique index on data_source
        source_metadata_collection.create_index([
            ('data_source', 1)
        ], unique=True, name='source_metadata_unique_index')

        logger.info("Collections and indexes initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize collections and indexes: {e}")
        raise

def test_basic_crud():
    try:
        logger.info("Testing basic CRUD operations...")

        # Test ocean_data collection
        test_doc = {
            'data_source': 'test_source',
            'timestamp': datetime.utcnow(),
            'location': {'lat': 10.0, 'lon': 20.0},
            'measurements': {'temperature': 25.5},
            'metadata': {'format': 'test'},
            'quality': {'flags': []}
        }

        # Insert
        insert_result = ocean_data_collection.insert_one(test_doc)
        inserted_id = insert_result.inserted_id
        logger.info(f"Inserted document with ID: {inserted_id}")

        # Read
        doc = ocean_data_collection.find_one({'_id': inserted_id})
        assert doc is not None, "Document not found"
        logger.info("Document read successfully")

        # Update
        ocean_data_collection.update_one(
            {'_id': inserted_id},
            {'$set': {'measurements.temperature': 26.0}}
        )
        logger.info("Document updated successfully")

        # Delete
        ocean_data_collection.delete_one({'_id': inserted_id})
        logger.info("Document deleted successfully")

        # Verify delete
        doc = ocean_data_collection.find_one({'_id': inserted_id})
        assert doc is None, "Document not deleted"
        logger.info("CRUD test completed successfully for ocean_data")

        # Similarly test other collections if needed (omitted for brevity, but can add)

    except Exception as e:
        logger.error(f"CRUD test failed: {e}")
        raise

