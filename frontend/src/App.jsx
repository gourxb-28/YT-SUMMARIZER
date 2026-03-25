import React, { useState } from 'react';
import Navbar from './components/Navbar';
import UrlInput from './components/UrlInput';
import VideoPlayer from './components/VideoPlayer';
import SummaryCard from './components/SummaryCard';
import ChatBox from './components/ChatBox';
import { fetchTranscript, fetchSummary, sendChatMessage } from './api';

export default function App() {
  const [url, setUrl] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [summary, setSummary] = useState('');
  const [messages, setMessages] = useState([]);
  
  // Loading & Error States
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Video Transcript & Embed Info
  const handleLoadVideo = async () => {
    if (!url.trim()) return;

    setIsLoadingVideo(true);
    setErrorMessage('');
    setSummary('');
    setMessages([]);

    try {
      const data = await fetchTranscript(url.trim());
      setVideoData(data);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Failed to load video and transcript.';
      setErrorMessage(detail);
      setVideoData(null);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // 2. Generate Summary
  const handleSummarize = async () => {
    if (!videoData) return;

    setIsSummarizing(true);
    setErrorMessage('');

    try {
      const data = await fetchSummary(videoData.video_id, url);
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Failed to generate summary.';
      setErrorMessage(detail);
    } finally {
      setIsSummarizing(false);
    }
  };

  // 3. Send Question to RAG Chat
  const handleSendMessage = async (questionText) => {
    if (!videoData || !questionText) return;

    // Add user question to chat
    const userMessage = { sender: 'user', text: questionText };
    setMessages((prev) => [...prev, userMessage]);
    setIsChatting(true);

    try {
      const response = await sendChatMessage(videoData.video_id, questionText);
      const botMessage = {
        sender: 'bot',
        text: response.answer,
        sources: response.sources || []
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Failed to get answer.';
      const errorMessage = {
        sender: 'bot',
        text: `⚠️ **Error:** ${detail}`
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search URL Input */}
        <UrlInput
          url={url}
          setUrl={setUrl}
          onLoad={handleLoadVideo}
          isLoading={isLoadingVideo}
          error={errorMessage}
        />

        {/* Content Workspace */}
        {videoData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Column: Video Player + Summary Card */}
            <div className="lg:col-span-7 flex flex-col">
              <VideoPlayer videoData={videoData} />
              <SummaryCard
                summary={summary}
                onSummarize={handleSummarize}
                isSummarizing={isSummarizing}
                videoData={videoData}
              />
            </div>

            {/* Right Column: RAG Chat Box */}
            <div className="lg:col-span-5">
              <ChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                isChatting={isChatting}
                videoLoaded={!!videoData}
              />
            </div>
          </div>
        ) : (
          /* Empty / Welcome Placeholder */
          <div className="mt-16 text-center max-w-lg mx-auto py-12 px-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Paste a YouTube Link Above</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Load any YouTube video with English subtitles to instantly extract transcripts, produce structured AI summaries, and chat directly with the video content.
            </p>
            <span className="inline-block px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs">
              Tip: Click "Try Sample AI Video" above to test immediately.
            </span>
          </div>
        )}
      </main>

      {/* College Project Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>YouTube Transcript Summarizer & RAG Chat • Full-Stack AI Academic Project</p>
      </footer>
    </div>
  );
}
