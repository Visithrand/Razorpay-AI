"""
generate_synthetic.py — Seeded, reproducible synthetic payment data generator.

Usage:
    cd data && python generate_synthetic.py

Generates:
    samples/gateway.csv   — 300 payment gateway transactions
    samples/bank.csv      — ~280 bank statement entries (some batched)
    samples/ledger.csv    — ~290 ledger entries

Deliberately injects each failure type as labeled rows so they double
as test fixtures (see samples/*_labeled.csv which retain the fixture_type column).

random.seed(42) ensures the same data every run → reproducible match rate in pitch.
"""

import csv
import json
import os
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

BASE_DATE = datetime(2024, 1, 1)
SAMPLES_DIR = Path(__file__).parent / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

MERCHANTS = [
    "ACME Corp", "TechSolutions Ltd", "QuickShop", "Fusion Foods",
    "Smart Retail", "CloudBiz", "PrimeServices", "SwiftPay Inc",
    "DigiMart", "NextGen Solutions", "Sunrise Traders", "Apex Commerce",
    "BlueOcean Pvt Ltd", "FastTrack Logistics", "GreenLeaf Organics",
]
PAYMENT_METHODS = ["upi", "card", "netbanking", "wallet"]
BANK_CODES = ["SBIN", "HDFC", "ICICI", "AXIS", "KOTAK"]


def rand_utr(prefix: str = "RAZORPAY") -> str:
    return prefix + "".join(str(random.randint(0, 9)) for _ in range(16))


def rand_amount() -> float:
    tier = random.random()
    if tier < 0.35:
        return round(random.uniform(150, 2500), 2)
    elif tier < 0.75:
        return round(random.uniform(2500, 30000), 2)
    else:
        return round(random.uniform(30000, 500000), 2)


def compute_fee(amount: float) -> float:
    base = amount * 0.02
    gst = base * 0.18
    return round(base + gst, 2)


def rand_date(spread_days: int = 30) -> datetime:
    return BASE_DATE + timedelta(days=random.randint(0, spread_days - 1))


def txn_id() -> str:
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    return "pay_" + "".join(random.choices(chars, k=14))


def order_id() -> str:
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return "order_" + "".join(random.choices(chars, k=12))


def bank_ref(bank: str, date: datetime, suffix: str) -> str:
    return f"{bank}{date.strftime('%Y%m%d')}{suffix}"


# ─── Storage ─────────────────────────────────────────────────────────────────

gateway_rows: list[dict] = []
bank_rows: list[dict] = []
ledger_rows: list[dict] = []


def add_gateway(txn: dict):
    gateway_rows.append(txn)


def add_bank(txn: dict):
    bank_rows.append(txn)


def add_ledger(txn: dict):
    ledger_rows.append(txn)


# ─── Phase 1: 250 clean, fully matched transactions ──────────────────────────

print("Generating 250 clean transactions...")
for i in range(250):
    amt = rand_amount()
    fee = compute_fee(amt)
    net = round(amt - fee, 2)
    utr = rand_utr()
    tid = txn_id()
    oid = order_id()
    merchant = random.choice(MERCHANTS)
    date = rand_date()
    bank_date = date + timedelta(days=random.randint(0, 1))
    bank = random.choice(BANK_CODES)

    add_gateway({
        "txn_id": tid, "utr": utr, "amount": amt, "fee": fee, "net_amount": net,
        "date": date.strftime("%Y-%m-%d"), "description": f"Payment for {merchant} - {oid}",
        "status": "captured", "payment_method": random.choice(PAYMENT_METHODS),
        "fixture_type": "clean",
    })
    add_bank({
        "bank_ref": bank_ref(bank, bank_date, f"C{i:04d}"), "utr": utr,
        "credit_amount": net, "date": bank_date.strftime("%Y-%m-%d"),
        "description": f"RAZORPAY SETTLEMENT {utr}", "balance": round(random.uniform(1e5, 1e7), 2),
        "fixture_type": "clean",
    })
    add_ledger({
        "ledger_id": f"LED{date.strftime('%Y%m%d')}C{i:04d}", "reference": oid,
        "amount": amt, "date": date.strftime("%Y-%m-%d"),
        "description": f"Customer payment - {merchant}", "account": random.choice(["4001", "4002", "4003"]),
        "type": "credit", "txn_id": tid, "fixture_type": "clean",
    })

# ─── Phase 2: 12 fee-adjusted (UTR exact, amount off by 1-3%) ────────────────

