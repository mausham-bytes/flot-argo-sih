import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("LLM_API_KEY"))

def generate_summary(user_query, argo_data):
    """
    Generate a natural-language summary strictly based on ARGO data using Gemini 2.0 Flash.
    """
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

    model = genai.GenerativeModel("gemini-2.0-flash")

    response = model.generate_content(
        contents=[{"parts": [{"text": context}]}]
    )

    if response.candidates:
        return response.candidates[0].content.parts[0].text
    return "No summary could be generated from the ARGO data."
