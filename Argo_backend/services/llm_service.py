import os

try:
    import google.generativeai as genai
    genai_available = True
    # Configure API key from environment
    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
    else:
        print("WARNING: GOOGLE_API_KEY not found. LLM chat functionality will return fallback responses.")
except ImportError:
    genai_available = False
    print("google.generativeai not installed, using fallback responses")

def generate_targeted_response(query_lower, argo_data):
    """Generate a targeted response based on query keywords."""
    if not argo_data:
        return "No ARGO data available to summarize."

    # Calculate basic statistics
    temps = [r.get('TEMP') for r in argo_data if r.get('TEMP') is not None]
    saline = [r.get('PSAL') for r in argo_data if r.get('PSAL') is not None]
    presses = [r.get('PRES') for r in argo_data if r.get('PRES') is not None]

    num_records = len(argo_data)
    avg_temp = sum(temps) / len(temps) if temps else None
    avg_psal = sum(saline) / len(saline) if saline else None
    avg_pres = sum(presses) / len(presses) if presses else None

    # Determine region
    region = "unknown"
    if argo_data:
        lats = [r.get('LATITUDE') for r in argo_data if r.get('LATITUDE')]
        lons = [r.get('LONGITUDE') for r in argo_data if r.get('LONGITUDE')]
        if lats and lons:
            avg_lat = sum(lats) / len(lats)
            avg_lon = sum(lons) / len(lons)
            if avg_lon >= 20 and avg_lon <= 120 and avg_lat >= -60 and avg_lat <= 30:
                region = "Indian Ocean"
            elif (avg_lon >= -70 and avg_lon <= 40) or (avg_lon >= 289 or avg_lon <= -71):
                region = "Atlantic Ocean" if -70 <= avg_lon <= 40 else "Pacific Ocean"
            else:
                region = "equatorial waters" if -5 <= avg_lat <= 5 else "unknown"

    # Generate targeted response based on keywords
    if 'temp' in query_lower or 'temperature' in query_lower:
        if avg_temp:
            return f"The average temperature in this region is {avg_temp:.1f}°C (sampled from {num_records} ARGO float profiles)."
        else:
            return f"No temperature data available for this region."

    elif 'salinity' in query_lower or 'salt' in query_lower:
        if avg_psal:
            return f"The average salinity in this region is {avg_psal:.2f} PSU (sampled from {num_records} ARGO float profiles)."
        else:
            return f"No salinity data available for this region."

    elif 'pressure' in query_lower or 'depth' in query_lower:
        if avg_pres:
            return f"The average pressure in this region is {avg_pres:.0f} dbar (approximately {avg_pres*10:.0f} meters depth, sampled from {num_records} ARGO float profiles)."
        else:
            return f"No pressure data available for this region."

    elif 'longitude' in query_lower or 'latitude' in query_lower:
        if region != "unknown":
            return f"The analyzed {num_records} ARGO floats are primarily located in the {region} region."
        else:
            return f"The analyzed {num_records} ARGO floats cover (averaged) {avg_lat:.1f}°N, {avg_lon:.1f}°E."

    # Default full summary
    response = f"I've analyzed {num_records} ARGO float records around {avg_lat:.1f}°N, {avg_lon:.1f}°E "
    response += f"(approximately {region}).\n\nAverage ocean conditions:"
    if avg_temp:
        response += f"\n- Temperature: {avg_temp:.1f}°C"
    if avg_psal:
        response += f"\n- Salinity: {avg_psal:.2f} PSU"
    if avg_pres:
        response += f"\n- Depth: {avg_pres*10:.0f} meters ({avg_pres:.0f} dbar pressure)"
    return response

def generate_summary(user_query, argo_data):
    """
    Generate a natural-language summary strictly based on ARGO data using Gemini 2.0 Flash.
    Falls back to a basic data-driven summary if API is not configured.
    """
    # Check if API is available
    if not genai_available or not os.getenv("GOOGLE_API_KEY"):
        # Provide a basic summary of the data
        if not argo_data:
            return "No ARGO data available to summarize."

        # Calculate basic statistics
        temps = [r.get('TEMP') for r in argo_data if r.get('TEMP') is not None]
        saline = [r.get('PSAL') for r in argo_data if r.get('PSAL') is not None]
        presses = [r.get('PRES') for r in argo_data if r.get('PRES') is not None]

        num_records = len(argo_data)
        avg_temp = sum(temps) / len(temps) if temps else None
        avg_psal = sum(saline) / len(saline) if saline else None
        avg_pres = sum(presses) / len(presses) if presses else None

        # Simple region detection
        if argo_data:
            lats = [r.get('LATITUDE') for r in argo_data if r.get('LATITUDE')]
            lons = [r.get('LONGITUDE') for r in argo_data if r.get('LONGITUDE')]

            if lats and lons:
                avg_lat = sum(lats) / len(lats)
                avg_lon = sum(lons) / len(lons)
    
                region = "unknown"
                # Check for specific oceans first
                if avg_lon >= 20 and avg_lon <= 120 and avg_lat >= -60 and avg_lat <= 30:
                    region = "Indian Ocean"
                elif (avg_lon >= -70 and avg_lon <= 40) or (avg_lon <= -180 or avg_lon >= 150):
                    region = "Atlantic Ocean" if -70 <= avg_lon <= 40 else "Pacific Ocean"
                elif -5 <= avg_lat <= 5:
                    region = "Equator"
                elif avg_lat > 23:
                    region = "Northern Hemisphere"
                elif avg_lat < -23:
                    region = "Southern Hemisphere"

                return f"I've analyzed {num_records} ARGO float records around {avg_lat:.1f}°N, {avg_lon:.1f}°E (approximately {region}). Average ocean conditions: Temperature {'%.1f°C' % avg_temp if avg_temp else 'N/A'}, Salinity {'%.2f PSU' % avg_psal if avg_psal else 'N/A'}, at {'%.0f m' % avg_pres if avg_pres else 'N/A'} depth."
        return f"Found {num_records} ARGO data points to analyze."

    clean_query = user_query.replace("[Chat] Received query:", "").strip()

    context = f"""
You are an oceanographic assistant.
User query: {clean_query}

ARGO data sample (JSON records):
{argo_data}

Instructions:
- ONLY answer using the ARGO data above.
- If the requested timeframe is missing, clearly say which years/months are available.
- Do not invent or assume data outside of the provided sample.
- Provide a concise explanation suitable for oceanographic analysis.
"""

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")

        response = model.generate_content(
            contents=[{"parts": [{"text": context}]}]
        )

        if response.candidates:
            return response.candidates[0].content.parts[0].text
        return "No summary could be generated from the ARGO data."
    except Exception as e:
        return f"Error generating AI summary: {str(e)}. Please check your GOOGLE_API_KEY configuration."