print("Generating 12 fee-adjusted transactions...")
for i in range(12):
    amt = rand_amount()
    fee = compute_fee(amt)
    net = round(amt - fee, 2)
    adjusted_net = round(net * random.uniform(0.97, 1.015), 2)  # bank receives slightly different
    utr = rand_utr()
    tid = txn_id()
    oid = order_id()
    merchant = random.choice(MERCHANTS)
    date = rand_date()
    bank_date = date + timedelta(days=1)
    bank = random.choice(BANK_CODES)

    add_gateway({
        "txn_id": tid, "utr": utr, "amount": amt, "fee": fee, "net_amount": net,
        "date": date.strftime("%Y-%m-%d"), "description": f"Payment for {merchant} - {oid}",
        "status": "captured", "payment_method": "upi",
        "fixture_type": "fee_adjusted",
    })
    add_bank({
        "bank_ref": bank_ref(bank, bank_date, f"FA{i:03d}"), "utr": utr,
        "credit_amount": adjusted_net, "date": bank_date.strftime("%Y-%m-%d"),
        "description": f"RAZORPAY SETTLEMENT {utr}", "balance": round(random.uniform(1e5, 1e7), 2),
        "fixture_type": "fee_adjusted",
    })
    add_ledger({
        "ledger_id": f"LED{date.strftime('%Y%m%d')}FA{i:03d}", "reference": oid,
        "amount": amt, "date": date.strftime("%Y-%m-%d"),
        "description": f"Customer payment - {merchant}", "account": "4001",
        "type": "credit", "txn_id": tid, "fixture_type": "fee_adjusted",
    })

# ─── Phase 3: 10 timing-drift (UTR exact, amount exact, 2-4 day drift) ───────

print("Generating 10 timing-drift transactions...")
for i in range(10):
    amt = rand_amount()
    fee = compute_fee(amt)
    net = round(amt - fee, 2)
    utr = rand_utr()
    tid = txn_id()
    oid = order_id()
    merchant = random.choice(MERCHANTS)
    date = rand_date(25)
    drift = random.randint(2, 4)
    bank_date = date + timedelta(days=drift)
    bank = random.choice(BANK_CODES)

    add_gateway({
        "txn_id": tid, "utr": utr, "amount": amt, "fee": fee, "net_amount": net,
        "date": date.strftime("%Y-%m-%d"), "description": f"Payment for {merchant} - {oid}",
        "status": "captured", "payment_method": random.choice(["card", "netbanking"]),
        "fixture_type": "timing_drift",
    })
    add_bank({
        "bank_ref": bank_ref(bank, bank_date, f"TD{i:03d}"), "utr": utr,
        "credit_amount": net, "date": bank_date.strftime("%Y-%m-%d"),
        "description": f"RAZORPAY SETTLEMENT {utr}", "balance": round(random.uniform(1e5, 1e7), 2),
        "fixture_type": "timing_drift",
    })
    add_ledger({
        "ledger_id": f"LED{date.strftime('%Y%m%d')}TD{i:03d}", "reference": oid,
        "amount": amt, "date": date.strftime("%Y-%m-%d"),
        "description": f"Customer payment - {merchant}", "account": "4001",
        "type": "credit", "txn_id": tid, "fixture_type": "timing_drift",
    })

# ─── Phase 4: 4 batches of 3 gateway → 1 bank entry ─────────────────────────

print("Generating 4 batch settlements (3 gw each -> 1 bank)...")
for b in range(4):
    batch_utr = rand_utr("BATCH")
    date = rand_date(25)
    bank_date = date + timedelta(days=1)
    bank = random.choice(BANK_CODES)
    batch_nets: list[float] = []

    for j in range(3):
        amt = rand_amount()
        fee = compute_fee(amt)
        net = round(amt - fee, 2)
        tid = txn_id()
        oid = order_id()
        merchant = random.choice(MERCHANTS)
        batch_nets.append(net)

        add_gateway({
            "txn_id": tid, "utr": f"BATCH_{batch_utr}_{j}",
            "amount": amt, "fee": fee, "net_amount": net,
            "date": date.strftime("%Y-%m-%d"), "description": f"Payment for {merchant} - {oid}",
            "status": "captured", "payment_method": "upi",
            "fixture_type": "batch",
        })
        add_ledger({
            "ledger_id": f"LED{date.strftime('%Y%m%d')}BA{b:02d}{j}", "reference": oid,
            "amount": amt, "date": date.strftime("%Y-%m-%d"),
            "description": f"Customer payment - {merchant}", "account": "4001",
            "type": "credit", "txn_id": tid, "fixture_type": "batch",
        })

    total_net = round(sum(batch_nets), 2)
    add_bank({
        "bank_ref": bank_ref(bank, bank_date, f"BA{b:03d}"), "utr": batch_utr,
        "credit_amount": total_net, "date": bank_date.strftime("%Y-%m-%d"),
        "description": f"RAZORPAY BATCH SETTLEMENT {batch_utr}", "balance": round(random.uniform(1e5, 1e7), 2),
        "fixture_type": "batch",
    })

