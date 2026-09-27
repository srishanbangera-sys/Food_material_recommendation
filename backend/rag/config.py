"""
Central configuration for the RAG pipeline. All overridable via env vars.
"""
import os

# Where Chroma persists its data on disk.
CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_store")

# Path to your existing SQLite DB.
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "./food_packaging.db")

# Path to the generated PDF knowledge reference.
PDF_PATH = os.getenv("PDF_PATH", "./data/PakGenie_Packaging_Knowledge_Reference.pdf")

# --- Chunking ---
# Max characters per PDF chunk if a header-defined section is still too large.
PDF_CHUNK_SIZE = int(os.getenv("PDF_CHUNK_SIZE", "1200"))
PDF_CHUNK_OVERLAP = int(os.getenv("PDF_CHUNK_OVERLAP", "100"))

# --- Semantic cache tuning ---
CACHE_SIMILARITY_THRESHOLD = float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.90"))

# --- Retrieval ---
TOP_K_RETRIEVAL = int(os.getenv("TOP_K_RETRIEVAL", "5"))

# --- LLM fallback chain ---
# Tried in this exact order. If a provider's API key env var is missing,
# empty, or the call fails (rate limit / quota / timeout / server error),
# the pipeline automatically moves to the next provider.
LLM_PROVIDER_ORDER = os.getenv(
    "LLM_PROVIDER_ORDER", "gemini,mistral,sambanova"
).split(",")

MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "500"))

# --- Gemini ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

# --- Mistral ---
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest")

# --- SambaNova ---
SAMBANOVA_API_KEY = os.getenv("SAMBANOVA_API_KEY", "")
SAMBANOVA_MODEL = os.getenv("SAMBANOVA_MODEL", "Meta-Llama-3.3-70B-Instruct")

# NOTE: model ids change over time as vendors retire/rename tiers. If a call
# starts failing with a "model not found" style error, check that provider's
# current docs rather than assuming the id above is still valid.