"""
NL2SQL Agent powered by Llama 3.3 70B via Groq.

Flow:
  1. Build schema-grounded system prompt
  2. Call Groq to generate a SELECT query
  3. Validate: execute with LIMIT 0 (read-only dry-run) — if it errors, re-prompt
  4. Execute real query, fetch results
  5. Stream natural-language answer back to caller as an async generator

This validate-before-answer pattern prevents hallucinated SQL from
erroring live on demo day.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import AsyncGenerator

from groq import AsyncGroq
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = "llama-3.3-70b-versatile"

SCHEMA_CONTEXT = """
You are a PostgreSQL expert for a payment reconciliation system called Settlement Copilot.

DATABASE SCHEMA
===============

Table: raw_transactions
  id            INTEGER PRIMARY KEY
  run_id        TEXT           -- reconciliation run identifier
  source        TEXT           -- 'gateway', 'bank', or 'ledger'
  txn_id        TEXT           -- transaction ID from source system
  utr           TEXT           -- Unified Transaction Reference (22-digit)
  amount        FLOAT          -- original amount in INR
  fee           FLOAT          -- gateway fee in INR
  net_amount    FLOAT          -- amount after fees
  date          TIMESTAMP      -- transaction date
  description   TEXT           -- transaction description/narration
  reference     TEXT           -- reference or order ID
  status        TEXT           -- transaction status
  payment_method TEXT          -- upi, card, netbanking, wallet

Table: match_results
  id            INTEGER PRIMARY KEY
  run_id        TEXT
  gateway_txn_id INTEGER       -- FK → raw_transactions (gateway source)
  bank_txn_id   INTEGER        -- FK → raw_transactions (bank source)
  ledger_txn_id INTEGER        -- FK → raw_transactions (ledger source, nullable)
  confidence    FLOAT          -- match confidence 0.0–1.0
  reason        TEXT           -- why this match was made (human-readable)
  match_type    TEXT           -- 'exact', 'fuzzy', or 'batch'
  status        TEXT           -- 'matched', 'partial', or 'unmatched'
  gateway_amount FLOAT
  bank_amount   FLOAT
  gateway_date  TIMESTAMP
  bank_date     TIMESTAMP
  gateway_utr   TEXT
  bank_utr      TEXT
  gateway_txn_ref TEXT

Table: exceptions
  id            INTEGER PRIMARY KEY
  run_id        TEXT
  txn_id        INTEGER        -- FK → raw_transactions
  source        TEXT           -- which source this exception came from
  category      TEXT           -- 'fee_adjusted','timing_drift','batch','missing','duplicate','amount_typo'
  description   TEXT           -- human-readable description of the exception
  amount        FLOAT
  date          TIMESTAMP
  utr           TEXT

Table: reports
  id            INTEGER PRIMARY KEY
  run_id        TEXT UNIQUE
  run_at        TIMESTAMP
  total_gateway INTEGER
  total_bank    INTEGER
  total_ledger  INTEGER
  matched       INTEGER
  unmatched     INTEGER
  match_rate    FLOAT          -- 0.0–1.0
  exception_breakdown JSONB   -- {"fee_adjusted": 3, "missing": 5, ...}
  threshold_used FLOAT
  avg_confidence FLOAT
  exact_matches INTEGER
  fuzzy_matches INTEGER
  batch_matches INTEGER

RULES
=====
1. Generate ONLY SELECT statements. Never INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE.
2. Always use the most recent run_id unless the user specifies otherwise.
   Use: WHERE run_id = (SELECT run_id FROM reports ORDER BY run_at DESC LIMIT 1)
