# Settlement Copilot

### AI-Assisted Payment Reconciliation with Deterministic Matching, Explainable Decisions, and Human-in-the-Loop Exceptions

> **Reconciliation should not guess. It should know when it has enough evidence to match — and know when to ask a human.**

Settlement Copilot is an AI-assisted financial reconciliation system that automatically reconciles payment transactions across **gateway, bank, and ledger data sources**.

Instead of treating every transaction as an AI decision, Settlement Copilot uses deterministic financial rules for high-confidence matching and applies AI where it provides genuine value: **ambiguous-case reasoning, exception analysis, and human-readable explanations**.

The system produces a complete reconciliation run with:

* Automatic transaction matching
* Exact and fuzzy matching
* Multi-signal confidence scoring
* Batch reconciliation
* Duplicate and missing transaction detection
* Explainable match decisions
* Exception classification
* Human-review routing for ambiguous cases
* Reconciliation metrics
* Audit-friendly reports

---

## 1. The Problem

Payment systems generate multiple representations of the same financial event.

A single customer payment may appear independently in:

```text
Payment Gateway
       │
       ├── Transaction ID
       ├── Amount
       ├── Timestamp
       └── Payment status
       
Bank
       │
       ├── Bank reference
       ├── Settled amount
       ├── Settlement date
       └── Bank status
       
Ledger
       │
       ├── Accounting reference
       ├── Amount
       ├── Posting date
       └── Accounting status
```

These records do not always line up perfectly.

Real reconciliation can involve:

* Different transaction identifiers
* Settlement delays
* Date differences
* Gateway or settlement fees
* Missing transactions
* Duplicate transactions
* Amount discrepancies
* Formatting differences
* Partial records
* Ambiguous references

The difficult part is not simply finding identical rows.

The difficult part is answering:

> **"Do these records represent the same financial transaction, and how confident are we?"**

A system that incorrectly matches two transactions can be more dangerous than a system that leaves a transaction unresolved.

Settlement Copilot therefore follows a core principle:

> **When evidence is insufficient, do not guess. Create an exception.**

---

# 2. Our Solution

Settlement Copilot converts raw financial records into an auditable reconciliation workflow.

```text
             DATA SOURCES
                  │
        ┌─────────┼─────────┐
        │         │         │
     Gateway     Bank     Ledger
        │         │         │
        └─────────┼─────────┘
                  ↓
        Data Validation
                  ↓
        Data Normalization
                  ↓
       Candidate Generation
                  ↓
       Reconciliation Engine
                  ↓
       ┌────────────────────┐
       │ Matching Signals   │
       │                    │
       │ Exact Matching     │
       │ Reference Matching │
       │ Amount Matching    │
       │ Date Tolerance     │
       │ Fuzzy Matching     │
       │ Batch Matching     │
       └─────────┬──────────┘
                 ↓
         Confidence Scoring
                 ↓
       ┌─────────┴─────────┐
       ↓                   ↓
   High Confidence      Ambiguous
       ↓                   ↓
   AUTO-MATCH         HUMAN REVIEW
       │                   │
       └─────────┬─────────┘
                 ↓
        Reports & Metrics
```

The system is designed so that the **data source layer can be replaced independently**.

The current implementation uses controlled synthetic data for evaluation because real financial transaction data is sensitive and unavailable to the project.

The reconciliation engine itself is independent of the synthetic-data generator.

---

# 3. Why Synthetic Data?

This project intentionally uses **synthetic financial data**.

Synthetic data is not being presented as production Razorpay transaction data.

Instead, it gives us something more useful for engineering evaluation:

### Known ground truth.

Because we generate the dataset ourselves, we know the expected relationship between transactions before running the reconciliation system.

For example:

```text
Gateway
TXN_1001
₹2,450
21 Aug

Bank
92831
₹2,450
22 Aug

Ledger
TXN_1001
₹2,450
21 Aug

Ground Truth:
MATCH
```

The reconciliation engine does not receive the ground-truth answer.

It must independently determine the result.

This allows us to measure:

* Precision
* Recall
* False-match rate
* Automatic-resolution rate
* Exception rate
* Processing throughput

The synthetic dataset also intentionally contains difficult cases rather than only clean matches.

---

# 4. Synthetic Dataset Scenarios

Our evaluation data is designed to reproduce common reconciliation conditions.

