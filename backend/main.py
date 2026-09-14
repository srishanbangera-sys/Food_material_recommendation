from fastapi import FastAPI, HTTPException
import pandas as pd

from database import engine
from schemas import PredictRequest, PredictResponse
from ml_models import model1, label_encoder, model2
from crud import get_food, get_packaging

app = FastAPI()


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    # Step 1: fetch food row from DB
    food = get_food(engine, request.food_type)
    if food is None:
        raise HTTPException(status_code=404, detail=f"Food '{request.food_type}' not found in database")

    # Step 2: build Model 1 input
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

    # Step 3: run Model 1
    predicted_class = model1.predict(model1_input)
    packaging_type = label_encoder.inverse_transform(predicted_class)[0]

    # Step 4: fetch packaging row from DB
    packaging = get_packaging(engine, packaging_type)
    if packaging is None:
        raise HTTPException(status_code=500, detail=f"Predicted packaging '{packaging_type}' not found in database")

    # Step 5: build Model 2 input
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

    # Step 6: run Model 2
    predicted_shelf_life = model2.predict(model2_input)[0]

    # Step 7: return response
    return PredictResponse(
        food_type=food["food_type"],
        packaging_type=packaging_type,
        predicted_shelf_life_days=round(float(predicted_shelf_life), 1)
    )