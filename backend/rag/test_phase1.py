# backend/rag/test_phase1.py — sanity check, not a permanent file
from .vector_store import get_knowledge_store

store = get_knowledge_store()
print("Total documents in collection:", store._collection.count())

# 1. Retrieval sanity — should surface the Strawberry profile and/or the
#    PP Perforated Clamshell material section
results = store.similarity_search("What packaging is recommended for Strawberry?", k=3)
for i, doc in enumerate(results):
    print(f"\n--- result {i+1} (source={doc.metadata.get('source')}) ---")
    print(doc.page_content[:300])

# 2. Duplicate check — confirm no two stored documents share identical content
all_docs = store._collection.get(include=["documents"])["documents"]
print("\nUnique documents:", len(set(all_docs)), "/ Total:", len(all_docs))

# 3. A DB-sourced query — should surface an actual shelf-life record
print("\n\n=== Second query: shelf life ===")
results2 = store.similarity_search("shelf life of apple in MAP High Barrier packaging", k=3)
for i, doc in enumerate(results2):
    print(f"\n--- result {i+1} (source={doc.metadata.get('source')}) ---")
    print(doc.page_content[:300])