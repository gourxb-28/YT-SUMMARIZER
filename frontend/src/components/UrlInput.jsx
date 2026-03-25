import React from 'react';
import { Search, Loader2, PlayCircle, AlertCircle } from 'lucide-react';

export default function UrlInput({ url, setUrl, onLoad, isLoading, error }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onLoad();
    }
  };

  const loadSampleVideo = () => {
    
    const sampleUrl = "https://www.youtube.com/watch?v=aircAruvnKk";
    setUrl(sampleUrl);
  };

  return (
    <section className="w-full max-w-4xl mx-auto my-6 px-4">
      <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-lg"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-red-600/30 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              <span>Load Video</span>
            </>
          )}
        </button>
      </form>

      {/* Demo sample link helper for quick viva presentation */}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Supported: Standard YouTube, Shorts, youtu.be</span>
        <button
          type="button"
          onClick={loadSampleVideo}
          className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
        >
          Try Sample AI Video
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-4 p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Processing Error</p>
            <p className="text-red-300/90">{error}</p>
          </div>
        </div>
      )}
    </section>
  );
}
