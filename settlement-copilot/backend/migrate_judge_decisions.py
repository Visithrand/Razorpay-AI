import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "settlement_copilot.db")

def migrate():
    print(f"Connecting to {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if agent_disagreement exists
        cursor.execute("PRAGMA table_info(judge_decisions)")
        columns = [row[1] for row in cursor.fetchall()]

        if "agent_disagreement" not in columns:
            print("Adding agent_disagreement to judge_decisions table...")
            cursor.execute("ALTER TABLE judge_decisions ADD COLUMN agent_disagreement INTEGER DEFAULT 0")
            print("Successfully added agent_disagreement column.")
        else:
            print("Column agent_disagreement already exists in judge_decisions.")
            
        conn.commit()
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
