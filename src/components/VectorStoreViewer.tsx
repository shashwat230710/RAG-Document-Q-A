import React, { useState } from 'react';
import { Database, FileText, Hash, Layers, Search } from 'lucide-react';
import { ChunkItem } from '../types';

interface VectorStoreViewerProps {
  chunks: ChunkItem[];
  totalChunks: number;
  collection: string;
  chromaDir: string;
  onRefresh: () => void;
}

export const VectorStoreViewer: React.FC<VectorStoreViewerProps> = ({
  chunks,
  totalChunks,
  collection,
  chromaDir,
  onRefresh,
}) => {
  const [filter, setFilter] = useState('');

  const filteredChunks = chunks.filter(
    (c) =>
      c.id.toLowerCase().includes(filter.toLowerCase()) ||
      c.source.toLowerCase().includes(filter.toLowerCase()) ||
      c.snippet.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Database className="h-4 w-4" />
            <span className="text-xs font-medium">Collection & Directory</span>
          </div>
          <div className="text-sm font-bold text-zinc-900 font-mono">
            {collection} <span className="text-xs font-normal text-zinc-500">({chromaDir})</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Layers className="h-4 w-4" />
            <span className="text-xs font-medium">Indexed Chunks</span>
          </div>
          <div className="text-sm font-bold text-zinc-900">
            {totalChunks} <span className="text-xs font-normal text-zinc-500">in Chroma</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Hash className="h-4 w-4" />
            <span className="text-xs font-medium">Embedding Model</span>
          </div>
          <div className="text-sm font-bold text-zinc-900 font-mono text-xs truncate">
            all-MiniLM-L6-v2 (384-dim)
          </div>
        </div>
      </div>

      {/* Chunks List */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Chroma Vector Database Records
            </h3>
            <p className="text-xs text-zinc-500">
              Inspect deterministic IDs, source origins, and chunk snippets.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by ID, source, or text..."
              className="w-full rounded-lg border border-zinc-300 py-1.5 pl-8 pr-3 text-xs focus:border-zinc-900 focus:outline-hidden"
            />
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {filteredChunks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500">
            {totalChunks === 0
              ? 'No chunks in vector store. Go to the Ingest tab to populate Chroma.'
              : 'No chunks match filter.'}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredChunks.map((chunk) => (
              <div key={chunk.id} className="py-3.5 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-800">
                      {chunk.id}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {chunk.contentLength} chars
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-mono text-zinc-600">
                      <FileText className="h-3 w-3 text-zinc-400" />
                      {chunk.source}
                    </span>
                    <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                      p.{chunk.page + 1} (stored: {chunk.page})
                    </span>
                  </div>
                </div>

                <div className="rounded border border-zinc-100 bg-zinc-50/70 p-2.5 font-mono text-xs text-zinc-700 leading-relaxed">
                  "{chunk.snippet}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
