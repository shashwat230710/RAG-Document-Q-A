import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QueryWorkbench } from './components/QueryWorkbench';
import { IngestPipeline } from './components/IngestPipeline';
import { VectorStoreViewer } from './components/VectorStoreViewer';
import { EvalRunner } from './components/EvalRunner';
import { SpecReviewModal } from './components/SpecReviewModal';
import { ApiExplorer } from './components/ApiExplorer';
import { ChunkItem, DocumentItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'query' | 'ingest' | 'chunks' | 'eval'>('query');
  const [healthStatus, setHealthStatus] = useState<'ok' | 'error' | 'checking'>('checking');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [collection, setCollection] = useState('docs');
  const [chromaDir, setChromaDir] = useState('./chroma_db');

  const [isSpecOpen, setIsSpecOpen] = useState(false);
  const [isApiOpen, setIsApiOpen] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await fetch('/health');
      if (res.ok) {
        setHealthStatus('ok');
      } else {
        setHealthStatus('error');
      }
    } catch {
      setHealthStatus('error');
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.warn('Failed to load documents:', err);
    }
  };

  const loadChunks = async () => {
    try {
      const res = await fetch('/api/chunks');
      const data = await res.json();
      if (data.chunks) {
        setChunks(data.chunks);
        setTotalChunks(data.totalChunks || data.chunks.length);
        if (data.collection) setCollection(data.collection);
        if (data.chromaDir) setChromaDir(data.chromaDir);
      }
    } catch (err) {
      console.warn('Failed to load chunks:', err);
    }
  };

  useEffect(() => {
    checkHealth();
    loadDocuments();
    loadChunks();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Header
        healthStatus={healthStatus}
        docsCount={documents.length}
        chunksCount={totalChunks}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSpec={() => setIsSpecOpen(true)}
        onOpenApi={() => setIsApiOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'query' && (
          <QueryWorkbench
            onAskSuccess={() => {
              loadChunks();
            }}
          />
        )}

        {activeTab === 'ingest' && (
          <IngestPipeline
            documents={documents}
            onRefreshDocuments={() => {
              loadDocuments();
              loadChunks();
            }}
            onIngestSuccess={() => {
              loadDocuments();
              loadChunks();
            }}
          />
        )}

        {activeTab === 'chunks' && (
          <VectorStoreViewer
            chunks={chunks}
            totalChunks={totalChunks}
            collection={collection}
            chromaDir={chromaDir}
            onRefresh={() => {
              loadChunks();
            }}
          />
        )}

        {activeTab === 'eval' && <EvalRunner />}
      </main>

      <SpecReviewModal isOpen={isSpecOpen} onClose={() => setIsSpecOpen(false)} />
      <ApiExplorer isOpen={isApiOpen} onClose={() => setIsApiOpen(false)} />
    </div>
  );
}
