from pymongo import MongoClient
from config import Config

# Initialize Mongo client
client = MongoClient(Config.MONGO_URI)
db = client.get_default_database()

# Example collections
queries_collection = db["queries"]
floats_collection = db["floats"]
