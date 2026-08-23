# Settlement Copilot — Architecture

## Overview

Settlement Copilot is a three-tier web application: React SPA + FastAPI backend + PostgreSQL.

## Data Flow

```
CSV Upload
    │
    ▼
Ingestion (ingest.py)
  - Detect column aliases for gateway/bank/ledger formats
  - Normalize to standard schema (utr, amount, net_amount, date, description)
  - Persist to raw_transactions table with run_id
    │
    ▼
3-Pass Matching Engine (matcher/engine.py)
    │
    ├── Pass 1: Exact (exact.py)
    │     UTR hash map → O(1) lookup
    │     UTR exact + |net_amount - bank_amount| ≤ ₹0.01 + |date_diff| ≤ 1 day
    │     Confidence: 0.90–1.00
    │
    ├── Pass 2: Fuzzy (fuzzy.py)
    │     rapidfuzz token_sort_ratio on UTR strings
    │     ±5% amount tolerance + ±4 day date window
    │     Confidence: 0.55–0.89 (weighted signal sum)
    │
    └── Pass 3: Batch (batch_unbundler.py)
          Greedy + bounded exhaustive subset-sum
          Detect N gateway rows summing to 1 bank credit
          Confidence: 0.60–0.90
    │
    ▼
Results Persistence
  - match_results: each matched pair with confidence + reason
  - exceptions: categorised unmatched rows
  - reports: run aggregate stats
  - JSON artifact: reports/run_<date>_<run_id[:8]>.json
    │
    ▼
API Layer (FastAPI)
  - /upload   → ingest + match synchronously
  - /matches  → paginated match results (filterable by threshold)
  - /rematch  → re-run with new threshold (powers live slider)
  - /ask      → SSE streaming NL2SQL agent response
    │
    ▼
Frontend (React + Vite)
  - Animated donut chart for match rate
  - Live confidence threshold slider (debounced, calls /rematch)
  - Exception table with dual category/source filters
  - Chat panel with token-by-token streaming via Groq
  - Transaction detail modal with confidence ring + reasoning
```

## Confidence Scoring Formula

```
Confidence = UTR_score + Amount_score + Date_score + Desc_score

UTR_score:
  1.0 exact  → +0.40
  ≥0.90 fuzzy → +0.25
  ≥0.70 fuzzy → +0.12

Amount_score:
  ≤0.1% diff  → +0.30 (exact)
  ≤2% diff    → +0.20 (fee-adjusted)
  ≤5% diff    → +0.12
  ≤10% diff   → +0.06

Date_score:
  ≤1 day  → +0.20
  ≤3 days → +0.14
  ≤7 days → +0.08

Desc_score:
  ≥80% similarity → +0.10
  ≥60% similarity → +0.05

Max = 1.00 (capped)
```

## Exception Categories

| Category | Description | Detection |
|----------|-------------|-----------|
| fee_adjusted | Amount differs by <3% | Fuzzy match on UTR, amount mismatch |
| timing_drift | Date differs by 2–7 days | Fuzzy match, date window 4 days |
| batch | Part of aggregated bank credit | Subset-sum unbundler |
| missing | Only in one source | No match found in any pass |
| duplicate | Same UTR appears twice in bank | UTR collision detection |
| amount_typo | Amount off by <10% | Fuzzy match, amount mismatch |

## NL2SQL Agent

```
User question (plain English)
    │
    ▼ Groq Llama 3.3 70B
SQL generation (schema-grounded prompt, 3-4 table schema)
    │
    ▼
EXPLAIN <sql> validation (read-only, catches syntax errors before execution)
    │
    ├── If error: re-prompt with error context (retry once)
    │
    ▼
Execute SELECT query (LIMIT 50 auto-appended)
    │
    ▼ Groq Llama 3.3 70B (streaming)
Natural language answer (streamed token-by-token via SSE)
    │
    ▼
Frontend renders tokens as they arrive (chat bubble with blinking cursor)
```

## Design Decisions

1. **No ML models in the matcher** — deterministic rules + rapidfuzz string similarity. This makes the matcher auditable and testable with known-answer fixtures.

2. **Validate-before-execute in NL2SQL** — learned from FloatChat failure. Every SQL query is EXPLAIN'd before execution. Users never see raw SQL errors.

3. **run_id isolation** — every upload gets a UUID run_id. This allows multiple reconciliation runs without data collision, and powers the /rematch endpoint for live threshold sliding.

4. **Streaming response** — FastAPI's StreamingResponse + Groq's streaming API = token-by-token chat feel without websockets. No extra infrastructure.

5. **Subset-sum batch detection** — greedy pass first (fast), then bounded exhaustive search up to batch size 10. This handles the most common real-world batch sizes without exponential complexity.
