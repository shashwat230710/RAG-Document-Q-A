import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_db")
DATA_DIR = os.getenv("DATA_DIR", "./data")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-5-mini")  # cheap current-gen model; swap to ChatOllama for fully local
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))
K = int(os.getenv("K", "4"))
COLLECTION = os.getenv("COLLECTION", "docs")


def require_openai_key() -> None:
    """Fail fast with a clear message instead of a deep stack trace on first request."""
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Copy .env.example to .env and fill it in "
            "(or export it in your shell) before starting the API or running ingest/eval."
        )
