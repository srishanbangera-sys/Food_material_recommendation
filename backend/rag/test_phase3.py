# backend/rag/test_phase3.py — sanity check, not a permanent file
from .semantic_cache import check_cache, store_in_cache
from .vector_store import get_cache_store

_cache_collection = get_cache_store()._collection
_existing_ids = _cache_collection.get()["ids"]
if _existing_ids:
    _cache_collection.delete(ids=_existing_ids)
print(f"Cleared {len(_existing_ids)} entries from cache collection for a clean test run.\n")

# 1. Cache should be empty on a fresh question
q1 = "What packaging is best for strawberries?"
result = check_cache(q1)
print("First check (should be None — cache is empty):", result)

# 2. Manually store an answer, as if the RAG pipeline had just generated one
store_in_cache(
    question=q1,
    answer="PP Perforated Clamshell is recommended for strawberries based on their very high respiration rate and high mechanical fragility.",
    provider="gemini",
)
print("\nStored a test answer in the cache.")

# 3. Ask the SAME question again — should now be a cache hit
result_exact = check_cache(q1)
print("\nExact repeat question — cache result:")
print(result_exact)

# 4. Ask a PARAPHRASED version — should still hit if the threshold is reasonable
q2 = "Which packaging works best for strawberry?"
result_paraphrase = check_cache(q2)
print("\nParaphrased question — cache result:")
print(result_paraphrase)

# 5. Ask something UNRELATED — should be a clean miss
q3 = "What is the boiling point of water?"
result_unrelated = check_cache(q3)
print("\nUnrelated question — cache result (should be None):")
print(result_unrelated)