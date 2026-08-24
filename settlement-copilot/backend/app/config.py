"""
Settlement Copilot central configuration module.
Loads environment variables from .env and exposes config variables.
"""

from __future__ import annotations
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables once
load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./settlement_copilot.db")

# Groq API
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "groq/compound")

# Logging & CORS
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

# Directory locations
REPORTS_DIR_STR = os.getenv("REPORTS_DIR", "reports")
REPORTS_DIR = Path(REPORTS_DIR_STR)
