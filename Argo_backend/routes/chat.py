from flask import Blueprint, request, jsonify
from services.query_service import handle_query
from utils.response_format import build_response
import traceback

chat_bp = Blueprint("chat", __name__, url_prefix="/chat")

@chat_bp.route("/query", methods=["POST"])
def chat():
    data = request.get_json()
    user_query = data.get("query", "")
    if not user_query:
        return jsonify({"error": "Query is required"}), 400
    try:
        print(f"[Chat] Received query: {user_query}")
        result = handle_query(user_query)
        response = build_response(result)
        return jsonify(response), 200
    except Exception as e:
        print("💥 Exception in /chat/query:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500