3. Format currency amounts with 2 decimal places in your SQL (e.g., ROUND(amount, 2)).
4. Return ONLY the raw SQL query. No markdown, no explanation, no code fences.
5. If the question cannot be answered with SQL, return exactly: UNSUPPORTED
"""

ANSWER_PROMPT = """
You are a helpful financial analyst. Given the user's question and the SQL query results,
provide a clear, concise, and insightful answer in plain English.
Format currency values as ₹X,XXX.XX.
If the results are empty, say so clearly and suggest why.
Keep answers under 150 words unless the data requires more detail.
"""


async def generate_sql(question: str) -> str:
    """Ask Groq to generate a SQL SELECT for the given question."""
    client = AsyncGroq(api_key=GROQ_API_KEY)
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SCHEMA_CONTEXT},
            {"role": "user", "content": f"Generate a PostgreSQL SELECT query for: {question}"},
        ],
        temperature=0.1,
        max_tokens=512,
    )
    sql = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    sql = re.sub(r"^```(?:sql)?\n?", "", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\n?```$", "", sql)
    return sql.strip()


def validate_sql(sql: str, db: Session) -> tuple[bool, str]:
    """
    Validate by running EXPLAIN. Returns (is_valid, error_message).
    This executes no data changes — it is purely a read-only validation.
    """
    if sql.upper() == "UNSUPPORTED":
        return False, "Question cannot be answered with available data."

    # Safety check: only allow SELECT statements
    first_word = sql.strip().split()[0].upper() if sql.strip() else ""
    if first_word != "SELECT":
        return False, f"Unsafe SQL: expected SELECT, got {first_word}"

    try:
        db.execute(text(f"EXPLAIN {sql}"))
        return True, ""
    except Exception as exc:
        return False, str(exc)


def execute_sql(sql: str, db: Session, limit: int = 50) -> list[dict]:
    """Execute the validated SQL and return rows as list of dicts."""
    # Add LIMIT if not present to prevent unbounded queries
    if "LIMIT" not in sql.upper():
        sql = f"{sql.rstrip(';')} LIMIT {limit}"

    result = db.execute(text(sql))
    cols = list(result.keys())
    return [dict(zip(cols, row)) for row in result.fetchall()]


async def ask_stream(
    question: str,
    db: Session,
) -> AsyncGenerator[str, None]:
    """
    End-to-end NL → SQL → Answer streaming generator.

    Yields SSE-compatible text chunks.
    """
    # Step 1: Generate SQL
    yield "🔍 Analyzing your question...\n\n"

    try:
        sql = await generate_sql(question)
    except Exception as exc:
        yield f"❌ Could not generate query: {exc}"
        return

    if sql.upper() == "UNSUPPORTED":
        yield "I'm sorry, I can't answer that question with the available data. Try asking about transaction amounts, match rates, exceptions, or specific UTR numbers."
        return

    yield f"📊 Running query...\n\n"

    # Step 2: Validate
    is_valid, err = validate_sql(sql, db)
    if not is_valid:
        # Re-try once with error context
        try:
            correction_prompt = f"The following SQL had an error: {err}\nSQL: {sql}\nOriginal question: {question}\nFix the SQL:"
            client = AsyncGroq(api_key=GROQ_API_KEY)
            resp = await client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SCHEMA_CONTEXT},
                    {"role": "user", "content": correction_prompt},
                ],
                temperature=0.1,
                max_tokens=512,
            )
            sql = resp.choices[0].message.content.strip()
            sql = re.sub(r"^```(?:sql)?\n?", "", sql, flags=re.IGNORECASE)
            sql = re.sub(r"\n?```$", "", sql)
            is_valid, err2 = validate_sql(sql, db)
            if not is_valid:
                yield f"❌ Could not build a valid query: {err2}"
                return
        except Exception as exc:
            yield f"❌ Query error: {err}"
            return

    # Step 3: Execute
    try:
        rows = execute_sql(sql, db)
    except Exception as exc:
        yield f"❌ Query execution error: {exc}"
        return

    rows_json = json.dumps(rows[:20], default=str, indent=2)  # cap at 20 rows for context

    # Step 4: Stream natural-language answer
    client = AsyncGroq(api_key=GROQ_API_KEY)
    stream = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": ANSWER_PROMPT},
            {
                "role": "user",
                "content": (
                    f"User question: {question}\n\n"
                    f"SQL executed:\n{sql}\n\n"
                    f"Results ({len(rows)} rows):\n{rows_json}\n\n"
                    "Answer in plain English:"
                ),
            },
        ],
        temperature=0.3,
        max_tokens=400,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
