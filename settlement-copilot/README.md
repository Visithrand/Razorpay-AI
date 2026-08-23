# Razorpay - AI 

> **AI-powered payment reconciliation agent** — auto-matches transactions across payment gateway, bank statement, and internal ledger with confidence scores, explainable decisions, and a natural-language query engine.

![Match Rate](https://img.shields.io/badge/match_rate-~87%25-10b981?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)
![LLM](https://img.shields.io/badge/LLM-Llama_3.3_70B_via_Groq-orange?style=flat-square)
[![CI](https://github.com/your-org/settlement-copilot/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/settlement-copilot/actions)

---

## 🏗 What We Have Built
We have built an **Intelligent Settlement Copilot** for Razorpay merchants. It is an end-to-end web application (React + FastAPI) that acts as an autonomous financial agent. It ingests massive amounts of raw financial data (Gateway Reports, Bank Statements, and ERP Ledgers) and uses a custom matching engine and a high-performance LLM (Llama 3.3 70B) to reconcile payments seamlessly.

## 🚨 The Problem Statement
Merchants attempting to reconcile their payment gateway settlements against actual bank statements and internal ledgers face a nightmare scenario:
1. **No Unified Source of Truth:** Data arrives from three different sources in three different formats and at three different timings.
2. **Manual & Error-Prone:** Finance teams currently do this **by hand** using massive Excel sheets, hunting for missing UTRs and calculating manual offsets.
3. **Hidden Leaks:** Minor timing drifts and fee adjustments mask actual revenue leakage.
4. **Delayed Financial Close:** Reconciling millions of transactions delays the month-end close by days, leading to "Where's my money?" support tickets and eroding merchant trust.

## 💡 Our Solution
Settlement Copilot eliminates manual reconciliation by introducing an automated, deterministic **3-pass matching engine** paired with a natural language AI assistant. 
Instead of a simple "matched/unmatched" binary, our solution provides a **confidence score (0.0–1.0)** and a human-readable explanation for every single transaction, classifying anomalies into specific exception types.

## ⚙️ What We Actually Do With This Software
1. **Ingest & Normalize:** The software takes raw CSV/Excel dumps from Razorpay, the Merchant's Bank, and the internal ERP ledger.
2. **Tri-Pass Reconciliation Engine:**
   - *Pass 1 (Exact):* Matches UTR, Amount (±₹0.01), and Date (±1 day).
   - *Pass 2 (Fuzzy):* Uses `rapidfuzz` for slightly malformed UTRs, 5% amount tolerance, and 4-day timing drift.
   - *Pass 3 (Batch Unbundler):* Uses subset-sum detection to find when N gateway transactions are batched into a single bank credit.
3. **Generate Explainable Reports:** Every matched row gets a clear explanation (e.g., "Matched because: UTR exact + amount exact + date within 1 day"). Unmatched rows are categorized into `fee_adjusted`, `timing_drift`, `batch`, `missing`, `duplicate`, or `amount_typo`.
4. **Natural Language Querying (NL2SQL):** A merchant can literally type into the dashboard: *"Show me all unmatched transactions above ₹10,000 from last week,"* and the AI will securely translate this to SQL and stream back the exact data.

## 🚀 How It Makes an Impact
- **Financial Velocity:** Reduces month-end reconciliation time from **days to minutes**.
- **Trust & Transparency:** Merchants get absolute clarity on exactly where their money is, categorized down to the penny.
- **Actionable Insights:** By classifying exceptions, merchants can instantly spot if a mismatch is just a "timing drift" (it will arrive tomorrow) vs. an "amount typo" (human error in ERP) vs. "missing" (requires raising a dispute).
- **Scalability:** Automates away the tedious manual labor, allowing finance teams to focus on strategy and anomaly resolution rather than VLOOKUPs.

---

---

## Key Features

- **🎯 Confidence score per match** — not just matched/unmatched; fuzzy matches get a float score (e.g. 0.92) so humans know which "matches" to double-check
- **🧠 Explainable decisions** — click any matched row → "Matched because: UTR exact + amount exact + date within 1 day"
- **⚡ Live confidence threshold slider** — drag to tighten/loosen fuzzy-match tolerance and watch match rate + exception count change in real-time
- **📦 Batch unbundler** — detects when N gateway transactions are batched into a single bank credit
- **💬 NL2SQL agent** — "Show me all unmatched transactions above ₹10,000" → SQL → streamed answer
- **🔬 Test-driven matcher** — `pytest` suite with labeled known-answer fixtures

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  React + Vite Frontend (port 5173)           │
│  Upload Zones │ Match Dashboard │ Exception Table │ AI Chat  │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST + SSE
┌───────────────────────────▼─────────────────────────────────┐
│              FastAPI Backend (port 8000)                      │
│   /upload  /matches  /exceptions  /ask  /rematch  /reports   │
│  ┌────────────┐  ┌─────────────────────────────────────────┐ │
│  │   Ingest   │  │      3-Pass Matching Engine             │ │
│  │ CSV → DB   │  │  exact.py → fuzzy.py → batch_unbundler │ │
│  └────────────┘  │  → confidence + reason per match       │ │
│                  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │     NL2SQL Agent (Llama 3.3 70B / Groq)                │ │
│  │     Schema-grounded → generate SQL → EXPLAIN validate  │ │
│  │     → execute → stream answer token-by-token           │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ SQLAlchemy ORM
┌───────────────────────────▼─────────────────────────────────┐
│                    PostgreSQL                                  │
│  raw_transactions │ match_results │ exceptions │ reports     │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start (One Command)

```bash
# Clone and set up environment
git clone https://github.com/your-org/settlement-copilot
cd settlement-copilot
cp .env.example .env
# Edit .env to add your GROQ_API_KEY

# Generate sample data
cd data && python generate_synthetic.py && cd ..

# Start everything
docker-compose up --build
```

Open **http://localhost:5173** and upload the CSVs from `data/samples/`.

---

## Running Without Docker (Dev Mode)

```bash
# Backend
cd backend
pip install -r requirements.txt
# Set DATABASE_URL and GROQ_API_KEY in your shell
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Expected output:
```
tests/test_matcher.py::TestConfidenceScoring::test_perfect_match_score PASSED
tests/test_matcher.py::TestExactMatcher::test_should_match_utr_and_amount_and_date PASSED
tests/test_matcher.py::TestBatchUnbundler::test_batch_of_three_should_match PASSED
... (all pass)
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | FastAPI (Python 3.11+) | Async + streaming, production-grade |
| DB | PostgreSQL | Relational joins across 3 sources |
| Matching | Python + pandas + rapidfuzz | Deterministic, auditable, no ML bloat |
| LLM | Llama 3.3 70B via Groq | Free tier, fast inference, streaming |
| Frontend | React + Vite | SPA dashboard + streaming chat |
| Container | Docker + Docker Compose | One-command startup |
| CI | GitHub Actions | pytest on every push |

---

## Metrics (on synthetic dataset, seed=42)

| Metric | Value |
|--------|-------|
| Total gateway transactions | ~300 |
| Match rate (threshold=0.70) | ~87% |
| Avg confidence score | ~0.91 |
| Exact matches | ~250 |
| Fuzzy matches | ~12 |
| Batch groups detected | 4 |
| Exceptions categorised | ~22 |

---

## Failure Story (FloatChat Lesson Applied)

In a previous project (FloatChat), the NL2SQL agent generated syntactically invalid SQL and returned errors to users live during demos. 

**Fix applied here from day one:** The `validate_sql()` function in `nl2sql.py` runs `EXPLAIN <sql>` before any real execution. If the query errors, the agent re-prompts Groq with the error context for a corrected query. Users never see a raw SQL error.

---

## Project Structure

```
settlement-copilot/
├── README.md
├── docker-compose.yml
├── .env.example
├── .github/workflows/ci.yml
├── data/
│   ├── generate_synthetic.py
│   └── samples/          # Committed CSVs for instant demo
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI entrypoint
│   │   ├── models.py     # SQLAlchemy: RawTransaction, MatchResult, Exception, Report
│   │   ├── ingest.py     # CSV → normalized schema
│   │   ├── database.py   # DB engine + session
│   │   ├── matcher/
│   │   │   ├── exact.py
│   │   │   ├── fuzzy.py
│   │   │   ├── batch_unbundler.py
│   │   │   ├── scoring.py    # Confidence score helper
│   │   │   └── engine.py     # Orchestrates 3 passes
│   │   ├── agent/
│   │   │   ├── nl2sql.py     # Groq streaming NL2SQL
│   │   │   └── rag.py        # Schema context (extendable)
│   │   └── api/routes.py
│   ├── tests/
│   │   ├── test_matcher.py   # Known-answer fixtures
│   │   ├── test_nl2sql.py
│   │   └── conftest.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   ├── index.css
    │   └── components/
    │       ├── UploadZone.jsx
    │       ├── MatchDashboard.jsx
    │       ├── MatchTable.jsx
    │       ├── ExceptionTable.jsx
    │       ├── ChatPanel.jsx
    │       ├── ConfidenceSlider.jsx
    │       └── TransactionModal.jsx
    ├── Dockerfile
    └── nginx.conf
```
