"""
Phase 5: End-to-end RAG pipeline. Wires together, in order:

  1. Semantic cache check   (rag.semantic_cache)
  2. Retrieval               (rag.vector_store — packaging_knowledge collection)
  3. LLM fallback chain      (rag.llm_client)
  4. Cache write-back        (rag.semantic_cache)

This is the single entry point the rest of the app (e.g. an API route)
should call to answer a user's question.
"""
import time

from . import config
from .llm_client import generate_answer
from .semantic_cache import check_cache, store_in_cache
from .vector_store import get_knowledge_store


def answer_question(question: str) -> dict:
    """
    Returns a dict:
      {
        "answer": str,
        "source": "cache" | "llm",
        "provider": str,          # which LLM answered, or the provider
                                   # that originally answered a cache hit
        "similarity": float | None,   # only present on cache hits
        "matched_question": str | None,  # only present on cache hits
        "retrieved_chunks": list[str],   # empty on cache hits
        "elapsed_seconds": float,
      }
    """
    start = time.time()

    # 1. Semantic cache check — skip retrieval + LLM entirely on a hit.
    cached = check_cache(question)
    if cached is not None:
        return {
            "answer": cached["answer"],
            "source": "cache",
            "provider": cached["provider"],
            "similarity": cached["similarity"],
            "matched_question": cached["matched_question"],
            "retrieved_chunks": [],
            "elapsed_seconds": round(time.time() - start, 3),
        }

    # 2. Retrieval — top-k similar chunks from the packaging_knowledge store.
    store = get_knowledge_store()
    docs = store.similarity_search(question, k=config.TOP_K_RETRIEVAL)
    context_chunks = [doc.page_content for doc in docs]

    if not context_chunks:
        # No relevant knowledge at all — still let the LLM answer, but it
        # will fall back to "I don't have enough recorded data" per the
        # system prompt in llm_client.py, since context will be empty.
        context_chunks = []

    # 3. LLM fallback chain.
    result = generate_answer(question, context_chunks)
    answer = result["answer"]
    provider = result["provider"]

    # 4. Cache write-back — so the *next* similar question is instant.
    store_in_cache(question, answer, provider)

    return {
        "answer": answer,
        "source": "llm",
        "provider": provider,
        "similarity": None,
        "matched_question": None,
        "retrieved_chunks": context_chunks,
        "elapsed_seconds": round(time.time() - start, 3),
    }