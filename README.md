# SpendSense — Smart Expense Tracker

An AI-powered expense tracker that understands natural language. Just type *"spent 350 on Ola to airport"* and Gemini auto-categorizes it for you.

## Features

- 🧠 **AI Parsing** — Type expenses in plain English, Gemini extracts amount, category & description
- ✏️ **Editable** — Review and correct AI output before saving
- 📊 **Category Summary** — Visual breakdown of spending by category
- 🗑️ **Delete** — Remove any expense instantly
- 💾 **Persistent** — SQLite backend stores everything

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI (Python) |
| AI | Google Gemini 2.5 Flash |
| Database | SQLite |
| Frontend | React + Vite |
| Deployment | Railway |

## Local Setup

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_key_here" > .env

uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install

# .env already set to localhost:8000
npm run dev
```

Frontend runs at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/parse-expense` | Parse natural language → structured JSON |
| GET | `/expenses` | Fetch all expenses |
| POST | `/expenses` | Save an expense |
| DELETE | `/expenses/{id}` | Delete an expense |

## Live Demo

- Frontend: _coming soon_
- Backend: _coming soon_

## Author

Jugraj Singh Bhatia — BITS Pilani PS-I 2026 @ KVGAI Tech Pvt. Ltd.