| Scenario                     | Expected Behaviour                |
| ---------------------------- | --------------------------------- |
| Exact transaction match      | Automatic match                   |
| Reference variation          | Fuzzy/reference match             |
| Settlement date difference   | Match within configured tolerance |
| Amount mismatch              | Exception                         |
| Missing bank transaction     | Unmatched                         |
| Missing ledger transaction   | Unmatched                         |
| Duplicate transaction        | Duplicate exception               |
| Settlement fee difference    | Investigate                       |
| Partial/ambiguous evidence   | Human review                      |
| Multiple possible candidates | Ambiguous exception               |

The goal is not to create a dataset that makes the system look good.

The goal is to create a dataset that allows the system to be **measured honestly**.

---

# 5. Core Design Principle: AI Where It Helps, Deterministic Logic Where It Matters

A financial reconciliation system should not delegate every decision to an LLM.

We deliberately separate deterministic financial computation from AI-assisted reasoning.

| Operation                  | Approach             | Reason                         |
| -------------------------- | -------------------- | ------------------------------ |
| Amount comparison          | Deterministic        | Financial values must be exact |
| Currency validation        | Deterministic        | No semantic reasoning required |
| Transaction ID comparison  | Deterministic        | Exact and auditable            |
| Date tolerance             | Deterministic        | Explicit business rule         |
| Candidate generation       | Algorithmic          | Efficient and predictable      |
| Fuzzy reference matching   | Similarity algorithm | Explainable                    |
| Confidence calculation     | Scoring logic        | Reproducible                   |
| Match decision             | Deterministic policy | Financial safety               |
| Ambiguous-case explanation | AI                   | Natural-language reasoning     |
| Exception summarization    | AI                   | Helps human investigators      |

### Why not use an LLM for everything?

Because:

> **₹5,000 equals ₹5,000 regardless of what an LLM thinks.**

Financial matching should be reproducible, testable and auditable.

AI is used where language understanding and contextual reasoning add value—not where simple deterministic computation is superior.

---

# 6. Matching Engine

Settlement Copilot uses multiple signals instead of relying on a single field.

A simplified decision flow is:

```text
Exact reference match
        ↓
Amount validation
        ↓
Date tolerance validation
        ↓
Candidate similarity
        ↓
Additional transaction signals
        ↓
Confidence score
        ↓
Decision policy
```

A transaction may receive signals such as:

```text
Amount Match          ✓
Reference Match       ✓
Currency Match        ✓
Date Within Tolerance ✓
Status Compatible     ✓
```

These signals are combined into a confidence score.

The important distinction is:

> **Confidence is evidence about a decision, not permission to blindly guess.**

---

# 7. Confidence-Based Decisioning

The system separates automatic decisions from uncertain cases.

Example policy:

```text
Confidence >= AUTO_MATCH_THRESHOLD
            ↓
        AUTO-MATCH

Confidence between review thresholds
            ↓
        HUMAN REVIEW

Low confidence
            ↓
         EXCEPTION
```

The exact thresholds are configurable and evaluated against the benchmark dataset.

The system does not force every transaction into a match.

This is intentional.

For financial reconciliation:

> **A controlled exception is preferable to an incorrect automatic match.**

---

# 8. Explainability

Every reconciliation decision should be understandable.

Example:

```text
Transaction: TXN_48291

Gateway
Amount: ₹2,450
Reference: PAY_92831
Date: 21 Aug

Bank
Amount: ₹2,450
Reference: 92831
Date: 22 Aug

Ledger
Amount: ₹2,450
Reference: PAY_92831
Date: 21 Aug
```

Signals:

```text
Amount match          ✓
Reference similarity  ✓
Date tolerance        ✓
Currency match        ✓
```

Result:

```text
Confidence: 98.7%
Decision: AUTO-MATCH
```

The system can then generate a human-readable explanation such as:

> The gateway, bank and ledger records have matching amounts and compatible references. The one-day settlement date difference is within the configured tolerance, resulting in a high-confidence match.

---

# 9. Exception Handling

A reconciliation system should not hide uncertainty.

Settlement Copilot explicitly exposes unresolved transactions.

Examples include:

### Amount discrepancy

```text
Gateway: ₹5,000
Bank:    ₹4,950
Ledger:  ₹5,000

Difference: ₹50

Decision:
HUMAN REVIEW
```

### Missing bank transaction

```text
Gateway: TXN_7812
Bank:    Not found
Ledger:  TXN_7812

Decision:
UNMATCHED
```

### Duplicate

```text
Gateway:
TXN_8121

Bank:
TXN_8121
TXN_8121

Decision:
DUPLICATE / INVESTIGATE
```

### Ambiguous match

