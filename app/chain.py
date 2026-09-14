from langchain_openai import ChatOpenAI
# from langchain_ollama import ChatOllama  # swap in for fully local
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableParallel

from app.config import LLM_MODEL
from app.retriever import get_retriever

SYSTEM_PROMPT = """You are a precise assistant answering questions strictly from the \
provided context.

Rules:
1. Use ONLY the context below. If the answer is not contained, say: \
"I don't know based on the provided documents."
2. Cite sources like [filename, p.X] when possible.
3. Be concise and factual."""

PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"),
])


def _page_display(meta: dict) -> str:
    """PyPDFLoader's `page` metadata is 0-indexed, so page 0 is a document's
    first page. Prefer the loader's human-readable `page_label` when present,
    otherwise fall back to `page + 1` so citations read p.1, not p.0."""
    if meta.get("page_label"):
        return meta["page_label"]
    if "page" in meta:
        return str(meta["page"] + 1)
    return "?"


def format_docs(docs) -> str:
    return "\n\n".join(
        f"[{d.metadata.get('source', '?')}, p.{_page_display(d.metadata)}]\n{d.page_content}"
        for d in docs
    )


def build_chain(k: int | None = None):
    """Returns a single LCEL chain that retrieves once and produces both the
    answer and the retrieved docs (for the sources list) from that one
    retrieval, instead of querying the vector store twice per request."""
    llm = ChatOpenAI(model=LLM_MODEL, temperature=0)
    # llm = ChatOllama(model="llama3.1", temperature=0)  # local fallback
    retriever = get_retriever(k)

    rag_chain = (
        RunnableParallel(docs=retriever, question=RunnablePassthrough())
        .assign(context=lambda x: format_docs(x["docs"]))
        .assign(answer=PROMPT | llm | StrOutputParser())
    )
    return rag_chain


def answer(question: str, k: int | None = None) -> dict:
    rag_chain = build_chain(k)
    result = rag_chain.invoke(question)
    return {
        "question": question,
        "answer": result["answer"],
        "sources": [
            {"source": d.metadata.get("source"), "page": _page_display(d.metadata)}
            for d in result["docs"]
        ],
    }
