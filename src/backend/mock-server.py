#!/usr/bin/env python3
"""
Mock ARGO Float API Server
Provides mock data for development and testing
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import datetime
import json

app = Flask(__name__)
CORS(app)

# Mock ARGO float data
MOCK_FLOATS = [
    {
        "id": "WMO_6901234",
        "wmo_id": "6901234",
        "lat": 35.5,
        "lon": -15.2,
        "status": "active",
        "last_profile": "2024-01-15T10:30:00Z",
        "temperature": 18.4,
        "salinity": 36.1,
        "oxygen": 6.8,
        "platform_type": "APEX",
        "cycle_number": 245
    },
    {
        "id": "WMO_6901235",
        "wmo_id": "6901235",
        "lat": 42.1,
        "lon": -8.7,
        "status": "active",
        "last_profile": "2024-01-14T15:45:00Z",
        "temperature": 15.2,
        "salinity": 35.8,
        "oxygen": 6.2,
        "platform_type": "NOVA",
        "cycle_number": 189
    },
    {
        "id": "WMO_6901236",
        "wmo_id": "6901236",
        "lat": 38.9,
        "lon": -12.4,
        "status": "inactive",
        "last_profile": "2024-01-10T08:20:00Z",
        "temperature": 16.8,
        "salinity": 35.9,
        "oxygen": 5.9,
        "platform_type": "APEX",
        "cycle_number": 156
    },
    {
        "id": "WMO_6901237",
        "wmo_id": "6901237",
        "lat": 31.2,
        "lon": -18.6,
        "status": "active",
        "last_profile": "2024-01-15T12:15:00Z",
        "temperature": 20.1,
        "salinity": 36.3,
        "oxygen": 7.1,
        "platform_type": "SOLO",
        "cycle_number": 298
    },
    {
        "id": "WMO_6901238",
        "wmo_id": "6901238",
        "lat": 45.3,
        "lon": -5.1,
        "status": "active",
        "last_profile": "2024-01-15T09:00:00Z",
        "temperature": 13.8,
        "salinity": 35.6,
        "oxygen": 6.5,
        "platform_type": "APEX",
        "cycle_number": 201
    }
]

def generate_profile_data():
    """Generate realistic oceanographic profile data"""
    depths = [0, 10, 20, 50, 100, 200, 500, 1000, 1500, 2000]
    
    # Temperature decreases with depth
    temperatures = []
    surface_temp = random.uniform(15, 22)
    for depth in depths:
        if depth == 0:
            temp = surface_temp
        elif depth <= 100:
            temp = surface_temp - (depth * 0.05)
        elif depth <= 1000:
            temp = surface_temp - 5 - ((depth - 100) * 0.01)
        else:
            temp = max(2, surface_temp - 15 - ((depth - 1000) * 0.002))
        temperatures.append(round(temp, 2))
    
    # Salinity varies less dramatically
    salinities = []
    surface_sal = random.uniform(35.5, 36.5)
    for depth in depths:
        if depth <= 50:
            sal = surface_sal + random.uniform(-0.2, 0.2)
        elif depth <= 500:
            sal = surface_sal - 0.3 + random.uniform(-0.1, 0.1)
        else:
            sal = 34.6 + random.uniform(-0.1, 0.1)
        salinities.append(round(sal, 2))
    
    # Oxygen decreases with depth
    oxygen_levels = []
    surface_o2 = random.uniform(6.5, 7.5)
    for depth in depths:
        if depth == 0:
            o2 = surface_o2
        elif depth <= 200:
            o2 = surface_o2 - (depth * 0.01)
        elif depth <= 1000:
            o2 = max(2, surface_o2 - 2 - ((depth - 200) * 0.003))
        else:
            o2 = max(1.5, surface_o2 - 5 - ((depth - 1000) * 0.001))
        oxygen_levels.append(round(o2, 2))
    
    return {
        "depth": depths,
        "temperature": temperatures,
        "salinity": salinities,
        "oxygen": oxygen_levels,
        "pressure": [d / 10 for d in depths]  # Approximate pressure
    }

@app.route('/api/floats', methods=['GET'])
def get_floats():
    """Get all ARGO floats with optional filtering"""
    region = request.args.get('region')
    status = request.args.get('status')
    
    floats = MOCK_FLOATS.copy()
    
    if status and status != 'all':
        floats = [f for f in floats if f['status'] == status]
    
    # Add some random variation to make it feel more dynamic
    for float_data in floats:
        if float_data['status'] == 'active':
            float_data['temperature'] += random.uniform(-0.5, 0.5)
            float_data['salinity'] += random.uniform(-0.1, 0.1)
            float_data['oxygen'] += random.uniform(-0.2, 0.2)
    
    return jsonify(floats)

@app.route('/api/floats/<float_id>/profile', methods=['GET'])
def get_float_profile(float_id):
    """Get profile data for a specific float"""
    profile_data = generate_profile_data()
    return jsonify(profile_data)

@app.route('/chat/query', methods=['POST'])
def chat_query():
    """Handle chat queries about ARGO data"""
    data = request.get_json()
    query = data.get('query', '').lower()
    
    # Simple keyword-based responses
    if 'temperature' in query or 'warm' in query:
        response = {
            "text": "Based on current ARGO data, I can see temperature variations across different regions. The average sea surface temperature is around 16.8°C, with warmer waters (20°C+) found in subtropical regions and cooler waters (13-15°C) in northern latitudes. Would you like me to show specific temperature profiles for any region?",
            "data": {"type": "temperature_summary"}
        }
    elif 'salinity' in query or 'salt' in query:
        response = {
            "text": "Salinity measurements from ARGO floats show typical oceanic values ranging from 34.6 to 36.3 PSU (Practical Salinity Units). Higher salinity is often found in subtropical regions due to evaporation, while lower salinity occurs near river outflows and polar regions. The global average is approximately 35.9 PSU.",
            "data": {"type": "salinity_summary"}
        }
    elif 'oxygen' in query or 'o2' in query:
        response = {
            "text": "Dissolved oxygen levels vary significantly with depth and location. Surface waters typically show 6-7 ml/L, decreasing to 2-3 ml/L at deeper levels. This creates oxygen minimum zones that are crucial for marine ecosystems and carbon cycling.",
            "data": {"type": "oxygen_summary"}
        }
    elif 'float' in query or 'location' in query:
        response = {
            "text": f"Currently tracking {len([f for f in MOCK_FLOATS if f['status'] == 'active'])} active ARGO floats worldwide. These autonomous instruments collect temperature, salinity, and pressure data from the surface to 2000m depth every 10 days. Would you like to see floats in a specific region?",
            "floats": MOCK_FLOATS
        }
    else:
        response = {
            "text": "I'm Nerida, your AI oceanographer! I can help you explore ARGO float data including temperature, salinity, and oxygen measurements. Try asking me about ocean conditions, specific regions, or float locations. What would you like to discover about our oceans?",
            "data": {"type": "general_help"}
        }
    
    return jsonify(response)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.datetime.now().isoformat()})

if __name__ == '__main__':
    print("🌊 Starting ARGO Float Mock API Server...")
    print("📊 Available endpoints:")
    print("  - GET  /api/floats")
    print("  - GET  /api/floats/<id>/profile")
    print("  - POST /chat/query")
    print("  - GET  /health")
    print("\n🚀 Server running on http://127.0.0.1:5000")
    
    app.run(host='127.0.0.1', port=5000, debug=True)