import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("LLM_API_KEY"))

def generate_summary(user_query, argo_data):
    """
    Generate a natural-language summary strictly based on ARGO data using Gemini 2.0 Flash.
    """
    context = f"""
User query: {user_query}
ARGO data sample: {argo_data}

Instructions:
- ONLY answer using the ARGO data provided above.
- Do not hallucinate extra facts.
- Provide a concise explanation suitable for oceanographic analysis.
"""

    model = genai.GenerativeModel("gemini-2.0-flash")

    # Correct Gemini 2.0 Flash structure
    response = model.generate_content(
        contents=[
            {
                "parts": [
                    {"text": context}
                ]
            }
        ]
    )

    return response.text
