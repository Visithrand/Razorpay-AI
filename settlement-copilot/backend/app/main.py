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

app.include_router(router)


@app.on_event("startup")
async def startup():
    logger.info("Settlement Copilot starting up — initialising database tables")
    init_db()
    logger.info("Database ready")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Settlement Copilot shutting down")
