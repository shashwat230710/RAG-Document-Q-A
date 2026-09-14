import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';
import {
  executeRAGChain,
  ingestDocuments,
  loadAllDocumentsFromDataDir,
  runRagasEvaluation,
  vectorStore,
} from './ragEngine';

export const apiRouter = express.Router();

// FastAPI-compatible Health Endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// FastAPI-compatible /ask Endpoint
apiRouter.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question, k } = req.body || {};

    // Pydantic-like validation: reject blank questions with 422 (Issue #7 fix)
    if (typeof question !== 'string' || !question.trim()) {
      return res.status(422).json({
        detail: [
          {
            loc: ['body', 'question'],
            msg: 'question must not be blank',
            type: 'value_error',
          },
        ],
      });
    }

    // Explicit k check: respects k=0 (Issue #5 fix)
    const parsedK = k !== undefined && k !== null ? parseInt(String(k), 10) : undefined;

    const result = await executeRAGChain(question, parsedK);

    // Matches exact FastAPI return shape from chain.py / api.py:
    // { "question": question, "answer": result["answer"], "sources": [{"source": ..., "page": ...}] }
    return res.status(200).json({
      question: result.question,
      answer: result.answer,
      sources: result.sources.map((s) => ({
        source: s.source,
        page: s.page,
      })),
      // Metadata for UI workbench (latency, retrieval occurrences, count)
      _meta: {
        latencyMs: result.latencyMs,
        retrievedDocsCount: result.retrievedDocsCount,
        retrievalOccurrences: result.retrievalOccurrences,
      },
    });
  } catch (error) {
    // Log real error server-side; DO NOT echo internals to caller (Issue #7 fix)
    console.error('/ask failed:', error);
    return res.status(500).json({ detail: 'Internal error answering the question.' });
  }
});

// Document management endpoints
apiRouter.get('/api/documents', (req: Request, res: Response) => {
  try {
    const docs = loadAllDocumentsFromDataDir();
    return res.status(200).json({
      documents: docs.map((d) => ({
        name: d.name,
        path: d.path,
        size: d.content.length,
        pagesCount: d.pages.length,
        preview: d.content.slice(0, 200) + (d.content.length > 200 ? '...' : ''),
      })),
      total: docs.length,
      dataDir: CONFIG.DATA_DIR,
    });
  } catch (error) {
    console.error('Failed to list documents:', error);
    return res.status(500).json({ error: 'Failed to list documents' });
  }
});

apiRouter.post('/api/documents', (req: Request, res: Response) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required.' });
    }

    const safeName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const dataDir = path.resolve(process.cwd(), CONFIG.DATA_DIR);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, safeName);
    fs.writeFileSync(filePath, content, 'utf-8');

    return res.status(201).json({
      success: true,
      file: safeName,
      path: `data/${safeName}`,
      size: content.length,
    });
  } catch (error) {
    console.error('Failed to create document:', error);
    return res.status(500).json({ error: 'Failed to create document.' });
  }
});

apiRouter.delete('/api/documents/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const safeName = path.basename(filename);
    const filePath = path.resolve(process.cwd(), CONFIG.DATA_DIR, safeName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ success: true, deleted: safeName });
    } else {
      return res.status(404).json({ error: 'File not found.' });
    }
  } catch (error) {
    console.error('Failed to delete document:', error);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
});

// Ingestion endpoint (handles standard run and --reset)
apiRouter.post('/api/ingest', (req: Request, res: Response) => {
  try {
    const { reset } = req.body || {};
    const result = ingestDocuments(Boolean(reset));
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Ingest failed:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Ingestion failed.',
    });
  }
});

// Inspect Chunks in Chroma vector store
apiRouter.get('/api/chunks', (req: Request, res: Response) => {
  const all = vectorStore.getAll();
  return res.status(200).json({
    totalChunks: all.length,
    collection: CONFIG.COLLECTION,
    chromaDir: CONFIG.CHROMA_DIR,
    chunks: all.slice(0, 100).map((c) => ({
      id: c.id,
      source: c.source,
      page: c.page,
      index: c.index,
      snippet: c.content.slice(0, 160) + (c.content.length > 160 ? '...' : ''),
      contentLength: c.content.length,
    })),
  });
});