```text
Gateway:
₹2,000

Candidate Bank Records:
₹2,000 → Candidate A
₹2,000 → Candidate B

Decision:
AMBIGUOUS
```

Instead of selecting one arbitrarily, the system routes the case for review.

---

# 10. AI-Assisted Exception Analysis

AI is particularly useful after deterministic reconciliation has identified an ambiguous or unresolved case.

For example:

```text
Gateway amount: ₹5,000
Bank amount: ₹4,950
Ledger amount: ₹5,000
Reference: PAY_78192
Date difference: 1 day
```

The AI layer can explain:

```text
Potential explanation:
The ₹50 difference may correspond to a settlement fee or
other deduction. The records share a compatible reference
and settlement date, but the amount discrepancy prevents
automatic reconciliation.

Recommended action:
Review settlement fee configuration and bank settlement
details.
```

The AI does not alter the financial records.

It assists the human investigator.

---

# 11. Batch Reconciliation

The system is designed around a **batch**, not a cherry-picked transaction.

A reconciliation run processes a complete dataset and produces:

```text
Total transactions
Matched transactions
Unmatched transactions
Exceptions
Duplicate records
Match rate
Confidence distribution
Exception breakdown
```

This aligns with the Finance Controller track's requirement to demonstrate a reconciliation loop over a **50+ record synthetic batch** with measured results and an honest exception list.

---

# 12. Evaluation Methodology

We evaluate the system using synthetic datasets with known ground truth.

The evaluation process is:

```text
Generate Dataset
       ↓
Assign Ground Truth
       ↓
Inject Realistic Discrepancies
       ↓
Run Reconciliation Engine
       ↓
Compare Predictions
       ↓
Calculate Metrics
```

The system does not receive the ground-truth labels during reconciliation.

---

# 13. Evaluation Metrics

We report multiple metrics rather than presenting a single match-rate number.

### Precision

Of all transactions classified as matches:

> How many were actually correct?

```text
Precision =
True Positives /
(True Positives + False Positives)
```

### Recall

Of all transactions that should have been matched:

> How many did the system correctly identify?

```text
Recall =
True Positives /
(True Positives + False Negatives)
```

### False-Match Rate

Measures incorrect automatic matches.

This is particularly important because false reconciliation can create financial risk.

### Automatic Resolution Rate

Measures how much of the batch can be resolved without human intervention.

```text
Automatic Resolution Rate =
Automatically Resolved Transactions /
Total Transactions
```

### Exception Rate

Measures how much work remains for human investigators.

---

# 14. Benchmark Results

> **These numbers will be populated from the final reproducible benchmark run. No benchmark value is manually entered.**

| Metric                    | Result |
| ------------------------- | -----: |
| Dataset size              |  `TBD` |
| Correct matches           |  `TBD` |
| Precision                 |  `TBD` |
| Recall                    |  `TBD` |
| False-match rate          |  `TBD` |
| Automatic resolution rate |  `TBD` |
| Exception rate            |  `TBD` |
| Processing time           |  `TBD` |

The benchmark can be rerun against the same dataset to reproduce the reported results.

---

##  AI Judgment Disclosure — Deterministic Safety Matrix

Settlement Copilot explicitly demarcates where AI is used versus where deterministic safety rules execute:

| Operation | AI? | Reason / Implementation |
| :--- | :---: | :--- |
| **Amount Comparison** | ❌ | Deterministic float comparison |
| **Currency Validation** | ❌ | Deterministic regex & numeric parsing |
| **Date Tolerance** | ❌ | Business rule (T+0 to T+2 date drift window) |
| **Exact Matching** | ❌ | Deterministic UTR & amount hashing |
| **Candidate Generation** | ❌ | Algorithmic database query indexing |
| **Fuzzy Matching** | ❌ | Similarity algorithm (Levenshtein & SequenceMatcher) |
| **Confidence Scoring** | ❌ | Reproducible weighted score formula |
| **Final Financial Decision** | ❌ | Safety enforcement |
| **Exception Explanation** | ✅ | Language reasoning over evidence context |
| **Ambiguous-Case Analysis** | ✅ | Contextual root-cause reasoning |
| **Human Investigation Summary**| ✅ | Productivity & financial synthesis |

# Settlement Copilot — Autonomous Settlement Intelligence Platform

## ⚡ The Killer Exception Copilot Workflow

Settlement Copilot delivers the complete 7-stage autonomous finance workflow:

