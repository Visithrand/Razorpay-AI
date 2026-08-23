"""
RAG context builder (optional ChromaDB integration).

For small schemas (3–4 tables), we hardcode schema into the NL2SQL prompt.
This module is a no-op stub that can be extended to add ChromaDB retrieval
if the schema grows too large for the context window.
"""

from __future__ import annotations


def get_schema_context(question: str | None = None) -> str:
    """Return the schema string. Future: retrieve relevant table docs from ChromaDB."""
    # Currently returns empty string — nl2sql.py embeds schema directly in SCHEMA_CONTEXT.
    # If you add ChromaDB, retrieve the k most relevant table/column descriptions here.
    return ""
