# 🎥YouTube Transcript Summarizer

 A full-stack, AI-powered web application that extracts YouTube video transcripts, generates concise structured summaries using **LangChain** and **GPT-4o-mini**, and enables interactive, transcript-grounded Q&A using RAG.



## 📌 Project Overview & Key Features

Modern video lectures, podcasts, and tutorials often span hours. **YouTube Summarizer** allows you to instantly consume video content without watching the full video.

* **Embedded Video Player:** Paste any YouTube URL and watch the video directly in the app.
* **Automated Transcript Extraction:** Fetches manual or auto-generated subtitles using `youtube-transcript-api` .
* **AI-Powered Structured Summarization:** Generates an executive overview, key takeaways, and core insights.
* **Interactive RAG Q&A Chat:** Ask specific questions about the video and receive answers grounded strictly in the transcript.



## 🛠️ Tech Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React , Tailwind CSS
| **Backend** | FastAPI |
| **LLM & Orchestration** | LangChain, OpenAI GPT-4o-mini 
| **Vector Search** | FAISS, OpenAI `text-embedding-3-small` 
| **Transcript Fetching** | youtube-transcript-api




## 📂 Project Folder Structure

```
root/
├── .gitignore                      
├── README.md
├── backend/
│   ├── .env                        
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── config.py              
│       ├── main.py
│       ├── schemas.py
│       └── services/
│           ├── __init__.py
│           ├── youtube_service.py
│           ├── summary_service.py 
│           └── rag_service.py
└── frontend/
    ├── package.json                
    ├── vite.config.js              
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                 
        ├── index.css               
        ├── api.js                  
        └── components/
            ├── Navbar.jsx
            ├── UrlInput.jsx
            ├── VideoPlayer.jsx     
            ├── SummaryCard.jsx
            └── ChatBox.jsx         
```

---

## 💻 Windows Installation & Execution Guide


### Step 1: Clone or Open the Project
Open Windows PowerShell and navigate to the project directory:
### Step 2: Configure the Backend

1. Navigate to the `backend` folder:
   ```
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install required packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure your `.env` file:
   Open `backend/.env` in any text editor and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=
   HOST=127.0.0.1
   PORT=8000
   ```

5. Start the FastAPI backend server:
   ```powershell
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend will now be running at `http://127.0.0.1:8000`.


### Step 3: Configure and Run the Frontend

Open a new terminal window:

1. Navigate to the `frontend` folder:
   ```powershell
   cd frontend
   ```

2. Install npm dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite React development server:
   ```powershell
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:5173
   ```


