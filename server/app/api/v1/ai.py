"""AI endpoints: NL search, recommendations, chatbot (Module 13)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.search import SearchFilters
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


class NLQuery(BaseModel):
    query: str


class ChatMessage(BaseModel):
    message: str
    history: list[dict] = []


@router.post("/parse-search", response_model=SearchFilters)
async def parse_search(data: NLQuery) -> SearchFilters:
    """Convert natural language like 'studio under 15k near Pune University' into filters."""
    return await ai_service.parse_natural_language(data.query)


@router.get("/budget-suggestion")
def budget_suggestion(city_id: str, db: Session = Depends(get_db)) -> dict:
    return ai_service.smart_budget_suggestion(db, city_id)


@router.post("/chat")
async def chatbot(data: ChatMessage) -> dict:
    """Lightweight assistant. Uses LLM when configured, else canned guidance."""
    filters = await ai_service.parse_natural_language(data.message)
    reply = (
        "I understood your requirements and prepared search filters. "
        "Tap 'Search' to see matching homes, or refine your budget and location."
    )
    return {"reply": reply, "suggested_filters": filters.model_dump(mode="json", exclude_none=True)}
