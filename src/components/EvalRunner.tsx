import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Play,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { EvalResultData } from '../types';

export const EvalRunner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [evalData, setEvalData] = useState<EvalResultData | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchCsvResults = async () => {
    try {
      const res = await fetch('/api/eval/results');
      const data = await res.json();
      if (data.exists) {
        setCsvContent(data.content);
      }
    } catch (err) {
      console.warn('Could not fetch eval_results.csv:', err);
    }
  };

  useEffect(() => {
    fetchCsvResults();
  }, []);

  const handleRunEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/eval', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evaluation failed');

      setEvalData(data);
      await fetchCsvResults();
    } catch (err: any) {
      setError(err.message || 'Error executing RAGAS evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eval_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Modern RAGAS Header Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900">
                RAGAS Evaluation Framework (<code className="font-mono text-sm">app/eval.py</code>)
              </h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Modern API
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Fixed legacy import deprecation (Issue #9) by migrating to <code className="font-mono text-zinc-700">SingleTurnSample</code> / <code className="font-mono text-zinc-700">EvaluationDataset</code>, and reuses the single-retrieval chain.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {csvContent && (
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                eval_results.csv
              </button>
            )}

            <button
              id="run-eval-button"
              type="button"
              onClick={handleRunEvaluation}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  Running RAGAS Eval...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                  Execute Eval Pipeline
                </>
              )}
            </button>
          </div>
        </div>

        {/* Evaluation Metrics Cards */}
        {evalData && (
          <div className="grid gap-3 sm:grid-cols-4 pt-5">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3.5 text-center">
              <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">
                Faithfulness
              </span>
              <div className="text-2xl font-bold text-emerald-950 font-mono mt-0.5">
                {(evalData.averages.faithfulness * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] text-emerald-600">Grounded in context</span>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3.5 text-center">
              <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">
                Response Relevancy
              </span>
              <div className="text-2xl font-bold text-blue-950 font-mono mt-0.5">
                {(evalData.averages.response_relevancy * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] text-blue-600">Addresses user input</span>
            </div>

            <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3.5 text-center">
              <span className="text-[11px] font-medium text-violet-700 uppercase tracking-wider">
                Context Precision
              </span>
              <div className="text-2xl font-bold text-violet-950 font-mono mt-0.5">
                {(evalData.averages.context_precision * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] text-violet-600">Signal-to-noise ratio</span>
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3.5 text-center">
              <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">
                Context Recall
              </span>
              <div className="text-2xl font-bold text-amber-950 font-mono mt-0.5">
                {(evalData.averages.context_recall * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] text-amber-600">Retrieves reference facts</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Test Set Breakdown Table */}
      {evalData && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Test Set Evaluation Samples (Issue #10)
              </h3>
              <p className="text-xs text-zinc-500">
                SingleTurnSample evaluations comparing retrieved contexts, answers, and ground truth.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {evalData.samples.map((sample, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-200 p-4 bg-zinc-50/30 space-y-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Sample #{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-900 mt-0.5">
                      {sample.user_input}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Faith: {(sample.faithfulness * 100).toFixed(0)}%
                    </span>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                      Relevancy: {(sample.response_relevancy * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded border border-zinc-200 bg-white p-3">
                    <span className="font-semibold text-zinc-700 block mb-1">Generated Response:</span>
                    <p className="text-zinc-600 leading-relaxed font-sans">{sample.response}</p>
                  </div>
                  <div className="rounded border border-zinc-200 bg-white p-3">
                    <span className="font-semibold text-zinc-700 block mb-1">Ground Truth Reference:</span>
                    <p className="text-zinc-600 leading-relaxed font-sans">{sample.reference}</p>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 font-mono bg-zinc-100/60 p-2 rounded">
                  <strong>Retrieved Contexts:</strong> {sample.retrieved_contexts.join(' | ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Preview */}
      {csvContent && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Generated <code className="font-mono text-zinc-800">eval_results.csv</code> Preview
            </h3>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Download CSV
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs font-mono text-emerald-400">
            {csvContent}
          </pre>
        </div>
      )}
    </div>
  );
};
