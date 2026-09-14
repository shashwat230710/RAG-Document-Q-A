# RAG Document Q&A

## Run locally

1. `python -m venv .venv && source .venv/bin/activate`
   (Windows: `.venv\Scripts\activate`)
2. `pip install -r requirements.txt`
3. `cp .env.example .env` — then fill in `OPENAI_API_KEY`
4. Drop PDFs/notes into `./data`
5. `python -m app.ingest`
   - Safe to re-run after adding new files — chunks are upserted by a stable
     ID, not duplicated.
   - Run `python -m app.ingest --reset` after changing `CHUNK_SIZE`/`CHUNK_OVERLAP`
     or removing source files, so stale chunks from the old settings don't
     linger in the collection.
6. `./run.sh` -> http://localhost:8000/docs

## Eval

Edit `TEST_SET` in `app/eval.py` with 5-10 real question/ground-truth pairs
from your own documents (the three checked in are placeholders so the script
runs out of the box), then: `python -m app.eval`

## Notes

- Default LLM is `gpt-5-mini` — cheap and current as of writing. `gpt-4o-mini`
  still works via the API but OpenAI has been steering usage toward the
  GPT-5 family; swap `LLM_MODEL` in `.env` if you'd rather use something else,
  or point `app/chain.py` at `ChatOllama` for a fully local/offline setup.
- `langchain-community` (used for `PyPDFDirectoryLoader`/`DirectoryLoader`)
  was archived/sunset upstream in June 2026. It still works and is still what
  LangChain's own docs show for these loaders, but it won't get further bug
  or security fixes — worth rechecking LangChain's docs periodically for a
  replacement.
