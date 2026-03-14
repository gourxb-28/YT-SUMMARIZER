import { useEffect, useRef, useState } from 'react'

// Simple API base URL for local development.
const API_BASE_URL = 'http://localhost:8000'

const SUGGESTED_QUESTIONS = [
  'Summarize this video',
  'What are the main points?',
  'What is the main topic?',
  'Who is mentioned in the video?',
]

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [videoId, setVideoId] = useState(null)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [messages, setMessages] = useState([]) // { role: 'user' | 'assistant', text: string }
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)

  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAsking])

  async function handleLoadVideo(e) {
    e.preventDefault()
    if (!youtubeUrl.trim() || isLoadingVideo) return

    setIsLoadingVideo(true)
    setLoadError('')

    try {
      const res = await fetch(`${API_BASE_URL}/load-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: youtubeUrl.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Could not load this video.')
      }

      setVideoId(data.video_id)
      setMessages([])
    } catch (err) {
      setLoadError(
        err.message ||
          'Could not load this video. Please check the URL and make sure captions are available.'
      )
    } finally {
      setIsLoadingVideo(false)
    }
  }

  async function sendQuestion(text) {
    const trimmed = text.trim()
    if (!trimmed || isAsking || !videoId) return

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setQuestion('')
    setIsAsking(true)

    try {
      const res = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, question: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Something went wrong while answering your question.')
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: err.message || 'Something went wrong while answering your question.',
          isError: true,
        },
      ])
    } finally {
      setIsAsking(false)
    }
  }

  function handleAskSubmit(e) {
    e.preventDefault()
    sendQuestion(question)
  }

  function handleReset() {
    setVideoId(null)
    setYoutubeUrl('')
    setMessages([])
    setLoadError('')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">▶</span>
          <span className="brand-name">YouTube Chat</span>
        </div>
        {videoId && (
          <button className="link-button" onClick={handleReset}>
            Load a different video
          </button>
        )}
      </header>

      {!videoId ? (
        <LandingView
          youtubeUrl={youtubeUrl}
          setYoutubeUrl={setYoutubeUrl}
          onSubmit={handleLoadVideo}
          isLoading={isLoadingVideo}
          error={loadError}
        />
      ) : (
        <ChatView
          videoId={videoId}
          messages={messages}
          question={question}
          setQuestion={setQuestion}
          onSubmit={handleAskSubmit}
          onSuggestionClick={(q) => sendQuestion(q)}
          isAsking={isAsking}
          chatEndRef={chatEndRef}
        />
      )}
    </div>
  )
}

function LandingView({ youtubeUrl, setYoutubeUrl, onSubmit, isLoading, error }) {
  return (
    <main className="landing">
      <div className="landing-card">
        <h1 className="landing-title">Chat with any YouTube video</h1>
        <p className="landing-subtitle">
          Paste a YouTube video link and ask questions about its content.
        </p>

        <form className="url-form" onSubmit={onSubmit}>
          <input
            type="text"
            className="url-input"
            placeholder="Paste YouTube URL"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? 'Processing video...' : 'Load Video'}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
      </div>
    </main>
  )
}

function ChatView({
  videoId,
  messages,
  question,
  setQuestion,
  onSubmit,
  onSuggestionClick,
  isAsking,
  chatEndRef,
}) {
  return (
    <main className="workspace">
      <section className="video-panel">
        <div className="video-frame">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="video-status">Video ready ✓</p>
      </section>

      <section className="chat-panel">
        <div className="chat-header">Chat</div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>Ask a question about the video to get started.</p>
              <div className="suggestions">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    className="suggestion-chip"
                    onClick={() => onSuggestionClick(q)}
                    disabled={isAsking}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <span className="message-role">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <p className={`message-text ${msg.isError ? 'error-text' : ''}`}>{msg.text}</p>
            </div>
          ))}

          {isAsking && (
            <div className="message assistant">
              <span className="message-role">Assistant</span>
              <p className="message-text typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <form className="chat-input-row" onSubmit={onSubmit}>
          <input
            type="text"
            className="chat-input"
            placeholder="Ask something about this video"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isAsking}
          />
          <button type="submit" className="send-button" disabled={isAsking || !question.trim()}>
            Send
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
