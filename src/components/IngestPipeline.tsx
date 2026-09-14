import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FilePlus2,
  FileText,
  Hash,
  Layers,
  RefreshCw,
  RotateCcw,
  Sliders,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { DocumentItem } from '../types';

interface IngestPipelineProps {
  documents: DocumentItem[];
  onRefreshDocuments: () => void;
  onIngestSuccess: () => void;
}

export const IngestPipeline: React.FC<IngestPipelineProps> = ({
  documents,
  onRefreshDocuments,
  onIngestSuccess,
}) => {
  const [resetCollection, setResetCollection] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestLog, setIngestLog] = useState<{
    success: boolean;
    documentsCount: number;
    chunksCount: number;
    upsertedCount: number;
    resetPerformed: boolean;
    collection: string;
  } | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  // New doc creation state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [creating, setCreating] = useState(false);

  const handleRunIngest = async () => {
    setIngesting(true);
    setIngestError(null);
    setIngestLog(null);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: resetCollection }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ingestion failed');
      }

      setIngestLog(data);
      onIngestSuccess();
    } catch (err: any) {
      setIngestError(err.message || 'Ingestion execution error');
    } finally {
      setIngesting(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocContent.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDocName, content: newDocContent }),
      });
      if (!res.ok) throw new Error('Failed to create file');

      setShowAddModal(false);
      setNewDocName('');
      setNewDocContent('');
      onRefreshDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to save document');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete file');
      onRefreshDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card: Ingest Architecture & Fixes */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              Document Ingestion & Chunking Pipeline (<code className="font-mono text-sm">app/ingest.py</code>)
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Loads from <code className="font-mono text-zinc-700">./data</code>, splits with <code className="font-mono text-zinc-700">RecursiveCharacterTextSplitter</code> (size: 800, overlap: 120), and stores in Chroma collection <code className="font-mono text-zinc-700">docs</code>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
            >
              <FilePlus2 className="h-3.5 w-3.5 text-zinc-500" />
              Add Document
            </button>

            <button
              id="run-ingest-button"
              type="button"
              onClick={handleRunIngest}
              disabled={ingesting}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {ingesting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  Running Ingest...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                  Run Ingestion
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration flags and fixes */}
        <div className="grid gap-4 sm:grid-cols-2 pt-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                Collection Reset Mode (<code className="font-mono text-[11px]">--reset</code>)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetCollection}
                  onChange={(e) => setResetCollection(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              When toggled ON, wipes existing Chroma chunks before re-indexing. Recommended when changing <code className="font-mono">CHUNK_SIZE</code> or removing files so old chunks don't linger.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Hash className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-zinc-800">
                Deterministic Stable Chunk IDs (Issue #3)
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-mono">
              id = f"&#123;source&#125;:p&#123;page&#125;:&#123;i&#125;:&#123;sha256(content)[:12]&#125;"
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Re-running ingest without <code className="font-mono">--reset</code> safely <strong>upserts</strong> chunks instead of duplicating them.
            </p>
          </div>
        </div>

        {/* Ingest Logs / Result Notice */}
        {ingestLog && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Ingestion Succeeded
            </div>
            <p className="mt-1">
              Processed <strong>{ingestLog.documentsCount}</strong> documents into <strong>{ingestLog.chunksCount}</strong> chunks.{' '}
              {ingestLog.resetPerformed && <span className="font-medium text-amber-700">(Collection was wiped first)</span>}{' '}
              Total active chunks in collection <code className="font-mono text-emerald-950 font-bold">{ingestLog.collection}</code>: <strong>{ingestLog.upsertedCount}</strong>.
            </p>
          </div>
        )}

        {ingestError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Ingestion Guard (Issue #2 fix)
            </div>
            <p className="mt-1">{ingestError}</p>
          </div>
        )}
      </div>

      {/* Documents in ./data */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Source Documents in <code className="font-mono text-zinc-700">./data</code> ({documents.length})
            </h3>
            <p className="text-xs text-zinc-500">
              Files read by <code className="font-mono text-zinc-600">PyPDFDirectoryLoader</code> and <code className="font-mono text-zinc-600">DirectoryLoader</code>.
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500">
            <FileText className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
            No files in ./data. Add a file to avoid the empty folder exception!
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {documents.map((doc, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                <div className="flex items-start gap-2.5">
                  <FileText className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900 font-mono">{doc.name}</span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                        {doc.pagesCount} page{doc.pagesCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {(doc.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5 font-sans">
                      {doc.preview}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc.name)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors rounded hover:bg-zinc-50"
                    title={`Delete ${doc.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-zinc-900 mb-1">Create Document in ./data</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Add Markdown, plain text, or notes for the RAG ingestion pipeline.
            </p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Filename (e.g. <code className="font-mono">system_guide.md</code>)
                </label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="custom_manual.md"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs focus:border-zinc-900 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Document Text Content
                </label>
                <textarea
                  rows={8}
                  required
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="# Technical Guide&#10;&#10;Explain system details, architecture facts, or project notes here..."
                  className="w-full rounded-lg border border-zinc-300 p-3 text-xs focus:border-zinc-900 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
