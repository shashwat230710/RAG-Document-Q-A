import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Database,
  ExternalLink,
  Layers,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { SpecData } from '../types';

interface SpecReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecReviewModal: React.FC<SpecReviewModalProps> = ({ isOpen, onClose }) => {
  const [spec, setSpec] = useState<SpecData | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/spec')
        .then((r) => r.json())
        .then((d) => setSpec(d))
        .catch((e) => console.warn('Failed to load spec details:', e));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-zinc-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                RAG Document Q&A — Reviewed Specification
              </h2>
              <p className="text-xs text-zinc-500">
                Analysis of architecture, tech stack, 10 fixes, and future iterations from <code className="font-mono text-zinc-700">RAG_docu.pdf</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 text-sm text-zinc-700">
          {/* Architecture Stack Summary */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              Core Architectural Pillars
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div className="rounded-lg bg-white p-3 border border-zinc-200 shadow-2xs">
                <span className="font-semibold text-zinc-900 block mb-0.5">Embeddings</span>
                <span className="text-zinc-600 font-mono">all-MiniLM-L6-v2 (384-dim)</span>
                <p className="text-[11px] text-zinc-400 mt-1">Local, 0 cost per query, 0 network latency.</p>
              </div>

              <div className="rounded-lg bg-white p-3 border border-zinc-200 shadow-2xs">
                <span className="font-semibold text-zinc-900 block mb-0.5">Vector Store</span>
                <span className="text-zinc-600 font-mono">Chroma (./chroma_db)</span>
                <p className="text-[11px] text-zinc-400 mt-1">Embedded file-based store, swappable for Qdrant.</p>
              </div>

              <div className="rounded-lg bg-white p-3 border border-zinc-200 shadow-2xs">
                <span className="font-semibold text-zinc-900 block mb-0.5">LCEL Pipeline</span>
                <span className="text-zinc-600 font-mono">RunnableParallel</span>
                <p className="text-[11px] text-zinc-400 mt-1">Single retrieval for prompt context & source list.</p>
              </div>

              <div className="rounded-lg bg-white p-3 border border-zinc-200 shadow-2xs">
                <span className="font-semibold text-zinc-900 block mb-0.5">API Interface</span>
                <span className="text-zinc-600 font-mono">FastAPI / Express (/ask)</span>
                <p className="text-[11px] text-zinc-400 mt-1">422 validation, masked 500 error handling.</p>
              </div>

              <div className="rounded-lg bg-white p-3 border border-zinc-200 shadow-2xs">
                <span className="font-semibold text-zinc-900 block mb-0.5">Evaluation</span>
                <span className="text-zinc-600 font-mono">RAGAS Collections API</span>
                <p className="text-[11px] text-zinc-400 mt-1">Faithfulness, Relevancy, Precision, Recall.</p>
              </div>

              <div className="rounded-lg bg-white p-3 border border-zinc-200 shadow-2xs">
                <span className="font-semibold text-zinc-900 block mb-0.5">Generation Model</span>
                <span className="text-zinc-600 font-mono">gpt-5-mini / Gemini 3.8</span>
                <p className="text-[11px] text-zinc-400 mt-1">Current-gen model, strictly grounded prompt.</p>
              </div>
            </div>
          </div>

          {/* 10 Issues Found and Fixed */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              10 Verified Implementation Fixes from Review
            </h3>
            <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
              {spec?.issuesFixed.map((issue) => (
                <div key={issue.id} className="p-3.5 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
                      #{issue.id}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">{issue.title}</h4>
                      <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{issue.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Iterations Roadmap */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              Next Iterations Roadmap (From Spec)
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              {spec?.futureIterations.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-2xs">
                  <ChevronRight className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-zinc-800">{it}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            Close Specification View
          </button>
        </div>
      </div>
    </div>
  );
};
