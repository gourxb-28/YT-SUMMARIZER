import React from 'react';
import { Youtube, Sparkles, BookOpen } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-600/20 text-red-500 rounded-lg flex items-center justify-center">
            <Youtube className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              YouTube Transcript Summarizer
              <span className="hidden sm:inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Sparkles className="w-3 h-3 mr-1" /> RAG Powered
              </span>
            </h1>
            <p className="text-xs text-slate-400">FastAPI • LangChain • FAISS • GPT-4o-mini</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700 hidden md:inline-block">
            College Final Year Project
          </span>
        </div>
      </div>
    </header>
  );
}
