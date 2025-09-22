from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.query_service import handle_query
from app.utils.response_format import build_response
import traceback

router = APIRouter()

class QueryRequest(BaseModel):
    query: str

@router.post("/query")
async def chat(request: QueryRequest):
    user_query = request.query
    if not user_query:
        raise HTTPException(status_code=400, detail="Query is required")
    try:
        print(f"[Chat] Received query: {user_query}")
        result = handle_query(user_query)
        response = build_response(result)
        return response
    except Exception as e:
        print("💥 Exception in /chat/query:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
