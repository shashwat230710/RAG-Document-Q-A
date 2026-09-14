import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { ingestDocuments, vectorStore } from './server/ragEngine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Mount API routes FIRST
  app.use(apiRouter);

  // Initialize vector store with sample documents if empty
  try {
    if (vectorStore.count() === 0) {
      console.log('Initializing vector store with documents from ./data...');
      ingestDocuments(false);
      console.log(`Vector store ready with ${vectorStore.count()} chunks.`);
    }
  } catch (err) {
    console.warn('Initial document ingestion notice:', err);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RAG Document Q&A server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