```text
              TRANSACTIONS
                   ↓
             RECONCILIATION
                   ↓
          ┌────────┴────────┐
          ↓                 ↓
       MATCHED          EXCEPTION
          ↓                 ↓
      REPORTING       EXCEPTION COPILOT
                            ↓
                     CLASSIFY PROBLEM (MISSING_BANK_RECORD, AMOUNT_MISMATCH, DUPLICATE...)
                            ↓
                     FIND EVIDENCE (Gateway vs Bank vs ERP amounts & UTR)
                            ↓
                    GENERATE EXPLANATION (Grounding reasoning in facts)
                            ↓
                    RECOMMEND ACTION (Structured priority & next steps)
                            ↓
                  ┌─────────┴─────────┐
                  ↓                   ↓
              RESOLVE             REVIEW (Human Feedback & Learning)
```

### 1. Standardized Exception Classification Codes
- `MISSING_BANK_RECORD`
- `AMOUNT_MISMATCH`
- `DUPLICATE`
- `SETTLEMENT_DELAY`
- `FEE_DEDUCTION`
- `REFERENCE_MISMATCH`
- `AMBIGUOUS_MATCH`

### 2. Deterministic Exception Priority Score Matrix
- 🚨 **CRITICAL**: Mismatch > ₹5,00,000 or Duplicate transaction
- 🔴 **HIGH**: Mismatch > ₹50,000 or Missing bank credit
- 🟡 **MEDIUM**: Mismatch > ₹1,000
- 🟢 **LOW**: Mismatch ≤ ₹1,000

### 3. "Why Am I Seeing This?" & "What Should I Do?" Transparency
Displays exact amounts, difference, reference similarity %, date diff, confidence score, and numbered action steps.

### 4. Operational Learning & Human Feedback Loop (`POST /api/exceptions/{id}/feedback`)
Finance team decisions (`CONFIRMED_FEE`, `CONFIRMED_TYPO`, `CONFIRMED_DELAY`, `OVERRIDDEN`) are persisted in `human_feedback` table to train future exception handling.

### 5. "What Changed?" Operational Intelligence (`GET /api/settlement/what-changed`)
Calculates run-over-run deltas (e.g. *Exception rate increased 6.6 percentage points compared with previous run due to fee adjustments*).

---

## 🏗️ System Architecture

# 15. Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
│                                                               │
│ Dashboard │ Reconciliation Runs │ Transactions │ Exceptions  │
│ Reports   │ Metrics             │ Explanations               │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                          API LAYER                             │
│                                                               │
│ Reconciliation │ Transactions │ Exceptions │ Reports         │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                    RECONCILIATION SERVICE                     │
│                                                               │
│ Validation → Normalization → Candidate Generation → Matching  │
│ → Confidence → Decision → Exception Routing                  │
└───────────────┬─────────────────────────────┬─────────────────┘
                │                             │
                ↓                             ↓
┌────────────────────────────┐    ┌─────────────────────────────┐
│     MATCHING ENGINE        │    │        AI SERVICES          │
│                            │    │                             │
│ Exact Matching             │    │ Exception Analysis         │
│ Fuzzy Matching             │    │ Explanation Generation     │
│ Batch Matching             │    │ Investigation Assistance   │
│ Amount Validation          │    │                             │
│ Date Tolerance             │    │ AI does not make the final │
│ Duplicate Detection        │    │ financial decision.        │
└──────────────┬─────────────┘    └─────────────────────────────┘
               │
               ↓
┌───────────────────────────────────────────────────────────────┐
│                         DATABASE                              │
│                                                               │
│ Runs │ Transactions │ Matches │ Exceptions │ Reports          │
└───────────────────────────────────────────────────────────────┘
```

---

# 16. Separation of Responsibilities

The project intentionally separates:

### API layer

Handles HTTP requests and responses.

### Service layer

Coordinates business workflows.

### Matching layer

Contains reconciliation algorithms.

### AI layer

Handles AI-assisted interpretation and explanations.

### Data layer

Handles persistence.

### Reporting layer

Produces reconciliation reports and metrics.

This separation makes the system easier to test, extend and replace.

---

# 17. Suggested Repository Structure

```text
settlement-copilot/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── matching/
│   │   ├── reconciliation/
│   │   ├── ai/
│   │   └── reports/
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   └── package.json
│
├── data/
│   ├── synthetic/
│   └── scenarios/
│
├── docs/
│   ├── architecture.md
│   ├── evaluation.md
│   └── failure-recovery.md
│
├── docker-compose.yml
├── .env.example
├── README.md
└── LICENSE
```

---

# 18. Failure Recovery

Building a financial workflow means designing for failure.

During development, several classes of failures were encountered and addressed, including:

* Database schema mismatches
* API/service connectivity failures
* Invalid input data
* Missing fields
* Matching ambiguity
* Duplicate records
* Low-confidence decisions
* Dependency and environment issues

The important principle is:

> **A failure should become an explicit system state, not silently corrupt the reconciliation result.**

Examples:

```text
Invalid input
     ↓
