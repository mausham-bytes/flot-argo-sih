from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager

from app.routes.chat import router as chat_router
from app.routes.location import router as location_router
from app.config import Config


limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Argo Float API...")
    yield
    # Shutdown
    print("Shutting down Argo Float API...")

def create_app() -> FastAPI:
    app = FastAPI(
        title="Flot - Argo Float Ocean Data API",
        description="API for visualizing and analyzing Argo Float ocean data",
        version="1.0.0",
        lifespan=lifespan
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev ports
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate limiting middleware
    app.add_middleware(SlowAPIMiddleware)
    app.state.limiter = limiter

    # Exception handler for rate limits
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Include routers
    app.include_router(chat_router, prefix="/chat", tags=["Chat"])
    app.include_router(location_router, prefix="/floats", tags=["Floats"])

    # Health check
    @app.get("/health", summary="Health Check")
    async def health_check():
        return {"status": "healthy", "message": "Flot API is running"}

    @app.get("/", summary="Root Endpoint")
    async def root():
        return {"message": "Welcome to Flot - Argo Float Ocean Data API"}

    return app


# Create the FastAPI app instance
app = create_app()
