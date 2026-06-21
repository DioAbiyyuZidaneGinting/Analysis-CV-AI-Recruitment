import os
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

try:
    res = supabase.table("users").select("*").execute()
    print("--- USERS ---")
    for user in res.data or []:
        print(f"ID: {user['id']} | Email: {user['email']} | Role: {user['role']} | Name: {user['first_name']} {user['last_name']}")
except Exception as e:
    print("Error querying users:", e)

try:
    res = supabase.table("applications").select("*").execute()
    print("\n--- APPLICATIONS ---")
    for app in res.data or []:
        print(f"ID: {app['id']} | Job ID: {app['job_id']} | Candidate ID: {app['candidate_id']} | Status: {app['status']}")
except Exception as e:
    print("Error querying applications:", e)
