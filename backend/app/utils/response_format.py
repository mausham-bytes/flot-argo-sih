# utils/response_format.py

def build_response(result: dict) -> dict:
    """
    Standardized response schema:
    - text: natural-language explanation
    - data: structured values for visualization
    - metadata: system info
    """
    return {
        "text": result.get("summary", result.get("text", "")),
        "data": result.get("data", {"records": [], "rows": 0}),
        "plots": result.get("plot", result.get("plots", [])),
        "map": result.get("map", None),
        "metadata": result.get("metadata", {
            "source": "Direct ARGO API System",
            "version": "0.1"
        })
    }
