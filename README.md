# PakGenie Backend

FastAPI backend powering two features:

1. **Packaging Prediction** (`/predict`) — predicts the best packaging type for a food item and its expected shelf life, using two trained ML models (a packaging classifier and a shelf-life regressor) backed by a SQLite database.
2. **AI Assistant** (`/ask`) — a RAG-based chat endpoint that answers free-form questions about food packaging and shelf life, using a fallback chain of LLM providers, a Chroma vector store for retrieval, and a semantic cache for instant repeat answers.

## Project Structure

backend/
├── models/
│ ├── packaging_classifier_pipeline.joblib
│ ├── packaging_label_encoder.joblib
│ └── shelf_life_regressor_pipeline.joblib
├── data/
│ ├── packaging_classifier_dataset.csv
│ ├── shelf_life_regressor_dataset.csv
│ └── PakGenie_Packaging_Knowledge_Reference.pdf
├── rag/
│ ├── config.py # env-driven settings (LLM providers, cache threshold, etc.)
│ ├── embeddings.py # shared embedding model (all-MiniLM-L6-v2)
│ ├── vector_store.py # Chroma stores: packaging_knowledge + semantic_cache
│ ├── ingest.py # loads SQLite rows + PDF chunks into Chroma
│ ├── semantic_cache.py # checks/stores cached (question -> answer) pairs
│ ├── llm_client.py # LLM fallback chain (Gemini -> Mistral -> ...)
│ └── pipeline.py # ties cache + retrieval + LLM together (answer_question)
├── database.py # DB connection setup
├── create_tables.py # creates food, packaging, shelf_life_data tables
├── load_data.py # loads the CSVs into the database
├── schemas.py # request/response models
├── ml_models.py # loads the 3 trained ML models
├── crud.py # database query functions
├── main.py # FastAPI app, /predict and /ask endpoints
├── .env # local secrets (not committed)
├── .env.example # template showing required variables
└── requirements.txt


## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/srishanbangera-sys/Waste_material_recommendation.git
cd backend
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv
```

**Windows:**
```powershell
venv\Scripts\activate
```

**Mac / Linux:**
```bash
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

This installs `sentence-transformers`/`torch` (via `langchain-huggingface`) along with everything else — this is the heaviest part of the install, expect a few minutes and a few GB of disk usage for the packages.

### 4. Set up environment variables

Copy the example file and fill in your own keys:

```bash
cp .env.example .env       # Mac/Linux
copy .env.example .env     # Windows
```

Edit `.env` with your actual values:

GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash

MISTRAL_API_KEY=your_mistral_key
MISTRAL_MODEL=mistral-small-latest

SAMBANOVA_API_KEY=your_sambanova_key
SAMBANOVA_MODEL=Meta-Llama-3.3-70B-Instruct

LLM_PROVIDER_ORDER=gemini,mistral
LLM_MAX_TOKENS=500
CACHE_SIMILARITY_THRESHOLD=0.90
TOP_K_RETRIEVAL=5


You don't need all three LLM providers configured — `llm_client.py` skips any provider whose key is missing and falls through to the next one in `LLM_PROVIDER_ORDER`.

### 5. Create the database tables

Creates a local `food_packaging.db` SQLite file with the `food`, `packaging`, and `shelf_life_data` tables.

```bash
python create_tables.py
```

### 6. Load the data

Populates the tables from the CSVs in `data/`.

```bash
python load_data.py
```

Expected output:

Loaded 25 food rows.
Loaded 11 packaging rows.
Loaded 50 shelf_life_data rows.


### 7. Ingest data for the AI assistant

Builds the Chroma vector store (`chroma_store/`) that `/ask` retrieves from, combining the SQLite data above with the PDF knowledge reference. This also downloads the embedding model (`sentence-transformers/all-MiniLM-L6-v2`, ~90MB) from Hugging Face on first run.

```bash
python -m rag.ingest
```

Expected output:

Warning: You are sending unauthenticated requests to the HF Hub...
Loading weights: 100%|...
Ingestion complete: {'db_documents_raw': 86, 'pdf_chunks_raw': X, 'duplicates_dropped': 3, 'total_ingested': Y}


The Hugging Face warning is harmless — just a rate-limit notice, not an error. (Optional: set `HF_TOKEN` in `.env` to remove it.)

### 8. Run the server

The 3 ML models load automatically at startup via `ml_models.py` — no separate load step needed.

```bash
uvicorn main:app --reload
```

Expected output:

Models loaded successfully.
INFO: Uvicorn running on http://127.0.0.1:8000
INFO: Application startup complete.


## Testing the API

Open:

http://127.0.0.1:8000/docs

This opens the interactive Swagger UI — the easiest way to test both endpoints without dealing with terminal quoting issues (PowerShell's `curl` alias in particular is unreliable for this).

### `/predict` — packaging + shelf-life prediction

1. Click `POST /predict` → **Try it out**
2. Request body:
```json
{
  "food_type": "Mango",
  "temperature_c": 28,
  "humidity_pct": 70
}
```
3. Expected response:
```json
{
  "food_type": "Mango",
  "packaging_type": "LDPE",
  "predicted_shelf_life_days": 30.4
}
```

### `/ask` — AI assistant

1. Click `POST /ask` → **Try it out**
2. Request body:
```json
{
  "question": "What packaging is best for strawberries?"
}
```
3. Expected response:
```json
{
  "answer": "PP Perforated Clamshell is recommended for strawberries...",
  "source": "cache",
  "provider": "gemini",
  "similarity": 1.0,
  "matched_question": "What packaging is best for strawberries?",
  "retrieved_chunks": [],
  "elapsed_seconds": 0.03
}
```


.




