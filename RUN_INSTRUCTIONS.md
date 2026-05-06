# Instructions to Run the UBID Platform

Follow these steps to generate the data, run the AI engine, and start the frontend and backend servers.

## 1. Prerequisites
Make sure you have the following installed on your machine:
* Python 3.11+
* Node.js (v18+)
* `pip` and `npm`

## 2. Install Dependencies

**For the Python AI Engine & Backend:**
Open a terminal in the `UBID_PLATFORM` directory and run:
```bash
pip install -r backend/requirements.txt
pip install splink<4.0 sqlglot<20
```

**For the React Frontend:**
Open a terminal in the `UBID_PLATFORM/frontend` directory and run:
```bash
npm install
```

## 3. Run the AI Data Pipeline
The AI engine generates synthetic departmental data, standardizes it, resolves entities to assign UBIDs, and computes the activity statuses. 

From the root `UBID_PLATFORM` folder, run the pipeline scripts in order:
```bash
python ai_engine/generate_synthetic_data.py
python ai_engine/normalise.py
python ai_engine/engine.py
python ai_engine/activity_inference.py
```
*(This will generate files inside the `ai_engine/synthetic_data/` and `ai_engine/` folders).*

## 4. Start the Servers

You will need **two separate terminals** running simultaneously.

### Terminal A: FastAPI Backend
From the root `UBID_PLATFORM` folder, navigate to `backend` and start the Uvicorn server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```
*The backend API will be available at `http://localhost:8000`.*

### Terminal B: React Frontend
From the root `UBID_PLATFORM` folder, navigate to `frontend` and start the Vite dev server:
```bash
cd frontend
npm run dev
```
*The dashboard UI will be available at `http://localhost:5173`.*

## 5. Ollama LLM Integration
To power the AI Explanations in the Reviewer Workbench:
1. Download and install [Ollama](https://ollama.com/)
2. Run `ollama run phi3` or `ollama run llama3.2`
The backend will automatically detect Ollama running on port 11434 and use it to explain AI entity matches.
