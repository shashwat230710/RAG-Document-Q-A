from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from app.config import CHROMA_DIR, EMBEDDING_MODEL, COLLECTION, K


def get_vectorstore() -> Chroma:
    return Chroma(
        collection_name=COLLECTION,
        embedding_function=HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL),
        persist_directory=CHROMA_DIR,
    )


def get_retriever(k: int | None = None):
    # `k or K` treated an explicit k=0 as "unset" and silently fell back to the
    # default K. Checking `is not None` respects an intentional k=0.
    effective_k = k if k is not None else K
    return get_vectorstore().as_retriever(search_kwargs={"k": effective_k})
