from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sqlite3
from google import genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="Smart Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- DB Setup ----------

def get_db():
    conn = sqlite3.connect("expenses.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ---------- Models ----------

class ParseRequest(BaseModel):
    text: str

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str

# ---------- Routes ----------

@app.get("/")
def root():
    return {"message": "Smart Expense Tracker API is running"}


@app.post("/parse-expense")
def parse_expense(req: ParseRequest):
    """
    Takes natural language input like 'spent 200 on lunch'
    and returns structured JSON using Gemini.
    """
    prompt = f"""
You are a smart expense parser. Given a natural language description of an expense, extract:
- amount (number only, in INR if currency not specified)
- category must be exactly one of: Food, Transport, Shopping, Entertainment, Health, Utilities, Education, Other
- car, bike, petrol, fuel, cab, ola, uber, metro, bus, train, vehicle repair, car maintenance all come under Transport
- if unsure, use Other
- description (a clean short description, 3-6 words)

Return ONLY a valid JSON object with keys: amount, category, description.
No explanation, no markdown, just raw JSON.

Input: "{req.text}"
"""
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        raw = response.text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw.strip())
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini parsing failed: {str(e)}")


@app.post("/expenses")
def create_expense(expense: ExpenseCreate):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)",
        (expense.description, expense.amount, expense.category)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, **expense.dict(), "message": "Expense saved"}


@app.get("/expenses")
def get_expenses():
    conn = get_db()
    rows = conn.execute("SELECT * FROM expenses ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):
    conn = get_db()
    result = conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}

@app.put("/expenses/{expense_id}")
def update_expense(expense_id: int, expense: ExpenseCreate):
    conn = get_db()
    result = conn.execute(
        "UPDATE expenses SET description = ?, amount = ?, category = ? WHERE id = ?",
        (expense.description, expense.amount, expense.category, expense_id)
    )
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"id": expense_id, **expense.dict(), "message": "Expense updated"}
