import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, HelpCircle, Loader2, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatBox({ messages, onSendMessage, isChatting, videoLoaded }) {
  const [input, setInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isChatting) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleSuggestedQuestion = (question) => {
    if (!isChatting) {
      onSendMessage(question);
    }
  };

  const suggestedQuestions = [
    "What is the main topic covered in this video?",
    "Explain the key concepts mentioned by the speaker.",
    "What conclusion or recommendations does the speaker provide?",
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[650px]">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            Video Q&A (RAG Chat)
          </h2>
          <p className="text-xs text-slate-400">FAISS Vector Search + OpenAI Grounded Responses</p>
        </div>
        <span className="text-xs px-2.5 py-1 bg-blue-950 border border-blue-800 text-blue-300 rounded-full font-medium">
          Transcript Grounded
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl mb-3">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">Ask Anything About the Video</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-6">
              Questions are converted to embeddings and matched against transcript chunks using FAISS.
            </p>

            {videoLoaded && (
              <div className="w-full space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider text-left">Suggested Questions:</p>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="w-full text-left text-xs p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center justify-between"
                  >
                    <span>{q}</span>
                    <span className="text-blue-400 text-xs font-semibold ml-2">Ask →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none'
              }`}
            >
              {msg.sender === 'bot' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}

              {/* Source citations with timestamps */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                  <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1.5">
                    <Bookmark className="w-3 h-3 text-amber-400" /> Grounded Source Timestamps:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-amber-300 rounded text-[10px] font-mono"
                        title={src.content}
                      >
                        ⏱ {src.timestamp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isChatting && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>Searching FAISS vector index & generating answer...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!videoLoaded || isChatting}
          placeholder={videoLoaded ? "Ask a question about the video..." : "Load a video first to enable chat"}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!videoLoaded || !input.trim() || isChatting}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl flex items-center justify-center transition-colors shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
