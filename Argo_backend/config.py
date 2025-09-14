import os
import dotenv

dotenv.load_dotenv()  # Load .env

class Config:
    # MongoDB connection
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/argo_db")

    # DeepSeek API Key
    LLM_API_KEY = os.getenv("LLM_API_KEY")

    # Optional: Vector DB path
    VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "./chroma_store")
