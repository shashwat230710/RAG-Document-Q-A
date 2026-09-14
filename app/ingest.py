"""Ingest PDFs/text from ./data into Chroma.

Run:
    python -m app.ingest            # add/update chunks from ./data
    python -m app.ingest --reset    # wipe the collection first, then re-ingest everything

Re-running this without --reset is safe: each chunk gets a deterministic ID
derived from its source path + position + content hash, so re-ingesting the
same files upserts (overwrites) instead of appending duplicates. If you only
added new files, plain re-run is enough. If you changed CHUNK_SIZE/OVERLAP or
removed source files, use --reset so stale chunks from the old chunking don't
linger alongside the new ones.
"""
import argparse
import hashlib
from pathlib import Path

from langchain_community.document_loaders import (
    PyPDFDirectoryLoader, DirectoryLoader, TextLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from app.config import (CHROMA_DIR, DATA_DIR, EMBEDDING_MODEL,
                         CHUNK_SIZE, CHUNK_OVERLAP, COLLECTION)


def load_documents(data_dir: Path) -> list:
    docs = []
    docs += PyPDFDirectoryLoader(str(data_dir)).load()
    docs += DirectoryLoader(str(data_dir), glob="**/*.txt", loader_cls=TextLoader).load()
    docs += DirectoryLoader(str(data_dir), glob="**/*.md", loader_cls=TextLoader).load()
    print(f"Loaded {len(docs)} documents from {data_dir}")
    return docs


def split_documents(docs):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    print(f"Split into {len(chunks)} chunks")
    return chunks


def stable_ids(chunks) -> list[str]:
    """Deterministic per-chunk ID so re-running ingest upserts instead of duplicating."""
    ids = []
    for i, c in enumerate(chunks):
        source = c.metadata.get("source", "unknown")
        page = c.metadata.get("page", 0)
        digest = hashlib.sha256(c.page_content.encode("utf-8")).hexdigest()[:12]
        ids.append(f"{source}:p{page}:{i}:{digest}")
    return ids


def embed_and_store(chunks, reset: bool = False):
    if not chunks:
        raise SystemExit(
            "No chunks to ingest. Check that ./data contains readable PDF/.txt/.md files "
            "before running ingest (an empty or unsupported data/ folder used to fail deep "
            "inside Chroma with a confusing error)."
        )

    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    db = Chroma(
        collection_name=COLLECTION,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR,
    )

    if reset:
        existing = db.get()["ids"]
        if existing:
            db.delete(ids=existing)
            print(f"Reset: cleared {len(existing)} existing chunks from '{COLLECTION}'")

    ids = stable_ids(chunks)
    db.add_documents(documents=chunks, ids=ids)
    print(f"Stored/updated {len(chunks)} chunks in Chroma @ {CHROMA_DIR}")
    return db


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true",
                         help="Clear the collection before ingesting (use after changing "
                              "CHUNK_SIZE/OVERLAP or removing source files).")
    args = parser.parse_args()

    data_dir = Path(DATA_DIR)
    if not data_dir.exists():
        raise SystemExit(f"Put PDFs/notes in {data_dir} first.")

    embed_and_store(split_documents(load_documents(data_dir)), reset=args.reset)


if __name__ == "__main__":
    main()
