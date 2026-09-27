"""
Semantic cache: checked BEFORE retrieval or any LLM call. If a semantically
similar question has already been answered, return that cached answer
directly — this is the "same question → instant cached answer" behavior,
extended to near-duplicate phrasings too (not just byte-identical questions).
"""
import time
import uuid

from . import config
from .vector_store import get_cache_store


def check_cache(question: str) -> dict | None:
    """
    Returns a dict with the cached answer if a similar-enough question
    already exists in the cache, otherwise None (meaning: proceed to
    retrieval + LLM).
    """
    store = get_cache_store()

    if store._collection.count() == 0:
        return None

    # similarity_search_with_score returns (Document, distance) pairs.
    # Chroma's cosine distance: 0 = identical, 2 = opposite.
    results = store.similarity_search_with_score(question, k=1)

    if not results:
        return None

    doc, distance = results[0]
    similarity = 1 - distance


    if similarity >= config.CACHE_SIMILARITY_THRESHOLD:
        return {
            "answer": doc.metadata["answer"],
            "matched_question": doc.page_content,
            "similarity": round(similarity, 4),
            "provider": doc.metadata.get("provider", "unknown"),
        }
    return None


def store_in_cache(question: str, answer: str, provider: str) -> None:
    """Cache a new (question, answer) pair for future semantic lookups."""
    store = get_cache_store()
    store.add_texts(
        texts=[question],
        metadatas=[
            {
                "answer": answer,
                "provider": provider,
                "ts": time.time(),
            }
        ],
        ids=[str(uuid.uuid4())],
    )