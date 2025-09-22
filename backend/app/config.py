import os
import dotenv

dotenv.load_dotenv()  # Load .env

class Config:
    # SQLAlchemy PostgreSQL connection
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/argo_db")

    # MongoDB connection
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/argo_db")

    # JWT Secret
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM = "HS256"

    # LLM API Key (DeepSeek or similar)
    LLM_API_KEY = os.getenv("LLM_API_KEY")

    # Optional: Vector DB path for ChromaDB
    VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "./chroma_store")

    # Cache settings (optional)
    CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))  # 5 minutes
