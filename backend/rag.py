"""
rag.py

This file contains the whole RAG (Retrieval-Augmented Generation) pipeline
for the YouTube chatbot. It is a direct adaptation of the original
Colab/script version into a set of plain, reusable functions.

Flow:
    YouTube URL
        -> extract_video_id()
        -> fetch transcript (youtube-transcript-api)
        -> split into chunks (RecursiveCharacterTextSplitter)
        -> embed chunks (OpenAIEmbeddings)
        -> store in FAISS (in-memory, per video_id)
        -> retrieve top-k chunks for a question
        -> build a prompt with the context
        -> ask gpt-4o-mini
        -> return the answer
"""

import re
import traceback

from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)
try:
    # LangChain 0.2+/1.x: text splitters live in their own package
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    # Older LangChain versions
    from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnableLambda, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser


# ---------------------------------------------------------------------------
# In-memory storage of vector stores, keyed by YouTube video ID.
# This is intentionally simple for this MVP: no database, resets on restart.
# ---------------------------------------------------------------------------
vector_stores = {}


# ---------------------------------------------------------------------------
# Same prompt behavior as the original script: answer only from the
# transcript context, and say "I don't know" if the context is insufficient.
# ---------------------------------------------------------------------------
prompt = PromptTemplate(
    template="""
You are a helpful assistant.

Answer ONLY from the provided transcript context.

If the context is insufficient, say that you don't know.

Do not make up information that is not present in the transcript.

Context:
{context}

Question:
{question}
""",
    input_variables=["context", "question"],
)


def extract_video_id(url: str) -> str | None:
    """
    Extract the YouTube video ID from a URL.

    Supports:
        https://www.youtube.com/watch?v=VIDEO_ID
        https://youtu.be/VIDEO_ID
        https://www.youtube.com/embed/VIDEO_ID
        https://www.youtube.com/shorts/VIDEO_ID
        URLs with extra query params (e.g. &t=30s)

    Returns None if no video ID could be found.
    """
    if not url:
        return None

    url = url.strip()

    patterns = [
        r"(?:youtube\.com/watch\?v=)([a-zA-Z0-9_-]{11})",
        r"(?:youtu\.be/)([a-zA-Z0-9_-]{11})",
        r"(?:youtube\.com/embed/)([a-zA-Z0-9_-]{11})",
        r"(?:youtube\.com/shorts/)([a-zA-Z0-9_-]{11})",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None


def format_docs(retrieved_docs) -> str:
    """Join retrieved chunks into a single context string."""
    return "\n\n".join(doc.page_content for doc in retrieved_docs)


def load_video(video_id: str) -> None:
    """
    Fetch the transcript for a video, chunk it, embed it, and store the
    resulting FAISS vector store in memory under `video_id`.

    Raises a ValueError with a user-friendly message on failure. The
    caller (main.py) is responsible for turning that into an HTTP error.
    """
    try:
        # youtube-transcript-api v1.0+ uses an instance method (`.fetch`).
        # Older versions use the static `YouTubeTranscriptApi.get_transcript`.
        api = YouTubeTranscriptApi()
        if hasattr(api, "fetch"):
            fetched = api.fetch(video_id, languages=["en"])
            transcript_list = [{"text": snippet.text} for snippet in fetched]
        else:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])
    except TranscriptsDisabled:
        raise ValueError("Captions are disabled for this video.")
    except NoTranscriptFound:
        raise ValueError("No transcript could be found for this video.")
    except VideoUnavailable:
        raise ValueError("This video is unavailable.")
    except Exception:
        raise ValueError("Could not fetch a transcript for this video.")

    transcript = " ".join(chunk["text"] for chunk in transcript_list)

    if not transcript.strip():
        raise ValueError("The transcript for this video is empty.")

    # Step 1b - Split transcript into chunks (same settings as original script)
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.create_documents([transcript])

    # Step 1c/1d - Embed chunks and store them in FAISS
    try:
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vector_store = FAISS.from_documents(chunks, embeddings)
    except Exception as e:
        print("---- EMBEDDING GENERATION FAILED ----")
        traceback.print_exc()
        print("--------------------------------------")
        raise ValueError("Failed to generate embeddings. Please check the OpenAI API key/quota.")

    vector_stores[video_id] = vector_store


def ask_question(video_id: str, question: str) -> str:
    """
    Answer a question about a previously-loaded video using the RAG chain:
    retriever -> prompt -> gpt-4o-mini -> parsed string answer.
    """
    vector_store = vector_stores.get(video_id)
    if vector_store is None:
        raise ValueError("This video hasn't been loaded yet. Please load it first.")

    if not question or not question.strip():
        raise ValueError("Question cannot be empty.")

    # Step 2 - Retrieval
    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 4})

    # Step 3/4 - Augmentation + Generation, built as a runnable chain
    try:
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

        parallel_chain = RunnableParallel(
            {
                "context": retriever | RunnableLambda(format_docs),
                "question": RunnablePassthrough(),
            }
        )

        parser = StrOutputParser()
        main_chain = parallel_chain | prompt | llm | parser

        answer = main_chain.invoke(question)
    except Exception as e:
        print("---- ANSWER GENERATION FAILED ----")
        traceback.print_exc()
        print("-----------------------------------")
        raise ValueError("Failed to generate an answer. Please check the OpenAI API key/quota.")

    return answer