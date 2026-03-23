from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class TranscriptRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL or 11-char Video ID", example="https://www.youtube.com/watch?v=dQw4w9WgXcQ")

class TimedSnippet(BaseModel):
    start: float
    timestamp: str
    text: str

class TranscriptResponse(BaseModel):
    video_id: str
    video_url: str
    embed_url: str
    full_transcript: str
    timed_transcript: List[TimedSnippet]
    word_count: int

class SummaryRequest(BaseModel):
    video_id: Optional[str] = Field(None, description="YouTube Video ID")
    url: Optional[str] = Field(None, description="YouTube video URL")
    transcript: Optional[str] = Field(None, description="Optional raw transcript text")

class SummaryResponse(BaseModel):
    video_id: str
    summary: str
    method: str
    input_length_chars: int

class ChatRequest(BaseModel):
    video_id: str = Field(..., description="YouTube Video ID")
    question: str = Field(..., description="User question about the video", example="What is the main topic?")

class SourceSnippet(BaseModel):
    timestamp: str
    content: str

class ChatResponse(BaseModel):
    video_id: str
    question: str
    answer: str
    sources: List[SourceSnippet]

class HealthResponse(BaseModel):
    status: str
    project: str
    version: str
