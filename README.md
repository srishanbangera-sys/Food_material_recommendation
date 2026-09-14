# Food Packaging Prediction — Backend

FastAPI backend that predicts the best packaging type for a food item and its expected shelf life, using two trained ML models (a packaging classifier and a shelf-life regressor) backed by a SQLite database.

## Project Structure

```
backend/
├── models/
│   ├── packaging_classifier_pipeline.joblib
│   ├── packaging_label_encoder.joblib
│   └── shelf_life_regressor_pipeline.joblib
├── data/
│   ├── packaging_classifier_dataset.csv
│   └── shelf_life_regressor_dataset.csv
├── database.py        # DB connection setup
├── create_tables.py    # creates food, packaging, shelf_life_data tables
├── load_data.py          # loads the CSVs into the database
├── schemas.py              # request/response models
├── ml_models.py              # loads the 3 trained models
├── crud.py                    # database query functions
├── main.py                     # FastAPI app and /predict endpoint
└── requirements.txt
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/srishanbangera-sys/Waste_material_recommendation.git
cd backend
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the virtual environment

**Windows:**
```powershell
venv\Scripts\activate
```

**Mac / Linux:**
```bash
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Create the database tables

This creates a local `food_packaging.db` SQLite file with the `food`, `packaging`, and `shelf_life_data` tables.

```bash
python create_tables.py
```

### 6. Load the data

This populates the tables from the CSV files in `data/`.

```bash
python load_data.py
```

You should see output confirming rows were loaded:
```
Loaded 25 food rows.
Loaded 11 packaging rows.
Loaded 50 shelf_life_data rows.
```

### 7. Run the server

The 3 trained models in `models/` are **not loaded separately** — `main.py` imports `ml_models.py` at startup, which loads all 3 `.joblib` files into memory automatically the moment the server starts. There is no extra "load model" command to run.

```bash
uvicorn main:app --reload
```

You should see:
```
Models loaded successfully.
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## Testing the API

Open your browser and go to:

```
http://127.0.0.1:8000/docs
```

This opens the interactive Swagger UI.

1. Click on `POST /predict`
2. Click **Try it out**
3. Enter a request body, for example:
```json
{
  "food_type": "Mango",
  "temperature_c": 28,
  "humidity_pct": 70
}
```
4. Click **Execute**

Expected response:
```json
{
  "food_type": "Mango",
  "packaging_type": "LDPE",
  "predicted_shelf_life_days": 30.4
}
```

### Alternative: test with curl

```bash
curl.exe -X POST "http://127.0.0.1:8000/predict" -H "Content-Type: application/json" -d '{\"food_type\": \"Mango\", \"temperature_c\": 28, \"humidity_pct\": 70}'
```

