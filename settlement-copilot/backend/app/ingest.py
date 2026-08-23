"""
CSV → normalized RawTransaction ingestion.

Handles the three source formats:
  gateway : txn_id, utr, amount, fee, net_amount, date, description, status, payment_method
  bank    : bank_ref, utr, credit_amount, date, description, balance
  ledger  : ledger_id, reference, amount, date, description, account, type, txn_id
"""

import logging
from datetime import datetime
from io import StringIO

import pandas as pd
from sqlalchemy.orm import Session

from app.models import RawTransaction

logger = logging.getLogger(__name__)

# ─── column aliases ──────────────────────────────────────────────────────────
GATEWAY_ALIASES = {
    "txn_id": ["txn_id", "transaction_id", "payment_id", "id"],
    "utr": ["utr", "bank_utr", "rrn", "reference_number"],
    "amount": ["amount", "gross_amount", "order_amount"],
    "fee": ["fee", "gateway_fee", "charges"],
    "net_amount": ["net_amount", "net", "settlement_amount"],
    "date": ["date", "payment_date", "created_at", "timestamp"],
    "description": ["description", "desc", "narration", "remarks"],
    "status": ["status", "payment_status"],
    "payment_method": ["payment_method", "method", "mode"],
}

BANK_ALIASES = {
    "txn_id": ["bank_ref", "ref_no", "transaction_ref", "id"],
    "utr": ["utr", "rrn", "bank_utr"],
    "amount": ["credit_amount", "amount", "deposit_amount", "credit"],
    "date": ["date", "value_date", "transaction_date"],
    "description": ["description", "narration", "particulars", "remarks"],
    "reference": ["bank_ref", "ref_no"],
}

LEDGER_ALIASES = {
    "txn_id": ["ledger_id", "entry_id", "id"],
    "utr": ["utr", "reference", "txn_id"],
    "amount": ["amount", "credit_amount", "debit_amount"],
    "date": ["date", "entry_date", "transaction_date"],
    "description": ["description", "narration", "remarks"],
    "reference": ["reference", "order_id", "txn_id"],
}


def _resolve_col(df: pd.DataFrame, aliases: list[str]) -> str | None:
    """Return the first alias that exists as a column in the dataframe."""
    for a in aliases:
        if a in df.columns:
            return a
    return None


def _parse_date(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, infer_datetime_format=True, errors="coerce")


def _normalize_gateway(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    out = pd.DataFrame()

    out["txn_id"] = df.get("txn_id", df.get("transaction_id", df.get("payment_id", "")))
    out["utr"] = df.get("utr", df.get("bank_utr", df.get("rrn", ""))).fillna("").astype(str).str.strip()
    out["amount"] = pd.to_numeric(df.get("amount", df.get("gross_amount", 0)), errors="coerce").fillna(0)
    out["fee"] = pd.to_numeric(df.get("fee", df.get("gateway_fee", 0)), errors="coerce").fillna(0)
    out["net_amount"] = pd.to_numeric(df.get("net_amount", df.get("settlement_amount", out["amount"] - out["fee"])), errors="coerce").fillna(out["amount"] - out["fee"])
    out["date"] = _parse_date(df.get("date", df.get("payment_date", df.get("created_at"))))
    out["description"] = df.get("description", df.get("narration", "")).fillna("").astype(str)
    out["status"] = df.get("status", df.get("payment_status", "captured")).fillna("captured")
    out["payment_method"] = df.get("payment_method", df.get("method", "other")).fillna("other")
    out["reference"] = out["txn_id"].astype(str)
    return out


def _normalize_bank(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    out = pd.DataFrame()

    out["txn_id"] = df.get("bank_ref", df.get("ref_no", df.get("id", "")))
    out["utr"] = df.get("utr", df.get("rrn", df.get("bank_utr", ""))).fillna("").astype(str).str.strip()
    out["amount"] = pd.to_numeric(df.get("credit_amount", df.get("amount", df.get("deposit_amount", 0))), errors="coerce").fillna(0)
    out["fee"] = 0.0
    out["net_amount"] = out["amount"]
    out["date"] = _parse_date(df.get("date", df.get("value_date", df.get("transaction_date"))))
    out["description"] = df.get("description", df.get("narration", df.get("particulars", ""))).fillna("").astype(str)
    out["status"] = "settled"
    out["payment_method"] = "bank"
    out["reference"] = out["txn_id"].astype(str)
    return out


def _normalize_ledger(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    out = pd.DataFrame()

    out["txn_id"] = df.get("ledger_id", df.get("entry_id", df.get("id", "")))
    ref_col = df.get("reference", df.get("order_id", df.get("txn_id", "")))
    out["utr"] = ref_col.fillna("").astype(str).str.strip()
    out["amount"] = pd.to_numeric(df.get("amount", df.get("credit_amount", 0)), errors="coerce").fillna(0)
    out["fee"] = 0.0
    out["net_amount"] = out["amount"]
    out["date"] = _parse_date(df.get("date", df.get("entry_date")))
    out["description"] = df.get("description", df.get("narration", df.get("remarks", ""))).fillna("").astype(str)
    out["status"] = df.get("type", "credit").fillna("credit")
    out["payment_method"] = "ledger"
    out["reference"] = ref_col.fillna("").astype(str)
    return out


def ingest_csv(
    content: str | bytes,
    source: str,
    run_id: str,
    db: Session,
) -> list[RawTransaction]:
    """
    Parse a CSV from `content`, normalize it for `source`, and persist to DB.

    Returns the list of created RawTransaction objects.
    """
    if isinstance(content, bytes):
        content = content.decode("utf-8", errors="replace")

    try:
        df = pd.read_csv(StringIO(content))
    except Exception as exc:
        logger.error("Failed to parse CSV for source=%s: %s", source, exc)
        raise ValueError(f"Could not parse CSV: {exc}") from exc

    if source == "gateway":
        norm = _normalize_gateway(df)
    elif source == "bank":
        norm = _normalize_bank(df)
    elif source == "ledger":
        norm = _normalize_ledger(df)
    else:
        raise ValueError(f"Unknown source: {source!r}")

    records: list[RawTransaction] = []
    for _, row in norm.iterrows():
        date_val = row["date"]
        if pd.isna(date_val):
            date_val = datetime.utcnow()
        else:
            date_val = date_val.to_pydatetime() if hasattr(date_val, "to_pydatetime") else date_val

        raw_dict = {}
        for k, v in row.to_dict().items():
            if pd.isna(v):
                raw_dict[k] = None
            elif hasattr(v, "isoformat"):
                raw_dict[k] = v.isoformat()
            else:
                raw_dict[k] = v

        txn = RawTransaction(
            run_id=run_id,
            source=source,
            txn_id=str(row["txn_id"]),
            utr=str(row["utr"]),
            amount=float(row["amount"]),
            fee=float(row["fee"]),
            net_amount=float(row["net_amount"]),
            date=date_val,
            description=str(row["description"]),
            reference=str(row["reference"]),
            status=str(row["status"]),
            payment_method=str(row["payment_method"]),
            raw_data=raw_dict,
        )
        db.add(txn)
        records.append(txn)

    db.commit()
    logger.info("Ingested %d records from source=%s run_id=%s", len(records), source, run_id)
    return records
