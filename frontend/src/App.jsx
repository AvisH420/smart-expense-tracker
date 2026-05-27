import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useEffect, useRef } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CATEGORY_ICONS = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️",
  Entertainment: "🎬", Health: "💊", Utilities: "💡",
  Education: "📚", Other: "📦",
};

const CATEGORY_COLORS = {
  Food: "#e8855a", Transport: "#5ab4e8", Shopping: "#e8c55a",
  Entertainment: "#a78bfa", Health: "#5ae8a0", Utilities: "#5a8ee8",
  Education: "#e87c5a", Other: "#8888aa",
};

export default function App() {
  const [view, setView] = useState("home"); // "home" | "app"
  const [expenses, setExpenses] = useState([]);
  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [editParsed, setEditParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const appRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  useEffect(() => {
    if (view === "app") fetchExpenses();
  }, [view]);

  async function fetchExpenses() {
  setListLoading(true);
  try {
    const res = await fetch(`${API}/expenses`);
    setExpenses(await res.json());
  } catch {
    setError("Backend unreachable.");
  } finally {
    setListLoading(false);
  }
}

  async function handleParse() {
    if (!inputText.trim()) return;
    setLoading(true); setError(""); setParsed(null); setEditParsed(null);
    try {
      const res = await fetch(`${API}/parse-expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setParsed(data); setEditParsed({ ...data });
    } catch { setError("Couldn't parse that. Try being more specific."); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!editParsed) return;
    setSaving(true);
    try {
      await fetch(`${API}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editParsed),
      });
      setInputText(""); setParsed(null); setEditParsed(null);
      await fetchExpenses();
    } catch { setError("Failed to save."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
  try {
    await fetch(`${API}/expenses/${id}`, { method: "DELETE" });
    setExpenses(prev => prev.filter(e => e.id !== id));
  } catch { setError("Couldn't delete that expense."); }
}
  function startEdit(exp) {
  setEditingId(exp.id);
  setEditDraft({ description: exp.description, amount: exp.amount, category: exp.category });
}

function cancelEdit() {
  setEditingId(null);
  setEditDraft(null);
}

async function handleUpdate(id) {
  try {
    await fetch(`${API}/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    cancelEdit();
    await fetchExpenses();
  } catch { setError("Couldn't update that expense."); }
}

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const categoryTotals = expenses.reduce((a, e) => ({ ...a, [e.category]: (a[e.category] || 0) + e.amount }), {});
  const chartData = Object.entries(categoryTotals).map(([cat, amt]) => ({
  name: cat,
  value: amt,
}));

  if (view === "app") {
    return (
      <div className="tracker-page">
        <nav className="nav nav--light">
          <button className="nav-logo" onClick={() => setView("home")}>SpendWise</button>
          <div className="nav-links">
            <button className="nav-link" onClick={() => setView("home")}>← Back to Home</button>
          </div>
        </nav>

        <div className="tracker-wrap">
          <div className="tracker-header">
            <h1 className="tracker-title">Your <em>Expenses</em></h1>
            <div className="total-pill">Total: ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="tracker-grid">
            <section className="t-card input-section">
              <h2 className="t-card-title">Add Expense</h2>
              <p className="t-card-sub">Type naturally — <em>"spent 350 on Ola"</em> or <em>"200 on groceries"</em></p>
              <div className="input-row">
                <input
                  className="t-input" type="text"
                  placeholder="Describe your expense..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleParse()}
                />
                <button className="t-btn t-btn--primary" onClick={handleParse} disabled={loading || !inputText.trim()}>
                  {loading ? <span className="spin" /> : "Parse →"}
                </button>
              </div>
              {error && <p className="t-error">⚠ {error}</p>}
              {editParsed && (
                <div className="parsed-box">
                  <p className="parsed-tag">Gemini understood:</p>
                  <div className="parsed-fields">
                    <div className="field-g">
                      <label>Description</label>
                      <input value={editParsed.description} onChange={e => setEditParsed({ ...editParsed, description: e.target.value })} />
                    </div>
                    <div className="field-g">
                      <label>Amount (₹)</label>
                      <input type="number" value={editParsed.amount} onChange={e => setEditParsed({ ...editParsed, amount: parseFloat(e.target.value) })} />
                    </div>
                    <div className="field-g">
                      <label>Category</label>
                      <select value={editParsed.category} onChange={e => setEditParsed({ ...editParsed, category: e.target.value })}>
                        {Object.keys(CATEGORY_ICONS).map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="parsed-actions">
                    <button className="t-btn t-btn--success" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "✓ Save"}</button>
                    <button className="t-btn t-btn--ghost" onClick={() => { setParsed(null); setEditParsed(null); }}>Discard</button>
                  </div>
                </div>
              )}
            </section>

            <section className="t-card list-section">
              <h2 className="t-card-title">All Expenses</h2>
              {listLoading
  ? <div className="t-empty"><span className="spin" /><p>Loading...</p></div>
  :expenses.length === 0
                ? <div className="t-empty"><span>💸</span><p>No expenses yet.</p></div>
                : <ul className="expense-list">
                  {expenses.map(e => (
  <li key={e.id} className="expense-item">
    {editingId === e.id ? (
      <div className="e-edit">
        <input
          className="e-edit-input e-edit-desc"
          value={editDraft.description}
          onChange={ev => setEditDraft({ ...editDraft, description: ev.target.value })}
        />
        <input
          className="e-edit-input e-edit-amt"
          type="number"
          value={editDraft.amount}
          onChange={ev => setEditDraft({ ...editDraft, amount: parseFloat(ev.target.value) })}
        />
        <select
          className="e-edit-input"
          value={editDraft.category}
          onChange={ev => setEditDraft({ ...editDraft, category: ev.target.value })}
        >
          {Object.keys(CATEGORY_ICONS).map(c => <option key={c}>{c}</option>)}
        </select>
        <button className="e-save" onClick={() => handleUpdate(e.id)}>✓</button>
        <button className="e-cancel" onClick={cancelEdit}>×</button>
      </div>
    ) : (
      <>
        <span className="e-icon" style={{ background: CATEGORY_COLORS[e.category] + "22" }}>
          {CATEGORY_ICONS[e.category]}
        </span>
        <div className="e-info">
          <span className="e-desc">{e.description}</span>
          <span className="e-cat">{e.category}</span>
        </div>
        <span className="e-amt">₹{e.amount.toLocaleString("en-IN")}</span>
        <button className="e-edit-btn" onClick={() => startEdit(e)}>✎</button>
        <button className="e-del" onClick={() => handleDelete(e.id)}>×</button>
      </>
    )}
  </li>
))}
                </ul>
              }
            </section>

            <section className="t-card summary-section">
              <h2 className="t-card-title">By Category</h2>
              {chartData.length > 0 && (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name"
               cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={2}>
            {chartData.map(entry => (
              <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `₹${value.toLocaleString("en-IN")}`}
            contentStyle={{ background: "#0e0e1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f2f2f8" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )}
              {Object.keys(categoryTotals).length === 0
                ? <div className="t-empty"><span>📊</span><p>Summary appears here.</p></div>
                : <ul className="summary-list">
                  {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                    <li key={cat} className="summary-item">
                      <span className="s-icon">{CATEGORY_ICONS[cat]}</span>
                      <span className="s-cat">{cat}</span>
                      <div className="s-bar-wrap">
                        <div className="s-bar" style={{ width: `${(amt / total) * 100}%`, background: CATEGORY_COLORS[cat] }} />
                      </div>
                      <span className="s-amt">₹{amt.toLocaleString("en-IN")}</span>
                    </li>
                  ))}
                </ul>
              }
            </section>
          </div>
        </div>
      </div>
    );
  }

  // ── HOME PAGE ──────────────────────────────────────────────────
  return (
    <div className="home">
      {/* NAV */}
      <nav className="nav">
        <span className="nav-logo">SpendWise</span>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#stats" className="nav-link">Stats</a>
        </div>
        <button className="nav-cta" onClick={() => setView("app")}>Get Started</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-badge">✦ Powered by Gemini AI</div>
            <h1 className="hero-headline">
              Track Every<br />
              <em>Rupee</em> You<br />
              Spend — Instantly
            </h1>
            <p className="hero-sub">
              Just type what you spent in plain English. SpendWise's AI understands, categorizes, and organizes it for you — no forms, no friction.
            </p>
            <div className="hero-actions">
              <button className="btn-hero-primary" onClick={() => setView("app")}>Start Tracking Free →</button>
              <a href="#features" className="btn-hero-ghost">See How It Works</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="float-card fc1">
              <span className="fc-icon">🍜</span>
              <div><p className="fc-title">Lunch with team</p><p className="fc-sub">Food · ₹480</p></div>
            </div>
            <div className="float-card fc2">
              <span className="fc-icon">🚗</span>
              <div><p className="fc-title">Ola to airport</p><p className="fc-sub">Transport · ₹350</p></div>
            </div>
            <div className="float-card fc3">
              <span className="fc-icon">📚</span>
              <div><p className="fc-title">Udemy course</p><p className="fc-sub">Education · ₹799</p></div>
            </div>
            <div className="hero-orb" />
          </div>
        </div>
        <div className="hero-divider" />
      </section>

      {/* STATS */}
      <section className="stats-section" id="stats">
        <div className="stats-inner">
          {[
            { num: "2M+", label: "Expenses Tracked" },
            { num: "50K+", label: "Active Users" },
            { num: "8", label: "Smart Categories" },
            { num: "99.9%", label: "Uptime" },
          ].map(s => (
            <div key={s.label} className="stat-item">
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-inner">
          <p className="section-eyebrow">What SpendWise Does</p>
          <h2 className="section-title">Everything you need to understand your spending</h2>
          <div className="features-grid">
            {[
              { icon: "🧠", title: "AI Auto-Categorize", desc: "Type naturally. Gemini reads your words and fills category, amount, and description instantly." },
              { icon: "📊", title: "Visual Breakdown", desc: "See exactly where your money goes with live category summaries and spend bars." },
              { icon: "✏️", title: "Always Editable", desc: "AI suggestions are a starting point. Review and correct before saving — you stay in control." },
              { icon: "⚡", title: "Instant & Lightweight", desc: "No sign-up friction, no bloat. Open the app and start adding expenses in seconds." },
              { icon: "🔒", title: "Your Data Only", desc: "Expenses are stored in your own backend. No third-party tracking, no ads." },
              { icon: "📱", title: "Works Everywhere", desc: "Responsive design that works seamlessly on mobile, tablet, and desktop." },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about-section" id="about">
        <div className="section-inner about-inner">
          <div className="about-text">
            <p className="section-eyebrow">About SpendWise</p>
            <h2 className="section-title">Built for people who want clarity, not complexity</h2>
            <p className="about-body">
              SpendWise was built during PS-I 2026 at KVGAI Tech as an exploration of AI-powered full-stack applications. The idea was simple: most expense trackers make you fill forms. We wanted to make it as easy as telling a friend what you spent.
            </p>
            <p className="about-body">
              Powered by Google Gemini, a FastAPI backend, and a React frontend — everything is open source and self-hostable.
            </p>
            <button className="btn-outline" onClick={() => setView("app")}>Try It Now →</button>
          </div>
          <div className="about-visual">
            <div className="about-card">
              <p className="about-card-quote">"spent 250 on pizza with roommates"</p>
              <div className="about-arrow">↓ Gemini understands</div>
              <div className="about-parsed">
                <div className="ap-row"><span>Description</span><strong>Pizza with roommates</strong></div>
                <div className="ap-row"><span>Amount</span><strong>₹250</strong></div>
                <div className="ap-row"><span>Category</span><strong>🍜 Food</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="cta-inner">
          <h2 className="cta-title">Get All Your Expense Tools<br />In a Single Platform</h2>
          <p className="cta-sub">No spreadsheets. No manual entry. Just plain English and Gemini AI.</p>
          <button className="btn-hero-primary" onClick={() => setView("app")}>Start Tracking Free →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="nav-logo">SpendWise</span>
            <p>AI-powered expense tracking for everyone.</p>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#stats">Stats</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 SpendWise · Built at KVGAI Tech · PS-I 2026 by Jugraj Singh Bhatia</p>
        </div>
      </footer>
    </div>
  );
}