# ─── Phase 5: 6 missing in bank (gateway only) ───────────────────────────────

print("Generating 6 'missing in bank' exceptions...")
for i in range(6):
    amt = rand_amount()
    fee = compute_fee(amt)
    net = round(amt - fee, 2)
    utr = rand_utr()
    tid = txn_id()
    oid = order_id()
    merchant = random.choice(MERCHANTS)
    date = rand_date()

    add_gateway({
        "txn_id": tid, "utr": utr, "amount": amt, "fee": fee, "net_amount": net,
        "date": date.strftime("%Y-%m-%d"), "description": f"Payment for {merchant} - {oid}",
        "status": "captured", "payment_method": "upi",
        "fixture_type": "missing_in_bank",
    })
    # No bank entry — this is the "missing" case

# ─── Phase 6: 4 duplicates in bank ───────────────────────────────────────────

print("Generating 4 duplicate bank entries...")
for i in range(4):
    amt = rand_amount()
    fee = compute_fee(amt)
    net = round(amt - fee, 2)
    utr = rand_utr()
    tid = txn_id()
    oid = order_id()
    merchant = random.choice(MERCHANTS)
    date = rand_date()
    bank = random.choice(BANK_CODES)
    bank_date = date + timedelta(days=1)

    add_gateway({
        "txn_id": tid, "utr": utr, "amount": amt, "fee": fee, "net_amount": net,
        "date": date.strftime("%Y-%m-%d"), "description": f"Payment for {merchant} - {oid}",
        "status": "captured", "payment_method": "card",
        "fixture_type": "duplicate",
    })
    for dup_suffix in ["", "B"]:
        add_bank({
            "bank_ref": bank_ref(bank, bank_date, f"DU{i:03d}{dup_suffix}"), "utr": utr,
            "credit_amount": net, "date": bank_date.strftime("%Y-%m-%d"),
            "description": f"RAZORPAY SETTLEMENT {utr}", "balance": round(random.uniform(1e5, 1e7), 2),
            "fixture_type": "duplicate" if not dup_suffix else "duplicate_entry",
        })

# ─── Write CSVs ───────────────────────────────────────────────────────────────

def write_csv(path: Path, rows: list[dict], exclude_col: str = "fixture_type"):
    if not rows:
        return
    fieldnames = [k for k in rows[0].keys() if k != exclude_col]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: v for k, v in row.items() if k != exclude_col})


def write_labeled_csv(path: Path, rows: list[dict]):
    if not rows:
        return
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


write_csv(SAMPLES_DIR / "gateway.csv", gateway_rows)
write_csv(SAMPLES_DIR / "bank.csv", bank_rows)
write_csv(SAMPLES_DIR / "ledger.csv", ledger_rows)
write_labeled_csv(SAMPLES_DIR / "gateway_labeled.csv", gateway_rows)
write_labeled_csv(SAMPLES_DIR / "bank_labeled.csv", bank_rows)
write_labeled_csv(SAMPLES_DIR / "ledger_labeled.csv", ledger_rows)

# ─── Summary ─────────────────────────────────────────────────────────────────

summary = {
    "generated_at": datetime.utcnow().isoformat(),
    "seed": 42,
    "gateway_rows": len(gateway_rows),
    "bank_rows": len(bank_rows),
    "ledger_rows": len(ledger_rows),
    "gateway_by_type": {},
    "bank_by_type": {},
}
for row in gateway_rows:
    ft = row["fixture_type"]
    summary["gateway_by_type"][ft] = summary["gateway_by_type"].get(ft, 0) + 1
for row in bank_rows:
    ft = row["fixture_type"]
    summary["bank_by_type"][ft] = summary["bank_by_type"].get(ft, 0) + 1

(SAMPLES_DIR / "generation_summary.json").write_text(json.dumps(summary, indent=2))

print("\n✅ Data generation complete!")
print(f"   Gateway rows : {len(gateway_rows)}")
print(f"   Bank rows    : {len(bank_rows)}")
print(f"   Ledger rows  : {len(ledger_rows)}")
print(f"\n   Breakdown by type:")
for k, v in summary["gateway_by_type"].items():
    print(f"     {k}: {v}")
print(f"\n   Files written to: {SAMPLES_DIR.resolve()}")
