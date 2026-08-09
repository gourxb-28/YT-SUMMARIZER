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
