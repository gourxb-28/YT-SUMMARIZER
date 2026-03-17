from typing import Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import OPENAI_API_KEY

def get_chat_model(temperature: float = 0.3) -> ChatOpenAI:
    
    if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
        raise ValueError("OpenAI API key is missing. Please set OPENAI_API_KEY in backend/.env file.")
    
    return ChatOpenAI(
        model_name="gpt-4o-mini",
        temperature=temperature,
        api_key=OPENAI_API_KEY
    )

def create_summary_prompt() -> PromptTemplate:
    template = """
You are an expert AI assistant that summarizes YouTube videos from their transcripts.
Analyze the following transcript carefully and produce a high-quality, readable summary.

Transcript:
\"\"\"
{transcript}
\"\"\"

Please structure the summary strictly using the following Markdown sections:

### 📌 Overview
Provide a clear, 2-3 sentence overview explaining the core theme and purpose of the video.

### 🔑 Key Takeaways & Main Points
- Break down the primary ideas discussed in clean, informative bullet points.
- Include essential concepts, facts, or instructions mentioned.

### 💡 Notable Insights / Conclusion
Provide a brief concluding takeaway or actionable insight from the speaker.

Ensure the summary is accurate, objective, easy to understand, and faithful strictly to what was discussed in the transcript.
"""
    return PromptTemplate(template=template, input_variables=["transcript"])

def generate_summary(transcript_text: str, max_chunk_tokens: int = 12000) -> Dict[str, Any]:
    """
    Generates a structured summary from the given video transcript using LangChain and GPT-4o-mini.
    If the transcript is very long, it splits the text into chunks, summarizes each,
    and produces a consolidated final summary.
    """
    if not transcript_text or not transcript_text.strip():
        raise ValueError("Transcript text cannot be empty.")

    llm = get_chat_model(temperature=0.3)
    prompt = create_summary_prompt()

    char_length = len(transcript_text)
    
    if char_length <= 25000:
        formatted_prompt = prompt.format(transcript=transcript_text)
        response = llm.invoke(formatted_prompt)
        summary_content = response.content
        method_used = "direct"
    else:
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=12000,
            chunk_overlap=800
        )
        chunks = text_splitter.split_text(transcript_text)
        
        intermediate_summaries = []
        chunk_prompt = PromptTemplate(
            template="Summarize the key information in this section of a video transcript:\n\n{chunk}\n\nSummary:",
            input_variables=["chunk"]
        )

        for chunk in chunks:
            formatted_chunk = chunk_prompt.format(chunk=chunk)
            chunk_res = llm.invoke(formatted_chunk)
            intermediate_summaries.append(chunk_res.content)

        combined_intermediate = "\n\n".join(intermediate_summaries)
        final_prompt = prompt.format(transcript=combined_intermediate)
        final_response = llm.invoke(final_prompt)
        summary_content = final_response.content
        method_used = "chunked_map_reduce"

    return {
        "summary": summary_content,
        "method": method_used,
        "input_length_chars": char_length,
        "model": "gpt-4o-mini"
    }
