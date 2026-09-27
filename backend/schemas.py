from pydantic import BaseModel


class PredictRequest(BaseModel):
    food_type: str
    temperature_c: float
    humidity_pct: float


class PredictResponse(BaseModel):
    food_type: str
    packaging_type: str
    predicted_shelf_life_days: float

from typing import Optional

class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    source: str                      # "cache" | "llm"
    provider: str
    similarity: Optional[float] = None
    matched_question: Optional[str] = None
    retrieved_chunks: list[str] = []
    elapsed_seconds: float