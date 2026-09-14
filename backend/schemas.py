from pydantic import BaseModel


class PredictRequest(BaseModel):
    food_type: str
    temperature_c: float
    humidity_pct: float


class PredictResponse(BaseModel):
    food_type: str
    packaging_type: str
    predicted_shelf_life_days: float