"""
Ingestion: reads food_packaging.db (SQLite) AND the PDF knowledge reference,
turns both into LangChain Documents, embeds them, and stores them in the
`packaging_knowledge` Chroma collection.

Run from backend/:
    python -m rag.ingest
Re-run any time the DB or PDF changes — it's idempotent (same ids upsert).
"""
import hashlib
import re
import sqlite3

from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document

from . import config
from .vector_store import get_knowledge_store

# Matches the repeating running header e.g.
# "PakGenie Packaging Knowledge Reference — dataset-grounded Page 7"
RUNNING_HEADER_RE = re.compile(
    r"PakGenie Packaging Knowledge Reference\s*[—-]\s*dataset-grounded\s*Page\s*\d+",
    re.IGNORECASE,
)


def _stable_id(text: str, prefix: str) -> str:
    """Deterministic id from content hash, so re-running ingestion upserts
    instead of duplicating, and exact-duplicate content collapses to one id."""
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}-{digest}"


# ---------------------------------------------------------------------------
# SQLite -> Documents
# ---------------------------------------------------------------------------

def _rows_as_dicts(conn: sqlite3.Connection, table: str) -> list[dict]:
    cursor = conn.execute(f"SELECT * FROM {table}")
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def load_food_documents(conn: sqlite3.Connection) -> list[Document]:
    docs = []
    for record in _rows_as_dicts(conn, "food"):
        text = (
            f"Food: {record['food_type']}. "
            f"Respiration rate: {record['respiration_rate']}. "
            f"Ethylene production: {record['ethylene_production']}. "
            f"Ethylene sensitivity: {record['ethylene_sensitivity']}. "
            f"Moisture content: {record['moisture_content_pct']}%. "
            f"pH level: {record['ph_level']}. "
            f"Chilling sensitivity: {record['chilling_sensitivity']}. "
            f"Mechanical fragility: {record['mechanical_fragility']}."
        )
        docs.append(Document(
            page_content=text,
            metadata={"source": "db", "type": "food", "food_type": record["food_type"]},
        ))
    return docs


def load_packaging_documents(conn: sqlite3.Connection) -> list[Document]:
    docs = []
    for record in _rows_as_dicts(conn, "packaging"):
        text = (
            f"Packaging: {record['packaging_type']} (material: {record['material_type']}). "
            f"Oxygen Transmission Rate (OTR): {record['otr']} cc/m2/day. "
            f"Water Vapor Transmission Rate (WVTR): {record['wvtr']} g/m2/day."
        )
        docs.append(Document(
            page_content=text,
            metadata={"source": "db", "type": "packaging", "packaging_type": record["packaging_type"]},
        ))
    return docs


def load_shelf_life_documents(conn: sqlite3.Connection) -> list[Document]:
    docs = []
    try:
        records = _rows_as_dicts(conn, "shelf_life_data")
    except sqlite3.OperationalError:
        return docs
    for record in records:
        text = (
            f"Historical record: {record.get('food_type', 'Unknown food')} stored with "
            f"{record.get('packaging_type', 'unknown packaging')} at "
            f"{record.get('temperature_c', '?')}°C and {record.get('humidity_pct', '?')}% humidity "
            f"had an observed shelf life of {record.get('shelf_life_days', '?')} days."
        )
        docs.append(Document(
            page_content=text,
            metadata={"source": "db", "type": "shelf_life_record"},
        ))
    return docs


# ---------------------------------------------------------------------------
# PDF -> Documents
# ---------------------------------------------------------------------------

def load_pdf_documents(pdf_path: str) -> list[Document]:
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()

    full_text = "\n".join(page.page_content for page in pages)
    full_text = RUNNING_HEADER_RE.sub("", full_text)

    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[("#", "h1"), ("##", "h2"), ("###", "h3")],
        strip_headers=False,
    )
    header_chunks = header_splitter.split_text(full_text)

    # De-duplicate at the section level, before size-splitting runs.
    # IMPORTANT: strip markdown header lines (#, ##, ###) before hashing.
    # The splitter sometimes bundles a parent header into the same chunk
    # as the content that follows it when nothing separates them, and
    # sometimes doesn't (depends on whether a header directly precedes
    # that content) — so two chunks with IDENTICAL body text can differ
    # only in whether a header line is glued to the front. Comparing on
    # body text alone (header stripped) catches that; comparing on the
    # raw/whitespace-normalized text does not.
    HEADER_LINE_RE = re.compile(r"(?m)^#{1,6}\s.*$")

    seen_section_hashes = set()
    deduped_header_chunks = []
    for chunk in header_chunks:
        body_only = HEADER_LINE_RE.sub("", chunk.page_content)
        normalized = re.sub(r"\s+", " ", body_only).strip().lower()
        if not normalized:
            continue
        section_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        if section_hash in seen_section_hashes:
            continue
        seen_section_hashes.add(section_hash)
        deduped_header_chunks.append(chunk)

    size_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.PDF_CHUNK_SIZE,
        chunk_overlap=config.PDF_CHUNK_OVERLAP,
    )
    final_chunks = size_splitter.split_documents(deduped_header_chunks)

    # Safety-net second pass, same header-stripped comparison, at the
    # final-chunk level (in case size-splitting recombines things oddly).
    seen_hashes = set()
    deduped = []
    for chunk in final_chunks:
        body_only = HEADER_LINE_RE.sub("", chunk.page_content)
        normalized = re.sub(r"\s+", " ", body_only).strip().lower()
        if not normalized:
            continue
        content_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        if content_hash in seen_hashes:
            continue
        seen_hashes.add(content_hash)
        chunk.metadata["source"] = "pdf"
        deduped.append(chunk)

    return deduped


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def run_ingestion(db_path: str | None = None, pdf_path: str | None = None) -> dict:
    db_path = db_path or config.SQLITE_DB_PATH
    pdf_path = pdf_path or config.PDF_PATH

    conn = sqlite3.connect(db_path)
    db_docs = (
        load_food_documents(conn)
        + load_packaging_documents(conn)
        + load_shelf_life_documents(conn)
    )
    conn.close()

    pdf_docs = load_pdf_documents(pdf_path)

    raw_docs = db_docs + pdf_docs

    # De-duplicate across the WHOLE combined batch (DB + PDF), not just
    # within the PDF chunks. Two rows with identical text (e.g. two
    # shelf_life_data rows with the same food/packaging/temp/humidity/days)
    # hash to the same id, which Chroma rejects as a duplicate within one
    # upsert call. Collapsing them to one entry is safe for retrieval —
    # we just lose an exact duplicate-count signal we don't use anyway.
    seen_hashes = set()
    deduped_docs = []
    for doc in raw_docs:
        normalized = doc.page_content.strip()
        if not normalized:
            continue
        content_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        if content_hash in seen_hashes:
            continue
        seen_hashes.add(content_hash)
        deduped_docs.append(doc)

    all_ids = [
        _stable_id(doc.page_content, doc.metadata.get("source", "doc"))
        for doc in deduped_docs
    ]

    store = get_knowledge_store()
    store.add_documents(documents=deduped_docs, ids=all_ids)

    summary = {
        "db_documents_raw": len(db_docs),
        "pdf_chunks_raw": len(pdf_docs),
        "duplicates_dropped": len(raw_docs) - len(deduped_docs),
        "total_ingested": len(deduped_docs),
    }
    print(f"Ingestion complete: {summary}")
    return summary


if __name__ == "__main__":
    run_ingestion()