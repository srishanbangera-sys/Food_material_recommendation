"""backend/rag/test_phase5.py — sanity check, not a permanent file"""
from dotenv import load_dotenv
load_dotenv(override=True)

from .pipeline import answer_question

question = "What packaging is best for strawberries?"

print("=== First call (expect a cache MISS, hits retrieval + LLM) ===")
result1 = answer_question(question)
print(result1)

print("\n=== Second call, same question (expect a cache HIT) ===")
result2 = answer_question(question)
print(result2)

print("\n=== Third call, reworded but similar (expect a cache HIT if threshold allows) ===")
result3 = answer_question("Which packaging works best for fresh strawberries?")
print(result3)