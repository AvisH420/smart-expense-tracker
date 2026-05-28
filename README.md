# 💸 SpendWise — AI-Powered Smart Expense Tracker

Track expenses by typing in plain English. SpendWise uses Google Gemini to
parse what you spent, auto-categorize it, and even answer questions about
your spending.

**Live demo:** welcoming-rebirth-production-e87a.up.railway.app

## ✨ Features
- **Natural-language expense entry** — type "spent 350 on Ola" and Gemini extracts amount, category, and description.
- **Ask your expenses** — ask "what's my biggest category?" and get a real answer from your own data.
- **Full CRUD** — add, view, edit (inline), and delete expenses.
- **Visual breakdown** — category donut chart + spend bars.
- **Editable AI suggestions** — review and correct before saving.

## 🛠 Tech Stack
- **Backend:** FastAPI (Python), SQLite, Google Gemini 2.5 Flash
- **Frontend:** React + Vite
- **Deployment:** Railway

## 📸 Screenshots
[Add 2–3 screenshots here: landing page, tracker with chart, Ask SpendWise answering]

## 🚀 Run Locally
### Backend
\`\`\`bash
cd backend
pip install -r requirements.txt
echo "GEMINI_API_KEY=your_key_here" > .env
uvicorn main:app --reload
\`\`\`
### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 📡 API Endpoints
| Method | Route | Purpose |
|--------|-------|---------|
| POST | /parse-expense | Parse natural-language expense |
| POST | /ask | Answer questions about spending |
| GET | /expenses | List all expenses |
| POST | /expenses | Create an expense |
| PUT | /expenses/{id} | Update an expense |
| DELETE | /expenses/{id} | Delete an expense |

---
Built at KVGAI Tech · PS-I 2026 · by Jugraj Singh Bhatia