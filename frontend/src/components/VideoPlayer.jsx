import React from 'react';
import { FileText, Clock, ExternalLink } from 'lucide-react';

export default function VideoPlayer({ videoData }) {
  if (!videoData) return null;

  const { video_id, embed_url, word_count, timed_transcript } = videoData;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* 16:9*/}
      <div className="relative w-full pt-[56.25%] bg-black">
        <iframe
          src={`${embed_url}?rel=0`}
          title="YouTube Video Player"
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      {/* Video Details & Transcript Statistics */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-900/60 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <FileText className="w-4 h-4 text-blue-400" />
            <strong className="text-white">{word_count?.toLocaleString()}</strong> Words in Transcript
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-4 h-4 text-emerald-400" />
            <strong className="text-white">{timed_transcript?.length || 0}</strong> Timed Snippets
          </span>
        </div>

        <a
          href={`https://www.youtube.com/watch?v=${video_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          Watch on YouTube <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
