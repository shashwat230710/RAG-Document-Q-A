import React from 'react';
import { BookOpen, CheckCircle2, Cpu, Database, FileText, Layers, ShieldCheck, Terminal } from 'lucide-react';

interface HeaderProps {
  healthStatus: 'ok' | 'error' | 'checking';
  docsCount: number;
  chunksCount: number;
  onOpenSpec: () => void;
  onOpenApi: () => void;
  activeTab: 'query' | 'ingest' | 'chunks' | 'eval';
  setActiveTab: (tab: 'query' | 'ingest' | 'chunks' | 'eval') => void;
}

export const Header: React.FC<HeaderProps> = ({
  healthStatus,
  docsCount,
  chunksCount,
  onOpenSpec,
  onOpenApi,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="border-b border-zinc-200 bg-white shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs">
                <Database className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900">RAG Document Q&A</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                    <ShieldCheck className="h-3 w-3" /> Reviewed Build
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  LCEL Single Retrieval · Chroma (<code className="text-zinc-700">docs</code>) · 384-dim MiniLM · FastAPI Endpoints
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status pills */}
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    healthStatus === 'ok' ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-500'
                  }`}
                />
                <span className="font-medium text-zinc-700">
                  /health: <span className="text-zinc-900">{healthStatus}</span>
                </span>
              </div>
              <span className="text-zinc-300">|</span>
              <span className="text-zinc-600">
                <strong className="text-zinc-900">{docsCount}</strong> docs
              </span>
              <span className="text-zinc-300">|</span>
              <span className="text-zinc-600">
                <strong className="text-zinc-900">{chunksCount}</strong> chunks
              </span>
            </div>

            <button
              id="spec-review-button"
              type="button"
              onClick={onOpenSpec}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              10 Issues Fixed & Spec
            </button>

            <button
              id="api-docs-button"
              type="button"
              onClick={onOpenApi}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition-colors"
            >
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              API Test (/ask & /health)
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-t border-zinc-100 pt-1">
          <nav className="flex space-x-1" aria-label="Tabs">
            <button
              id="tab-query"
              type="button"
              onClick={() => setActiveTab('query')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'query'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              <Cpu className="h-4 w-4" />
              Q&A Chain (LCEL)
            </button>

            <button
              id="tab-ingest"
              type="button"
              onClick={() => setActiveTab('ingest')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'ingest'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              Documents & Ingest ({docsCount})
            </button>

            <button
              id="tab-chunks"
              type="button"
              onClick={() => setActiveTab('chunks')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'chunks'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              <Layers className="h-4 w-4" />
              Vector Store & Chunks ({chunksCount})
            </button>

            <button
              id="tab-eval"
              type="button"
              onClick={() => setActiveTab('eval')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'eval'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              RAGAS Evaluation
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
