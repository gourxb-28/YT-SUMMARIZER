import re
from typing import Dict, Any, List
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

def extract_video_id(url: str) -> str:
    if not url or not isinstance(url, str):
        raise ValueError("Invalid URL: Please provide a valid YouTube URL string.")

    url = url.strip()

    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"youtu\.be\/([0-9A-Za-z_-]{11})",
        r"embed\/([0-9A-Za-z_-]{11})",
        r"shorts\/([0-9A-Za-z_-]{11})"
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    if len(url) == 11 and re.match(r"^[0-9A-Za-z_-]{11}$", url):
        return url

    raise ValueError("Could not extract video ID. Please ensure the URL is a valid YouTube link.")

def format_timestamp(seconds: float) -> str:
    """Helper function to format seconds into MM:SS format."""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"

def fetch_youtube_transcript(video_url: str) -> Dict[str, Any]:
    video_id = extract_video_id(video_url)

    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        try:
            transcript_obj = transcript_list.find_manually_created_transcript(['en', 'en-US', 'en-GB'])
        except Exception:
            try:
                transcript_obj = transcript_list.find_generated_transcript(['en', 'en-US', 'en-GB'])
            except Exception:
                transcript_obj = next(iter(transcript_list))

        raw_snippets: List[Dict[str, Any]] = transcript_obj.fetch()

        timed_snippets = []
        text_parts = []

        for snippet in raw_snippets:
            clean_text = snippet.get("text", "").replace("\n", " ").strip()
            if clean_text:
                start_time = snippet.get("start", 0.0)
                text_parts.append(clean_text)
                timed_snippets.append({
                    "start": start_time,
                    "timestamp": format_timestamp(start_time),
                    "text": clean_text
                })

        full_text = " ".join(text_parts)

        if not full_text:
            raise ValueError("The transcript was empty or could not be decoded.")

        return {
            "video_id": video_id,
            "video_url": f"https://www.youtube.com/watch?v={video_id}",
            "embed_url": f"https://www.youtube.com/embed/{video_id}",
            "full_transcript": full_text,
            "timed_transcript": timed_snippets,
            "word_count": len(full_text.split()),
            "total_snippets": len(timed_snippets)
        }

    except TranscriptsDisabled:
        raise ValueError("Subtitles/Transcripts are disabled for this video by the creator.")
    except NoTranscriptFound:
        raise ValueError("No transcript or subtitles could be found for this video.")
    except VideoUnavailable:
        raise ValueError("This video is unavailable (it may be private, removed, or region-restricted).")
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        raise ValueError(f"Failed to fetch transcript: {str(e)}")
