# utils/response_format.py

def build_response(result: dict) -> dict:
    """
    Standardized response schema:
    - text: natural-language explanation
    - data: structured values for visualization
    - metadata: system info
    """
    return {
        "text": result.get("text", ""),
        "data": {
            "records": result.get("cleaned_data", []),
            "rows": result.get("rows", 0),
        },
        "plots": result.get("plots", []),
        "map": result.get("map", None),
        "metadata": {
            "source": "ARGO Conversational System (MVP)",
            "version": "0.1"
        }
    }
