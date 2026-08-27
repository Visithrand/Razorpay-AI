"""
Settlement Copilot — FastAPI application entrypoint.
"""

from __future__ import annotations

import logging
import logging.config

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import LOG_LEVEL, CORS_ORIGINS
from app.database import init_db
from app.api.routes import router
from app.api.scenario_routes import router as scenario_router
from app.api.auth import router as auth_router

# ─── Structured Logging ───────────────────────────────────────────────────────

logging.config.dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "format": '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
                "datefmt": "%Y-%m-%dT%H:%M:%S",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json",
                "stream": "ext://sys.stdout",
            }
        },
        "root": {"level": LOG_LEVEL, "handlers": ["console"]},
    }
)

logger = logging.getLogger(__name__)

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Settlement Copilot",
    description="AI-powered payment reconciliation agent — auto-matches transactions across gateway, bank, and ledger with confidence scores and explainable reasoning.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the Vite dev server and the production frontend

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app.include_router(auth_router)
app.include_router(router)
app.include_router(scenario_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    error_type = type(exc).__name__
    explanation = str(exc)
    recovery_action = "Please contact system administrator."
    requires_human_review = True
    
    # Map specific exceptions to structured responses based on Phase 1 requirements
    if "duplicate" in explanation.lower() or error_type == "IdempotencyException":
        error_type = "DuplicateEventError"
        recovery_action = "Event ignored. No action required."
        requires_human_review = False
    elif "malformed" in explanation.lower() or "columns" in explanation.lower() or "csv" in explanation.lower():
        error_type = "DataParsingError"
        recovery_action = "Please check file format and re-upload."
    elif "missing" in explanation.lower():
        error_type = "MissingDataError"
        recovery_action = "Ensure all required fields (UTR, amount) and transactions are present."
    elif "timeout" in explanation.lower() or "llm" in explanation.lower() or "agent" in explanation.lower():
        error_type = "AI_Service_Failure"
        recovery_action = "System fell back to deterministic rules."
        requires_human_review = True
    elif "database" in explanation.lower() or "operationalerror" in error_type.lower():
        error_type = "DatabaseFailure"
        recovery_action = "Retry operation later."
    elif "disagreement" in explanation.lower():
        error_type = "AgentDisagreement"
        recovery_action = "Manual human review required."

    return JSONResponse(
        status_code=500,
        content={
            "error_type": error_type,
            "human_readable_explanation": explanation,
            "affected_transaction": getattr(exc, "transaction_id", None) or getattr(exc, "exception_id", None),
            "recovery_action": recovery_action,
            "requires_human_review": requires_human_review
        }
    )


@app.on_event("startup")
async def startup():
    logger.info("Settlement Copilot starting up — initialising database tables")
    init_db()
    logger.info("Database ready")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Settlement Copilot shutting down")
