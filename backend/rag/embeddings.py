"""
Single shared embedding model for BOTH the knowledge collection and the
semantic cache collection. Using LangChain's HuggingFaceEmbeddings wrapper
so it plugs directly into langchain-chroma's Chroma class.
"""
from langchain_huggingface import HuggingFaceEmbeddings

_embeddings = None


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _embeddings