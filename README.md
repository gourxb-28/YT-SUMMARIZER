# YouTube Chat

Chat with any YouTube video. Paste a link, and ask questions about its content —
answers come only from the video's transcript, using a Retrieval-Augmented
Generation (RAG) pipeline.

This is a simple full-stack rebuild of an original Python/Colab RAG script,
using the same core LangChain + FAISS pipeline, wrapped in a FastAPI backend
and a React frontend.

## Architecture

```
React (Vite)
      |
      | HTTP (fetch)
      v
FastAPI (backend/main.py)
      |
      v
YouTube Transcript API  ->  transcript text
      |
      v
LangChain RecursiveCharacterTextSplitter (chunk_size=1000, chunk_overlap=200)
      |
      v
OpenAI Embeddings (text-embedding-3-small)
      |
      v
FAISS (in-memory vector store, one per video_id)
      |
      v
Retriever (similarity search, k=4)
      |
      v
gpt-4o-mini  (answers ONLY from retrieved transcript context)
      |
      v
Answer -> returned to React -> shown in chat
```

Vector stores live in a plain Python dictionary in memory (`vector_stores` in
`backend/rag.py`). There's no database — if the backend restarts, videos need
to be reloaded. That's an intentional simplification for this MVP.

## Project structure

```
youtube-chatbot/
├── backend/
│   ├── main.py          # FastAPI app + endpoints
│   ├── rag.py            # RAG pipeline (transcript -> chunks -> FAISS -> answer)
│   ├── requirements.txt
│   ├── .env               # OPENAI_API_KEY (not committed)
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # entire React app
│   │   ├── App.css        # all styling
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Backend setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Create `backend/.env` (already scaffolded) with your own key:

```
OPENAI_API_KEY=your_openai_api_key
```

The backend runs at `http://localhost:8000`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## API endpoints

| Method | Path          | Body                                    | Description                        |
|--------|---------------|------------------------------------------|-------------------------------------|
| GET    | `/health`     | —                                        | Health check                        |
| POST   | `/load-video` | `{ "youtube_url": "..." }`               | Fetches transcript, builds FAISS index |
| POST   | `/ask`        | `{ "video_id": "...", "question": "..." }` | Answers a question using RAG        |

## How the RAG pipeline works

1. The video ID is extracted from the pasted URL.
2. The transcript is fetched via `youtube-transcript-api`.
3. The transcript is split into ~1000-character chunks with 200-character
   overlap, so context isn't lost at chunk boundaries.
4. Each chunk is embedded with OpenAI's `text-embedding-3-small` model and
   stored in a FAISS vector index in memory, keyed by video ID.
5. When a question comes in, the top 4 most similar chunks are retrieved.
6. Those chunks are joined into a context string and inserted into a strict
   prompt that tells the model to answer only from that context.
7. `gpt-4o-mini` generates the answer, which is sent back to the frontend.

## Known limitations

- **No persistence**: vector stores are in-memory only; restarting the
  backend clears all loaded videos.
- **English transcripts only**: `load_video` requests the `en` transcript
  track. Videos without English captions (auto-generated or manual) will
  fail to load.
- **No auth / no rate limiting**: this is a personal MVP, not meant for
  public deployment as-is.
- **Single-process**: state (the `vector_stores` dict) doesn't scale across
  multiple backend workers/processes.

## Security note

The original script you provided had an OpenAI API key hardcoded in the
source. That key should be treated as compromised — please revoke/rotate it
in your OpenAI dashboard. This project never hardcodes a key; it's read only
from `backend/.env`, which is git-ignored, and it is never sent to the
frontend.
