import pytest
from fastapi.testclient import TestClient
from app.main import app  # Adjust import as needed


client = TestClient(app)


def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    # Adjust based on your actual root endpoint


def test_health_check():
    # Assuming you have a health check endpoint
    response = client.get("/health")
    assert response.status_code == 200


# Add more tests for models
from app.models import FloatData
def test_float_data_pydantic():
    data = FloatData(
        float_id="123",
        date="2023-01-01T00:00:00",  # Will parse to datetime
        latitude=10.0,
        longitude=20.0,
        depth=100.0,
        temperature=15.5,
        salinity=35.0
    )
    assert data.float_id == "123"