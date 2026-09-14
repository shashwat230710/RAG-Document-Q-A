import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator

from app.chain import answer
from app.config import require_openai_key

logger = logging.getLogger("rag_qa")


@asynccontextmanager
async def lifespan(app: FastAPI):
    require_openai_key()  # fail fast with a clear message instead of deep inside the first request
    yield


app = FastAPI(title="RAG Document Q&A", version="0.1.0", lifespan=lifespan)

# If you'll call this from a browser-based frontend on another origin, uncomment:
# from fastapi.middleware.cors import CORSMiddleware
# app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"],
#                     allow_methods=["*"], allow_headers=["*"])


class Question(BaseModel):
    question: str
    k: int | None = None

    @field_validator("question")
    @classmethod
    def question_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("question must not be blank")
        return v


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ask")
def ask(q: Question):
    try:
        return answer(q.question, q.k)
    except Exception:
        # Log the real error server-side; don't echo internals (paths, keys, stack
        # details) back to the client.
        logger.exception("/ask failed for question=%r", q.question)
        raise HTTPException(status_code=500, detail="Internal error answering the question.")
