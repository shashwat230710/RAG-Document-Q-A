# RAG Document Q&A Starter Architecture

## Overview
This system implements a production-ready, interview-defensible Retrieval-Augmented Generation (RAG) pipeline for document question answering.

## Ingestion & Document Loaders
The starter build uses LangChain's `PyPDFDirectoryLoader`, backed by pypdf, to load every PDF in the data directory in one call. It also loads `.txt` and `.md` files using `DirectoryLoader` with `TextLoader`.

Each document is split using `RecursiveCharacterTextSplitter` with `chunk_size=800`, `chunk_overlap=120`, and hierarchical separators `["\n\n", "\n", ". ", " ", ""]`.

## Deterministic Stable Chunk IDs
To prevent duplicate chunk accumulation when re-running ingestion, each chunk receives a deterministic unique ID constructed from:
`{source}:p{page}:{index}:{digest}`
where `digest` is the first 12 characters of the SHA-256 hash of the chunk's text content. Re-ingesting upserts rather than appending duplicates.

## Vector Database & Storage
Chroma is chosen as the persistent local file-based vector database. It requires zero cloud infrastructure, runs embedded within the application environment, and can be swapped later for Qdrant or Pinecone without altering the retriever contract.

The collection name is configured as `docs` and persists in `./chroma_db`.

## Embeddings
The pipeline utilizes the local `sentence-transformers` `all-MiniLM-L6-v2` model, which produces 384-dimensional embeddings. Local embeddings eliminate per-query embedding costs and external network latency.

## Retrieval & Question Answering Chain
Retrieval operates with parameter `k=4` by default. An explicit `k=0` is respected through `effective_k = k if k is not None else K`.

The chain uses LangChain Expression Language (LCEL) with `RunnableParallel` to retrieve documents exactly ONCE per user question. Both the formatted context prompt and the citation sources list are derived from this single retrieval step, preventing double-retrieval overhead.

## Citations and Page Indexing
PDF loaders in LangChain provide 0-indexed page numbers. Citations format the page as `page_label` if present, or `page + 1` so that users and citations see human-readable `p.1` instead of `p.0`.
