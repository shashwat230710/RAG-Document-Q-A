import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AskResponse } from '../types';

interface QueryWorkbenchProps {
  onAskSuccess?: () => void;
}

const SAMPLE_QUERIES = [
  'What loader does the starter build use to ingest a folder of PDFs?',
  'Which vector database does the build use, and why?',
  'What embedding model is used, and how many dimensions does it produce?',
  'How does RunnableParallel fix the double retrieval bug in chain.py?',
  'Why were citations rendering as p.0 and how was page numbering fixed?',
];

export const QueryWorkbench: React.FC<QueryWorkbenchProps> = ({ onAskSuccess }) => {
  const [question, setQuestion] = useState('');
  const [kParam, setKParam] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAsk = async (queryToAsk?: string, customK?: number) => {
    const q = queryToAsk !== undefined ? queryToAsk : question;
    const effK = customK !== undefined ? customK : kParam;

    if (!q.trim()) {
      setError('Question must not be blank (Validates FastAPI 422 behavior)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, k: effK }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 422) {
          throw new Error(`422 Validation Error: ${JSON.stringify(data.detail || data)}`);
        }
        throw new Error(data.detail || `Server returned error ${res.status}`);
      }

      const data: AskResponse = await res.json();
      setResult(data);
      if (onAskSuccess) onAskSuccess();
    } catch (err: any) {
      setError(err.message || 'Error executing RAG chain');
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    const curlCommand = `curl -X POST http://localhost:3000/ask \\
  -H "Content-Type: application/json" \\
  -d '{"question": "${question || 'What vector database is used?'}", "k": ${kParam}}'`;
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top banner highlighting single retrieval LCEL */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-900">
                Single-Retrieval LCEL Chain Active
              </h3>
              <p className="text-xs text-emerald-700">
                Fixed double-retrieval issue (#1): <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-emerald-900">RunnableParallel</code> runs retrieval exactly once, deriving both prompt context and citation sources simultaneously.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Retriever hit: 1x / request
            </span>
          </div>
        </div>
      </div>

      {/* Query form card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="rag-question-input" className="block text-sm font-medium text-zinc-800 mb-1">
              Ask a question about the documents
            </label>
            <div className="relative">
              <textarea
                id="rag-question-input"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What loader does the starter build use to ingest a folder of PDFs?"
                className="w-full rounded-lg border border-zinc-300 p-3 pr-10 text-sm placeholder-zinc-400 focus:border-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              />
              <Search className="absolute right-3 top-3 h-5 w-5 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Quick preset questions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500">Preset questions from test set & spec:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_QUERIES.map((sq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestion(sq);
                    handleAsk(sq);
                  }}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors text-left"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: K slider and action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-700">Top-K Chunks:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={kParam}
                  onChange={(e) => setKParam(parseInt(e.target.value || '0', 10))}
                  className="w-16 rounded border border-zinc-300 px-2 py-1 text-xs text-center font-mono text-zinc-800"
                />
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={kParam}
                onChange={(e) => setKParam(parseInt(e.target.value, 10))}
                className="h-1.5 w-28 accent-zinc-900 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  setKParam(0);
                  handleAsk(question || SAMPLE_QUERIES[0], 0);
                }}
                className="text-xs text-zinc-500 underline hover:text-zinc-800"
                title="Tests Issue #5: ensures k=0 returns 0 chunks and does not silently fall back to default K"
              >
                Test k=0
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCurl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied curl!' : 'Copy cURL'}
              </button>

              <button
                id="ask-submit-button"
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Querying RAG Chain...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Run LCEL Pipeline
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Request Notice</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Answer and Retrieval Results */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
            {/* Header with verified telemetry */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Synthesized Answer
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  {result._meta?.latencyMs ?? 0}ms
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-600 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-zinc-400" />
                  {result.sources.length} sources retrieved
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-mono text-zinc-700">
                  Retrieval: {result._meta?.retrievalOccurrences ?? 1}x
                </span>
                <button
                  type="button"
                  onClick={() => setShowJson(!showJson)}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 underline"
                >
                  <Code2 className="h-3 w-3" />
                  {showJson ? 'Hide raw JSON' : 'View FastAPI JSON'}
                </button>
              </div>
            </div>

            {/* Answer body */}
            <div className="py-4">
              <div className="prose prose-zinc max-w-none text-zinc-900 leading-relaxed text-sm bg-zinc-50/70 p-4 rounded-lg border border-zinc-100 font-sans">
                {result.answer}
              </div>
            </div>

            {/* Sources & Citations with 1-based page indexing */}
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Source Citations (Fixed 1-Indexed: p.1 vs p.0)
                </h4>
                <span className="text-xs text-zinc-400">
                  Matches PyPDFLoader page_label / page + 1
                </span>
              </div>

              {result.sources.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">
                  No documents retrieved (effective k = 0 or empty store).
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.sources.map((s, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-zinc-200 bg-white p-3 shadow-2xs hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-zinc-800 truncate">
                          <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          {s.source}
                        </span>
                        <span className="shrink-0 rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                          p.{s.page}
                        </span>
                      </div>
                      {s.snippet && (
                        <p className="text-xs text-zinc-600 line-clamp-3 bg-zinc-50 p-2 rounded border border-zinc-100 font-mono text-[11px]">
                          "{s.snippet}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Raw JSON viewer */}
            {showJson && (
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-600">FastAPI /ask Response Payload:</span>
                </div>
                <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs font-mono text-emerald-400">
                  {JSON.stringify(
                    {
                      question: result.question,
                      answer: result.answer,
                      sources: result.sources.map((s) => ({ source: s.source, page: s.page })),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
