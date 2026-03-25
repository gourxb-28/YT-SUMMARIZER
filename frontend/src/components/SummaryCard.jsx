import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, FileCode } from 'lucide-react';

export default function SummaryCard({ summary, onSummarize, isSummarizing, videoData }) {
  const [copied, setCopied] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI Video Summary
          </h2>
          <p className="text-xs text-slate-400">Generated using LangChain & GPT-4o-mini</p>
        </div>

        <div className="flex items-center gap-2">
          {summary && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Copy Summary to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}

          <button
            onClick={onSummarize}
            disabled={isSummarizing || !videoData}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            {isSummarizing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {summary ? 'Regenerate Summary' : 'Generate Summary'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Content Body */}
      <div className="mt-4">
        {isSummarizing && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Analyzing transcript & synthesizing summary...</p>
          </div>
        )}

        {!isSummarizing && summary && (
          <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-3">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}

        {!isSummarizing && !summary && (
          <div className="py-10 text-center text-slate-500 text-sm">
            <p>Click "Generate Summary" to produce an executive overview and key takeaways.</p>
          </div>
        )}
      </div>

      {/* Collapsible Raw Transcript Drawer */}
      {videoData && videoData.timed_transcript && (
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center gap-2 font-medium">
              <FileCode className="w-4 h-4 text-blue-400" />
              {showFullTranscript ? 'Hide Raw Video Transcript' : 'View Raw Video Transcript with Timestamps'}
            </span>
            {showFullTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFullTranscript && (
            <div className="mt-3 max-h-64 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
              {videoData.timed_transcript.map((item, idx) => (
                <div key={idx} className="flex gap-3 hover:bg-slate-900/50 p-1 rounded">
                  <span className="text-amber-400 font-semibold select-none flex-shrink-0">
                    [{item.timestamp}]
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
