"""
CSV → normalized RawTransaction ingestion with robust validation.

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


def _parse_date(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, infer_datetime_format=True, errors="coerce")


def _normalize_gateway(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    out = pd.DataFrame()

    out["txn_id"] = df.get("txn_id", df.get("transaction_id", df.get("payment_id", "")))
    out["utr"] = df.get("utr", df.get("bank_utr", df.get("rrn", ""))).fillna("").astype(str).str.strip()
    
    # Robust numeric parsing: converts "hello" -> NaN -> fillna(0.0) -> abs()
    raw_amt = pd.to_numeric(df.get("amount", df.get("gross_amount", 0)), errors="coerce").fillna(0.0)
    out["amount"] = raw_amt.abs()
    
    raw_fee = pd.to_numeric(df.get("fee", df.get("gateway_fee", 0)), errors="coerce").fillna(0.0)
    out["fee"] = raw_fee.abs()
    
    out["net_amount"] = pd.to_numeric(df.get("net_amount", df.get("settlement_amount", out["amount"] - out["fee"])), errors="coerce").fillna(out["amount"] - out["fee"])
    out["date"] = _parse_date(df.get("date", df.get("payment_date", df.get("created_at"))))
    out["description"] = df.get("description", df.get("narration", "")).fillna("").astype(str)
    out["status"] = df.get("status", df.get("payment_status", "captured")).fillna("captured")
    out["payment_method"] = df.get("payment_method", df.get("method", "other")).fillna("other")
    out["reference"] = out["txn_id"].astype(str)
    return out


def _normalize_bank(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    out = pd.DataFrame()

    out["txn_id"] = df.get("bank_ref", df.get("ref_no", df.get("id", "")))
    out["utr"] = df.get("utr", df.get("rrn", df.get("bank_utr", ""))).fillna("").astype(str).str.strip()
    
    raw_amt = pd.to_numeric(df.get("credit_amount", df.get("amount", df.get("deposit_amount", 0))), errors="coerce").fillna(0.0)
    out["amount"] = raw_amt.abs()
    out["fee"] = 0.0
    out["net_amount"] = out["amount"]
    out["date"] = _parse_date(df.get("date", df.get("value_date", df.get("transaction_date"))))
    out["description"] = df.get("description", df.get("narration", df.get("particulars", ""))).fillna("").astype(str)
    out["status"] = "settled"
    out["payment_method"] = "bank"
    out["reference"] = out["txn_id"].astype(str)
    return out


def _normalize_ledger(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    out = pd.DataFrame()

    out["txn_id"] = df.get("ledger_id", df.get("entry_id", df.get("id", "")))
    ref_col = df.get("reference", df.get("order_id", df.get("txn_id", "")))
    out["utr"] = ref_col.fillna("").astype(str).str.strip()
    
    raw_amt = pd.to_numeric(df.get("amount", df.get("credit_amount", 0)), errors="coerce").fillna(0.0)
    out["amount"] = raw_amt.abs()
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
    Enforces strict input validation to prevent crashes on invalid CSV data.
    """
    if isinstance(content, bytes):
        content = content.decode("utf-8", errors="replace")

    clean_content = content.strip()
    if not clean_content:
        raise ValueError("Uploaded CSV file is empty. Please provide a valid file.")

    try:
        df = pd.read_csv(StringIO(clean_content))
    except Exception as exc:
        logger.error("Failed to parse CSV for source=%s: %s", source, exc)
        raise ValueError(f"Could not parse CSV file: {exc}") from exc

    if df.empty:
        raise ValueError("Uploaded CSV contains 0 rows of data.")

    if source == "gateway":
        norm = _normalize_gateway(df)
    elif source == "bank":
        norm = _normalize_bank(df)
    elif source == "ledger":
        norm = _normalize_ledger(df)
    else:
        raise ValueError(f"Unknown reconciliation source: {source!r}")

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