Validation error
     ↓
No reconciliation performed
```

```text
Low confidence
     ↓
Human-review exception
     ↓
No automatic match
```

```text
AI service unavailable
     ↓
Financial reconciliation continues
     ↓
AI explanation unavailable
     ↓
Core result remains deterministic
```

The last case is particularly important.

### The AI layer is not a single point of failure for financial correctness.

If the AI service becomes unavailable, deterministic matching can still produce the core reconciliation result.

---

# 19. Safe Failure Philosophy

Settlement Copilot follows three principles:

### 1. Never silently guess

If evidence is insufficient, create an exception.

### 2. Never let AI silently change financial data

AI generates explanations and investigation assistance.

Financial values remain controlled by the reconciliation pipeline.

### 3. Never hide unresolved records

Every unresolved transaction remains visible in the exception report.

---

# 20. Auditability

Every reconciliation run should be traceable.

A run records:

```text
Run ID
Run timestamp
Input sources
Total records
Matched records
Unmatched records
Exception breakdown
Threshold configuration
Confidence statistics
Report location
```

A transaction-level decision can be traced back to the signals used by the matching engine.

This makes the system suitable for investigation rather than functioning as a black-box prediction tool.

---

# 21. Reproducibility

The same input dataset and configuration should produce the same deterministic reconciliation result.

The evaluation workflow is designed to make benchmark results reproducible.

This allows us to compare changes to:

* Matching rules
* Confidence thresholds
* Candidate-generation logic
* Fuzzy matching parameters
* AI explanation behaviour

without changing the underlying dataset.

---

# 22. Production Architecture

The current implementation uses synthetic data because real payment and banking data is sensitive.

A production deployment would replace the synthetic-data adapters with authenticated connectors:

```text
                Production Sources

         Payment Gateway APIs
                  │
         Bank Statement APIs
                  │
         Accounting / Ledger APIs
                  │
                  ↓
          Source Adapters
                  ↓
        Common Transaction Model
                  ↓
        Existing Reconciliation Engine
```

The core matching engine does not need to know where the transaction originated.

This creates a clear migration path from:

```text
Synthetic Data
```

to:

```text
Authenticated Production Connectors
```

without rewriting the reconciliation logic.

---

# 23. Security Considerations

The prototype does not use real customer payment data.

Production deployment would require:

* Secret management
* Authentication and authorization
* Encryption in transit
* Encryption at rest
* Role-based access control
* Audit logging
* PII minimization
* Data retention policies
* API rate limiting
* Input validation
* Secure credential rotation

No production credentials or secrets are included in this repository.

---

# 24. Technology Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL

### Frontend

* React
* TypeScript
* Vite

### AI

* LLM-based explanation and exception analysis

### Data Processing

* Python data-processing stack
* Controlled synthetic transaction generator

### Infrastructure

* Docker
* Docker Compose

### Persistence

* PostgreSQL

---

# 25. Running the Project

## Prerequisites

* Docker
* Docker Compose

Optional for local development:

* Python 3.x
* Node.js
* npm

---

## Environment Configuration

Create a local environment file from:

```text
.env.example
```

Configure the required values.

Never commit `.env` files or API credentials.

---

## Start the Application

```bash
docker compose up --build
```

The backend exposes the API and interactive API documentation.

The frontend provides the reconciliation dashboard.

---

# 26. API

The API is organized around reconciliation runs.

Typical workflow:

```text
Create / Upload Dataset
        ↓
Start Reconciliation
        ↓
Receive Run ID
        ↓
Monitor Run
        ↓
Retrieve Metrics
        ↓
Inspect Transactions
        ↓
Inspect Exceptions
        ↓
