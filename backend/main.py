"""
main.py

FastAPI application for the YouTube Chat backend.

Endpoints:
    GET  /health       -> simple health check
    POST /load-video    -> load a YouTube video (fetch transcript, build FAISS index)
    POST /ask            -> ask a question about a previously-loaded video

All the actual RAG logic lives in rag.py. This file is only responsible for
the API layer: request/response models, routing, and error handling.
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import rag

# Load OPENAI_API_KEY from backend/.env into the environment.
load_dotenv()

_api_key = os.getenv("OPENAI_API_KEY")
if not _api_key:
    print("WARNING: OPENAI_API_KEY is not set. Add it to backend/.env")
elif _api_key == "your_openai_api_key":
    print("WARNING: OPENAI_API_KEY is still the placeholder value. Edit backend/.env with your real key.")
elif not _api_key.startswith("sk-"):
    print("WARNING: OPENAI_API_KEY does not look like a valid OpenAI key (should start with 'sk-').")
else:
    print(f"OPENAI_API_KEY loaded (starts with {_api_key[:7]}..., length {len(_api_key)})")

app = FastAPI(title="YouTube Chat API")

# Allow the React dev server to talk to this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------
class LoadVideoRequest(BaseModel):
    youtube_url: str


class LoadVideoResponse(BaseModel):
    video_id: str
    message: str


class AskRequest(BaseModel):
    video_id: str
    question: str


class AskResponse(BaseModel):
    answer: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/load-video", response_model=LoadVideoResponse)
def load_video(request: LoadVideoRequest):
    video_id = rag.extract_video_id(request.youtube_url)

    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="Could not extract a video ID. Please check the YouTube URL.",
        )

    try:
        rag.load_video(video_id)
    except ValueError as e:
        # Known, user-friendly errors raised from rag.py
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        # Anything unexpected: don't leak internals to the frontend
        raise HTTPException(status_code=500, detail="Something went wrong while loading the video.")

    return LoadVideoResponse(video_id=video_id, message="Video loaded successfully")


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest):
    try:
        answer = rag.ask_question(request.video_id, request.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Something went wrong while answering your question.")

    return AskResponse(answer=answer)