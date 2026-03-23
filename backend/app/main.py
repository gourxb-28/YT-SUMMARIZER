from typing import Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import validate_config, HOST, PORT
from app.schemas import (
    TranscriptRequest,
    TranscriptResponse,
    SummaryRequest,
    SummaryResponse,
    ChatRequest,
    ChatResponse,
    HealthResponse
)
from app.services.youtube_service import fetch_youtube_transcript, extract_video_id
from app.services.summary_service import generate_summary
from app.services.rag_service import ask_question_rag, create_vector_store_from_transcript

app = FastAPI(
    title="YouTube Transcript Summarizer & RAG Chat API",
    description="Backend API for fetching YouTube transcripts, generating AI summaries, and grounded Q&A using LangChain & FAISS.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TRANSCRIPT_CACHE: Dict[str, Dict[str, Any]] = {}

@app.on_event("startup")
async def startup_event():
    validate_config()

@app.get("/", response_model=HealthResponse)
def root():
    """Health check endpoint to verify backend service is running."""
    return HealthResponse(
        status="active",
        project="YouTube Transcript Summarizer & RAG Chat",
        version="1.0.0"
    )

@app.post("/api/transcript", response_model=TranscriptResponse)
def get_transcript_endpoint(payload: TranscriptRequest):
    """
    Extracts video ID and fetches the transcript from YouTube.
    Caches the transcript in-memory for subsequent summarization and RAG indexing.
    """
    try:
        data = fetch_youtube_transcript(payload.url)
        video_id = data["video_id"]
        
        TRANSCRIPT_CACHE[video_id] = data

        try:
            create_vector_store_from_transcript(video_id, data)
        except Exception as e:
            print(f"[NOTE] Vector indexing postponed: {e}")

        return TranscriptResponse(
            video_id=data["video_id"],
            video_url=data["video_url"],
            embed_url=data["embed_url"],
            full_transcript=data["full_transcript"],
            timed_transcript=data["timed_transcript"],
            word_count=data["word_count"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while processing transcript: {str(e)}"
        )

@app.post("/api/summarize", response_model=SummaryResponse)
def summarize_endpoint(payload: SummaryRequest):
    """
    Generates a structured summary using LangChain and GPT-4o-mini.
    Accepts video_id, url, or direct transcript text.
    """
    try:
        video_id = payload.video_id
        transcript_text = payload.transcript
        if not transcript_text:
            if not video_id and payload.url:
                video_id = extract_video_id(payload.url)

            if video_id and video_id in TRANSCRIPT_CACHE:
                transcript_text = TRANSCRIPT_CACHE[video_id]["full_transcript"]
            elif payload.url:
                data = fetch_youtube_transcript(payload.url)
                video_id = data["video_id"]
                TRANSCRIPT_CACHE[video_id] = data
                transcript_text = data["full_transcript"]
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please provide a valid YouTube URL or fetch the transcript first."
                )

        result = generate_summary(transcript_text)

        return SummaryResponse(
            video_id=video_id or "custom",
            summary=result["summary"],
            method=result["method"],
            input_length_chars=result["input_length_chars"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    """
    RAG-powered conversational endpoint.
    Retrieves relevant transcript chunks from FAISS and provides grounded answer.
    """
    try:
        video_id = payload.video_id
        cached_data = TRANSCRIPT_CACHE.get(video_id)

        rag_result = ask_question_rag(
            video_id=video_id,
            question=payload.question,
            transcript_data=cached_data
        )

        return ChatResponse(
            video_id=rag_result["video_id"],
            question=rag_result["question"],
            answer=rag_result["answer"],
            sources=rag_result["sources"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing question: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