Generate / View Report
```

The API documentation is available through the backend's OpenAPI interface when the application is running.

---

# 27. Example Reconciliation Run

Input:

```text
Gateway: 10,000 records
Bank:     9,850 records
Ledger:   9,920 records
```

The system:

```text
1. Validates input
2. Normalizes fields
3. Generates candidate matches
4. Performs deterministic matching
5. Calculates confidence
6. Resolves high-confidence records
7. Detects exceptions
8. Uses AI for ambiguous-case explanations
9. Generates metrics
10. Produces the reconciliation report
```

Output:

```text
Total records:             TBD
Automatically matched:     TBD
Exceptions:                TBD
Match rate:                TBD
Precision:                 TBD
Recall:                    TBD
```

---

# 28. What We Deliberately Did NOT Build

Good engineering is also about knowing what not to build.

We deliberately avoided:

### LLM-based financial arithmetic

There is no reason for an LLM to determine whether two numeric amounts are equal.

### Fully autonomous financial correction

The system does not modify transaction amounts simply because an AI model believes they are incorrect.

### Forced matching

The system does not attempt to make every transaction match.

### Fake production claims

Synthetic data is clearly identified as synthetic.

### Single-number evaluation

A high match rate alone does not demonstrate correctness.

Instead, we measure multiple dimensions of performance.

---

# 29. Why This Matters

Settlement reconciliation is a verification problem.

The challenge is not:

> "Can AI generate an answer?"

The challenge is:

> **"Can a financial operations team trust the answer?"**

That changes the architecture.

The system therefore prioritizes:

```text
Correctness
    ↓
Explainability
    ↓
Controlled automation
    ↓
Human escalation
    ↓
Auditability
```

rather than:

```text
Maximum AI usage
```

---

# 30. What We Learned

### AI is not automatically the best solution.

Some parts of reconciliation are better handled by deterministic algorithms.

### Uncertainty is a valid result.

A system that says "I don't have enough evidence" can be safer than one that always returns an answer.

### Evaluation must have ground truth.

Without known expected outcomes, a match-rate number is difficult to interpret.

### Exceptions are valuable.

Unresolved transactions are not necessarily failures of the system. They are signals for human investigation.

### Reliability matters more than demo complexity.

A smaller system that behaves predictably is more useful than a larger system that cannot explain its decisions.

---

# 31. Future Improvements

The prototype can be extended with:

* Live payment gateway connectors
* Bank API integrations
* Accounting-platform integrations
* Streaming reconciliation
* Incremental reconciliation
* Human-review workflow
* Feedback-driven threshold optimization
* Model evaluation framework
* Role-based access control
* Advanced audit trails
* Settlement forecasting
* Anomaly detection
* Multi-currency reconciliation
* Large-scale distributed processing

The architecture is designed so these additions do not require replacing the core reconciliation model.

---

# 32. Project Philosophy

Settlement Copilot is built around one principle:

> **Automate certainty. Explain ambiguity. Escalate uncertainty.**

The objective is not to make AI responsible for every financial decision.

The objective is to combine:

```text
Deterministic Engineering
          +
AI-Assisted Reasoning
          +
Human Oversight
          =
Trustworthy Financial Automation
```

---

# 33. Buildathon Alignment

Settlement Copilot is built for the **AI Finance Controller** problem.

The project addresses the core requirement of closing a finance-operations loop over a batch of synthetic records while reporting measured reconciliation results and unresolved exceptions.

The system demonstrates:

### Problem Taste

A real finance-operations problem involving fragmented transaction data and manual reconciliation.

### Build Quality

A structured backend, persistent reconciliation runs, matching services, exception handling, reporting and a working frontend.

### AI Judgment

AI is intentionally restricted to tasks where contextual reasoning and natural-language explanation add value.

### Failure Recovery

Invalid, missing, duplicate, conflicting and low-confidence transactions become explicit exception states rather than silently producing incorrect matches.

### Evidence

The system evaluates itself against synthetic data with known ground truth and reports multiple metrics rather than relying on a cherry-picked example.

---

# 34. Final Takeaway

Settlement Copilot is not designed to claim:

> **"AI can reconcile every transaction."**

It is designed to demonstrate something more useful:

> **"A financial reconciliation system can automate the transactions it has sufficient evidence to resolve, explain why it made those decisions, measure its own performance, and safely escalate the cases it cannot resolve."**

That is the system we believe finance teams can trust.

---

## Demo

**5-minute demonstration:**
`[ADD VIDEO LINK]`

## Architecture

`[ADD ARCHITECTURE DIAGRAM / LINK]`

## Repository

`[THIS REPOSITORY]`

---

## Team

**Settlement Copilot**

Built for the Razorpay AI Buildathon 2026.

---

## Disclaimer

This project is a hackathon prototype and uses synthetic transaction data for evaluation. It is not connected to or representative of Razorpay's internal production systems or customer data.

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
