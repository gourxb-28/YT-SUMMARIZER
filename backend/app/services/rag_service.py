from typing import Dict, Any, List, Optional
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from app.config import OPENAI_API_KEY

VECTOR_STORE_CACHE: Dict[str, FAISS] = {}

def get_embeddings_model() -> OpenAIEmbeddings:
    """Initializes and returns the OpenAI Embeddings model."""
    if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
        raise ValueError("OpenAI API key is missing. Please set OPENAI_API_KEY in backend/.env file.")
    
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=OPENAI_API_KEY
    )

def create_vector_store_from_transcript(video_id: str, transcript_data: Dict[str, Any]) -> FAISS:
   
    if video_id in VECTOR_STORE_CACHE:
        return VECTOR_STORE_CACHE[video_id]

    timed_snippets = transcript_data.get("timed_transcript", [])
    full_transcript = transcript_data.get("full_transcript", "")

    documents: List[Document] = []

    if timed_snippets:
        buffer_text = []
        start_time_str = timed_snippets[0].get("timestamp", "00:00")
        current_len = 0

        for snippet in timed_snippets:
            snippet_text = snippet.get("text", "")
            buffer_text.append(snippet_text)
            current_len += len(snippet_text)

            if current_len >= 800:
                doc_text = " ".join(buffer_text)
                documents.append(Document(
                    page_content=doc_text,
                    metadata={
                        "video_id": video_id,
                        "timestamp": start_time_str
                    }
                ))
                buffer_text = []
                current_len = 0
                start_time_str = snippet.get("timestamp", "00:00")

        if buffer_text:
            doc_text = " ".join(buffer_text)
            documents.append(Document(
                page_content=doc_text,
                metadata={
                    "video_id": video_id,
                    "timestamp": start_time_str
                }
            ))
    else:
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
        chunks = splitter.split_text(full_transcript)
        for idx, chunk in enumerate(chunks):
            documents.append(Document(
                page_content=chunk,
                metadata={
                    "video_id": video_id,
                    "chunk_index": idx
                }
            ))

    if not documents:
        raise ValueError("Cannot create vector store: No valid transcript documents to index.")

    embeddings = get_embeddings_model()
    vector_store = FAISS.from_documents(documents=documents, embedding=embeddings)

    VECTOR_STORE_CACHE[video_id] = vector_store
    return vector_store

def ask_question_rag(
    video_id: str,
    question: str,
    transcript_data: Optional[Dict[str, Any]] = None,
    top_k: int = 4
) -> Dict[str, Any]:
    """
    RAG Query Flow:
    1. Retrieve or build the FAISS vector store for video_id.
    2. Perform similarity search to find top_k most relevant transcript chunks.
    3. Pass context and question to GPT-4o-mini with a strict grounding prompt.
    4. Return the answer along with relevant source chunks.
    """
    if not question or not question.strip():
        raise ValueError("Question cannot be empty.")

    if video_id in VECTOR_STORE_CACHE:
        vector_store = VECTOR_STORE_CACHE[video_id]
    elif transcript_data:
        vector_store = create_vector_store_from_transcript(video_id, transcript_data)
    else:
        raise ValueError(f"No vector index found for video '{video_id}'. Please process the transcript first.")

    relevant_docs: List[Document] = vector_store.similarity_search(query=question, k=top_k)

    context_chunks = []
    sources = []
    for doc in relevant_docs:
        timestamp = doc.metadata.get("timestamp", "N/A")
        chunk_text = doc.page_content
        context_chunks.append(f"[{timestamp}] {chunk_text}")
        sources.append({
            "timestamp": timestamp,
            "content": chunk_text
        })

    formatted_context = "\n\n".join(context_chunks)

    system_prompt = (
        "You are a helpful, accurate AI tutor answering questions about a YouTube video based on its transcript.\n"
        "Rules:\n"
        "1. Base your answer STRICTLY and SOLELY on the provided transcript context.\n"
        "2. If the context does not contain the answer, say: "
        "'Based on the video transcript, this topic is not mentioned or discussed.'\n"
        "3. Keep your answers concise, clear, and cite timestamps whenever available.\n"
        "4. Do not invent or hallucinate facts beyond what is in the transcript."
    )

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Video Transcript Context:\n{context}\n\nUser Question: {question}")
    ])

    if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
        raise ValueError("OpenAI API key is missing. Please set OPENAI_API_KEY in backend/.env file.")

    llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0.2, api_key=OPENAI_API_KEY)
    chain = prompt_template | llm

    response = chain.invoke({
        "context": formatted_context,
        "question": question
    })

    return {
        "video_id": video_id,
        "question": question,
        "answer": response.content,
        "sources": sources
    }
