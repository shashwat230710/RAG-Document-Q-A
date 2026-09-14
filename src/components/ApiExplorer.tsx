import React, { useState } from 'react';
import { CheckCircle2, Code2, Play, Terminal, X } from 'lucide-react';

interface ApiExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiExplorer: React.FC<ApiExplorerProps> = ({ isOpen, onClose }) => {
  const [endpoint, setEndpoint] = useState<'/health' | '/ask'>('/ask');
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(
      {
        question: 'Which vector database does the build use, and why?',
        k: 4,
      },
      null,
      2
    )
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseData(null);

    try {
      let res: globalThis.Response;
      if (endpoint === '/health') {
        res = await fetch('/health');
      } else {
        let parsed;
        try {
          parsed = JSON.parse(requestBody);
        } catch {
          setResponseStatus(400);
          setResponseData({ error: 'Malformed JSON in request body' });
          setLoading(false);
          return;
        }

        res = await fetch('/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });
      }

      setResponseStatus(res.status);
      const json = await res.json().catch(() => ({ text: 'Non-JSON response' }));
      setResponseData(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  const loadBlankTest = () => {
    setEndpoint('/ask');
    setRequestBody(JSON.stringify({ question: '   ', k: 4 }, null, 2));
  };

  const loadKZeroTest = () => {
    setEndpoint('/ask');
    setRequestBody(
      JSON.stringify(
        {
          question: 'What embedding model is used?',
          k: 0,
        },
        null,
        2
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-zinc-900 p-2 text-emerald-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">FastAPI Endpoint Tester</h2>
              <p className="text-xs text-zinc-500">
                Directly execute <code className="font-mono text-zinc-700">GET /health</code> and <code className="font-mono text-zinc-700">POST /ask</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 text-xs">
          {/* Quick preset tests */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-500 font-medium">Quick Test Cases:</span>
            <button
              type="button"
              onClick={() => {
                setEndpoint('/health');
              }}
              className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-700 hover:bg-zinc-100 font-mono"
            >
              GET /health
            </button>
            <button
              type="button"
              onClick={loadBlankTest}
              className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800 hover:bg-amber-100 font-mono"
            >
              Blank Question (Expect 422)
            </button>
            <button
              type="button"
              onClick={loadKZeroTest}
              className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-800 hover:bg-blue-100 font-mono"
            >
              Explicit k=0 (Expect 0 sources)
            </button>
          </div>

          {/* Endpoint selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-700">HTTP Method & Path:</span>
            <select
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value as any)}
              className="rounded border border-zinc-300 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-800"
            >
              <option value="/ask">POST /ask</option>
              <option value="/health">GET /health</option>
            </select>
          </div>

          {endpoint === '/ask' && (
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                JSON Request Body:
              </label>
              <textarea
                rows={6}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 p-3 font-mono text-xs focus:border-zinc-900 focus:outline-hidden"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 text-emerald-400" />
            {loading ? 'Sending...' : 'Send Request'}
          </button>

          {/* Response Box */}
          {responseStatus !== null && (
            <div className="space-y-2 border-t border-zinc-100 pt-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-700">Response:</span>
                <span
                  className={`rounded px-2 py-0.5 font-mono font-bold ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-100 text-emerald-800'
                      : responseStatus === 422
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  HTTP {responseStatus}
                </span>
                {responseStatus === 422 && (
                  <span className="text-zinc-500">
                    (Verified: blank question rejected by validator)
                  </span>
                )}
              </div>

              <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-emerald-400 text-xs">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
