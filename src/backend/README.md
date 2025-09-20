# ARGO Float Backend API

This is a mock backend server that provides ARGO float data for development and testing.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python mock-server.py
```

The server will start on `http://127.0.0.1:5000`

## API Endpoints

- `GET /api/floats` - Get all ARGO floats
- `GET /api/floats/<id>/profile` - Get profile data for a specific float
- `POST /chat/query` - Chat with Nerida AI assistant
- `GET /health` - Health check

## Features

- Mock ARGO float data with realistic oceanographic parameters
- Dynamic profile generation with depth-dependent temperature, salinity, and oxygen
- Chat bot responses based on query keywords
- CORS enabled for frontend integration