def build_response(result: dict) -> dict:
    """
    Standardized response schema
    """
    return {
        "text": result.get("text", ""),
        "plots": result.get("plots", []),
        "map": result.get("map", None),
        "metadata": {
            "source": "ARGO Conversational System (MVP)",
            "version": "0.1"
        }
    }