// RAGAS Evaluation endpoint
apiRouter.post('/api/eval', async (req: Request, res: Response) => {
  try {
    const evalOutput = await runRagasEvaluation();
    return res.status(200).json({
      success: true,
      ...evalOutput,
    });
  } catch (error) {
    console.error('Evaluation run failed:', error);
    return res.status(500).json({ error: 'Evaluation failed.' });
  }
});

// Read eval_results.csv
apiRouter.get('/api/eval/results', (req: Request, res: Response) => {
  try {
    const csvPath = path.resolve(process.cwd(), 'eval_results.csv');
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      return res.status(200).json({ exists: true, content: csvContent });
    }
    return res.status(200).json({ exists: false, content: '' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to read evaluation CSV.' });
  }
});

// Return specification details from the review
apiRouter.get('/api/spec', (req: Request, res: Response) => {
  res.status(200).json({
    title: 'RAG Document Q&A — Reviewed Build (fixed & tested)',
    stack: {
      embeddings: `${CONFIG.EMBEDDING_MODEL} (384-dimensional local sentence-transformers)`,
      vectorDb: `Chroma (${CONFIG.COLLECTION} in ${CONFIG.CHROMA_DIR})`,
      lcel: 'LangChain Expression Language single-retrieval pipeline',
      api: 'FastAPI / Express compatible (GET /health, POST /ask)',
      eval: 'RAGAS current collections-based API (Faithfulness, ResponseRelevancy, ContextPrecision, ContextRecall)',
      llm: CONFIG.LLM_MODEL,
    },
    issuesFixed: [
      {
        id: 1,
        title: 'Double-retrieval bug in chain.py',
        description:
          'Original called retriever twice per request (once for sources, once for context). Rebuilt with RunnableParallel so retrieval happens exactly once.',
      },
      {
        id: 2,
        title: 'Empty ./data crash in ingest.py',
        description:
          'Added guard raising clear SystemExit before touching embedding model or Chroma when no supported files exist.',
      },
      {
        id: 3,
        title: 'Duplicate chunk accumulation on re-ingest',
        description:
          'Constructed deterministic per-chunk IDs (source + page + content hash) for idempotent upserts; added --reset flag.',
      },
      {
        id: 4,
        title: 'Citations rendered as p.0 for page 1',
        description:
          'PyPDFLoader 0-indexing addressed: prefers page_label if present, else formats page + 1.',
      },
      {
        id: 5,
        title: 'k=0 ignored in retriever.py',
        description:
          'Fixed k or K fallback which treated 0 as unset; changed to k if k is not None else K.',
      },
      {
        id: 6,
        title: 'Missing .gitignore and leaked API key risk',
        description:
          'Created template .env.example with placeholders and comprehensive .gitignore covering .env, chroma_db/, .venv/, etc.',
      },
      {
        id: 7,
        title: 'Blank questions and leaked exceptions in /ask',
        description:
          'Added Pydantic validator rejecting blank inputs (422), logged errors server-side with generic 500 message.',
      },
      {
        id: 8,
        title: 'Late failure when API key is missing',
        description:
          'Added lifespan startup check that fails fast with clear guidance before serving requests.',
      },
      {
        id: 9,
        title: 'Deprecated legacy RAGAS metric imports in eval.py',
        description:
          'Rewrote eval.py against current collections-based API (SingleTurnSample / EvaluationDataset) with judge LLM & embeddings wrappers.',
      },
      {
        id: 10,
        title: 'Placeholder single-row test set',
        description:
          'Populated TEST_SET with 3 runnable question/ground-truth pairs about the system architecture.',
      },
    ],
    futureIterations: [
      'Hybrid Retrieval (BM25 lexical + dense vector search with Reciprocal Rank Fusion)',
      'Cross-Encoder Re-Ranking (Cohere / bge-reranker-large on top 20 retrieved candidates)',
      'Structured Output Citations (JSON schema with character offsets)',
      'Vector Store Migration: Chroma -> Qdrant for production scale & HNSW index tuning',
    ],
  });
});
