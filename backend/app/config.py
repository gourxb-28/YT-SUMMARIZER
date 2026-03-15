import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))

def validate_config():
    if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
        print("[WARNING] OPENAI_API_KEY is not set in backend/.env. AI features will require a valid key.")
    else:
        print("[INFO] OPENAI_API_KEY loaded successfully.")
