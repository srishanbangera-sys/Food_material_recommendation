# backend/rag/test_phase4.py — sanity check, not a permanent file
from dotenv import load_dotenv
load_dotenv()

import os
print("MISTRAL_API_KEY loaded as:", os.getenv("MISTRAL_API_KEY", "NOT SET")[:8], "...")
print("GEMINI_API_KEY loaded as:", os.getenv("GEMINI_API_KEY", "NOT SET")[:8], "...")

from .llm_client import generate_answer

context = [
    "Food: Strawberry. Respiration rate: Very High. Mechanical fragility: High. Recommended packaging: PP Perforated Clamshell.",
    "Packaging: PP Perforated Clamshell (material: PP Perforated Clamshell). OTR: 8000 cc/m2/day. WVTR: 500 g/m2/day.",
]

result = generate_answer("What packaging is best for strawberries?", context)
print("Provider that answered:", result["provider"])
print("\nAnswer:\n", result["answer"])