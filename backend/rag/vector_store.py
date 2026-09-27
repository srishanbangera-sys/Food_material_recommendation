"""
Owns two LangChain Chroma vector stores backed by the same persistent
directory:

  - packaging_knowledge : your domain data (SQLite rows + PDF chunks)
  - semantic_cache       : past (question -> answer) pairs
"""
from langchain_chroma import Chroma

from . import config
from .embeddings import get_embeddings

_knowledge_store = None
_cache_store = None


def get_knowledge_store() -> Chroma:
    global _knowledge_store
    if _knowledge_store is None:
        _knowledge_store = Chroma(
            collection_name="packaging_knowledge",
            embedding_function=get_embeddings(),
            persist_directory=config.CHROMA_DIR,
            collection_metadata={"hnsw:space": "cosine"},
        )
    return _knowledge_store


def get_cache_store() -> Chroma:
    global _cache_store
    if _cache_store is None:
        _cache_store = Chroma(
            collection_name="semantic_cache",
            embedding_function=get_embeddings(),
            persist_directory=config.CHROMA_DIR,
            collection_metadata={"hnsw:space": "cosine"},
        )
    return _cache_store