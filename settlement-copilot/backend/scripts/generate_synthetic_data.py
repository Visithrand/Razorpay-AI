import csv
import random
import os
from datetime import datetime, timedelta

def generate_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    gw_path = os.path.join(data_dir, 'gateway_records.csv')
    bank_path = os.path.join(data_dir, 'bank_statement.csv')
    ledger_path = os.path.join(data_dir, 'erp_ledger.csv')

    num_records = 60
    base_date = datetime.now() - timedelta(days=2)
    
    gw_rows = []
    bank_rows = []
    ledger_rows = []

    print(f"Generating {num_records} synthetic transactions...")

    for i in range(1, num_records + 1):
        # Base realistic values
        amount = round(random.uniform(500.0, 50000.0), 2)
        fee = round(amount * 0.02, 2)
        net_amount = round(amount - fee, 2)
        
        utr = f"UTR8329{random.randint(10000, 99999)}{i:03d}"
        gw_txn_id = f"pay_{random.randint(100000, 999999)}"
        bank_ref = f"BKREF{random.randint(100000, 999999)}"
        ledger_id = f"LDG{random.randint(1000, 9999)}"
        
        date_str = (base_date + timedelta(minutes=random.randint(1, 1440))).isoformat()
        date_obj = datetime.fromisoformat(date_str)
        bank_date_str = (date_obj + timedelta(hours=random.randint(2, 48))).isoformat()
        
        # Decide scenario
        scenario = "EXACT_MATCH"
        rand_val = random.random()
        if rand_val < 0.6:
            scenario = "EXACT_MATCH"
        elif rand_val < 0.7:
            scenario = "MISSING_BANK"
        elif rand_val < 0.8:
            scenario = "MISSING_LEDGER"
        elif rand_val < 0.9:
            scenario = "AMOUNT_MISMATCH"
        elif rand_val < 0.95:
            scenario = "TIMING_DRIFT"
        else:
            scenario = "DUPLICATE"

        # 1. Gateway
        gw_rows.append({
            "txn_id": gw_txn_id,
            "utr": utr,
            "amount": amount,
            "fee": fee,
            "net_amount": net_amount,
            "date": date_str,
            "description": f"Customer Payment {i}",
            "status": "captured",
            "payment_method": random.choice(["card", "upi", "netbanking"])
        })
        
        # 2. Bank
        if scenario != "MISSING_BANK":
            b_amount = net_amount
            b_date = bank_date_str
            b_utr = utr
            
            if scenario == "AMOUNT_MISMATCH":
                b_amount = round(net_amount - 50.0, 2) # Simulate short settlement
            if scenario == "TIMING_DRIFT":
                b_date = (date_obj + timedelta(days=5)).isoformat() # T+5 drift
                
            bank_rows.append({
                "bank_ref": bank_ref,
                "utr": b_utr,
                "credit_amount": b_amount,
                "date": b_date,
                "description": f"Settlement for {gw_txn_id}",
                "balance": 1000000.0
            })
            
            # Duplicate scenario
            if scenario == "DUPLICATE":
                bank_rows.append({
                    "bank_ref": bank_ref + "_DUP",
                    "utr": b_utr,
                    "credit_amount": b_amount,
                    "date": (datetime.fromisoformat(b_date) + timedelta(minutes=1)).isoformat(),
                    "description": f"Settlement for {gw_txn_id} (Duplicate)",
                    "balance": 1000000.0 + b_amount
                })
        
        # 3. Ledger
        if scenario != "MISSING_LEDGER":
            l_amount = amount if random.random() > 0.5 else net_amount # Some ledgers book gross, some net
            
            if scenario == "AMOUNT_MISMATCH":
                l_amount = amount # Keep gross in ledger, but bank was short.
                
            ledger_rows.append({
                "ledger_id": ledger_id,
                "reference": utr,
                "amount": l_amount,
                "date": date_str,
                "description": f"Invoice {random.randint(1000, 9999)}",
                "account": "Sales",
                "type": "credit",
                "txn_id": gw_txn_id
            })
            
    # Write files
    with open(gw_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["txn_id", "utr", "amount", "fee", "net_amount", "date", "description", "status", "payment_method"])
        writer.writeheader()
        writer.writerows(gw_rows)
        
    with open(bank_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["bank_ref", "utr", "credit_amount", "date", "description", "balance"])
        writer.writeheader()
        writer.writerows(bank_rows)
        
    with open(ledger_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["ledger_id", "reference", "amount", "date", "description", "account", "type", "txn_id"])
        writer.writeheader()
        writer.writerows(ledger_rows)

    print(f"Success! Data written to {data_dir}")
    print("Files:")
    print(f"  - {gw_path}")
    print(f"  - {bank_path}")
    print(f"  - {ledger_path}")

if __name__ == "__main__":
    generate_data()
