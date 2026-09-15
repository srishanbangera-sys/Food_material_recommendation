from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from database import engine
from schemas import PredictRequest, PredictResponse
from ml_models import model1, label_encoder, model2
from crud import get_food, get_packaging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    food = get_food(engine, request.food_type)
    if food is None:
        raise HTTPException(status_code=404, detail=f"Food '{request.food_type}' not found in database")

    model1_input = pd.DataFrame([{
        "Food_Type": food["food_type"],
        "Respiration_Rate": food["respiration_rate"],
        "Ethylene_Production": food["ethylene_production"],
        "Ethylene_Sensitivity": food["ethylene_sensitivity"],
        "Moisture_Content_Pct": food["moisture_content_pct"],
        "Chilling_Sensitivity": food["chilling_sensitivity"],
        "Storage_Temperature_C": request.temperature_c,
        "Relative_Humidity_Pct": request.humidity_pct,
        "Mechanical_Fragility": food["mechanical_fragility"],
    }])

    predicted_class = model1.predict(model1_input)
    packaging_type = label_encoder.inverse_transform(predicted_class)[0]

    packaging = get_packaging(engine, packaging_type)
    if packaging is None:
        raise HTTPException(status_code=500, detail=f"Predicted packaging '{packaging_type}' not found in database")

    model2_input = pd.DataFrame([{
        "Food_Type": food["food_type"],
        "Respiration_Rate": food["respiration_rate"],
        "Ethylene_Production": food["ethylene_production"],
        "Ethylene_Sensitivity": food["ethylene_sensitivity"],
        "Moisture_Content_Pct": food["moisture_content_pct"],
        "pH_Level": food["ph_level"],
        "Chilling_Sensitivity": food["chilling_sensitivity"],
        "Storage_Temperature_C": request.temperature_c,
        "Relative_Humidity_Pct": request.humidity_pct,
        "Packaging_Material_Type": packaging["packaging_type"],
        "OTR_cc_m2_day": packaging["otr"],
        "WVTR_g_m2_day": packaging["wvtr"],
    }])

    predicted_shelf_life = model2.predict(model2_input)[0]

    return PredictResponse(
        food_type=food["food_type"],
        packaging_type=packaging_type,
        predicted_shelf_life_days=round(float(predicted_shelf_life), 1)
    )