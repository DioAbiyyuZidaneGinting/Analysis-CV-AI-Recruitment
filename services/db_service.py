import json
import os

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db.json")

def load_db():
    if not os.path.exists(DB_FILE):
        return {"users": {}, "candidates": []}
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading database: {e}")
        return {"users": {}, "candidates": []}

def save_db(data):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving database: {e}")
        return False
