"""
Supabase Service Layer for AI Recruitment Platform
Replaces db_service.py (db.json) with real Supabase PostgreSQL + Storage queries.

Setup:
    pip install supabase python-dotenv

Environment Variables (in .env):
    SUPABASE_URL=https://xxxx.supabase.co
    SUPABASE_SERVICE_KEY=your_service_role_key   (for backend operations)
    SUPABASE_ANON_KEY=your_anon_key              (for auth operations)
"""

import os
from functools import wraps
from flask import request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or not SUPABASE_ANON_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or SUPABASE_ANON_KEY in environment. "
        "Create a .env file with these values."
    )

# Service client (bypasses RLS — used for backend AI operations)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Anon client (used for auth sign-in/sign-up)
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def require_auth(allowed_roles=None):
    """
    Flask route decorator to enforce Supabase JWT validation.
    Usage:
        @app.route('/api/candidate/profile')
        @require_auth(allowed_roles=['candidate'])
        def get_profile(user):
            # user is the verified Supabase user object
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                print(f"[AUTH] REJECTED {request.method} {request.path} — missing/malformed Authorization header")
                return jsonify({"error": "Missing or invalid Authorization header"}), 401
                
            token = auth_header.split(" ")[1]
            token_preview = token[:20] + "..." if len(token) > 20 else token
            try:
                # Use anon client to validate the token with Supabase
                user_resp = supabase_anon.auth.get_user(token)
                if not user_resp or not user_resp.user:
                    print(f"[AUTH] REJECTED {request.method} {request.path} — Supabase rejected token (token: {token_preview})")
                    return jsonify({"error": "Invalid or expired session token"}), 401
                    
                user = user_resp.user
                print(f"[AUTH] OK {request.method} {request.path} — user.id={user.id} email={user.email}")
                
                # Fetch role from users table to ensure security.
                # Use maybe_single() — returns None if row doesn't exist.
                # Guard against Supabase SDK returning a list instead of dict
                # (can happen with certain SDK versions on maybe_single).
                profile_res = supabase.table("users").select("role").eq("id", user.id).maybe_single().execute()
                raw_data = profile_res.data if profile_res else None
                if isinstance(raw_data, list):
                    raw_data = raw_data[0] if raw_data else None
                db_role = raw_data.get("role") if isinstance(raw_data, dict) else None

                if not db_role:
                    print(f"[AUTH] REJECTED {request.method} {request.path} — user {user.id} ({user.email}) not found in users table")
                    return jsonify({"error": "User profile not found in database. Please ensure your email is confirmed and your account is fully set up."}), 403

                if allowed_roles:
                    if db_role not in allowed_roles:
                        print(f"[AUTH] REJECTED {request.method} {request.path} — role '{db_role}' not in {allowed_roles}")
                        return jsonify({"error": f"Unauthorized: Role '{db_role}' does not have access"}), 403

                # Inject role field into user object for convenience in endpoints
                user.role = db_role
                
                # Pass user info to function
                return f(user, *args, **kwargs)
            except Exception as e:
                print(f"[AUTH] EXCEPTION {request.method} {request.path} — {e}")
                return jsonify({"error": "Authentication failed", "details": str(e)}), 401
        return decorated_function
    return decorator



# ==============================================================
# AUTH
# ==============================================================

def register_user(email: str, password: str, role: str, first_name: str, last_name: str) -> dict:
    """Register a new user via Supabase Auth."""
    payload = {
        "email": email,
        "password": password,
        "options": {
            "data": {
                "role": role,
                "first_name": first_name,
                "last_name": last_name
            }
        }
    }
    print("REGISTER PAYLOAD:", payload)
    try:
        response = supabase_anon.auth.sign_up(payload)
        print("SUPABASE RESPONSE:", response)
        if response.user:
            session = getattr(response, "session", None)

            # Always ensure the user exists in public.users regardless of whether
            # the handle_new_user trigger fired — this is the critical fix so that
            # new accounts pass the require_auth role check immediately after register.
            try:
                existing = supabase.table("users").select("id").eq("id", response.user.id).maybe_single().execute()
                if not existing.data:
                    supabase.table("users").insert({
                        "id": response.user.id,
                        "email": email,
                        "role": role,
                        "first_name": first_name,
                        "last_name": last_name
                    }).execute()
                    print(f"[REGISTER] Manually inserted user {response.user.id} into public.users")
                else:
                    # Trigger fired — but make sure role/name are correct
                    supabase.table("users").update({
                        "role": role,
                        "first_name": first_name,
                        "last_name": last_name
                    }).eq("id", response.user.id).execute()
                    print(f"[REGISTER] User {response.user.id} already in public.users — updated role/name")
            except Exception as insert_err:
                print(f"[REGISTER] Warning: failed to ensure user in public.users: {insert_err}")

            return {
                "success": True,
                "access_token": session.access_token if session else None,
                "refresh_token": session.refresh_token if session else None,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "role": role,
                    "firstName": first_name,
                    "lastName": last_name
                }
            }
        return {"success": False, "error": "Registration failed — no user returned."}
    except Exception as e:
        print("SUPABASE ERROR:", str(e))
        return {"success": False, "error": str(e)}


def login_user(email: str, password: str) -> dict:
    """Authenticate user via Supabase Auth."""
    payload = {
        "email": email,
        "password": password
    }
    print("LOGIN PAYLOAD:", payload)
    try:
        response = supabase_anon.auth.sign_in_with_password(payload)
        print("LOGIN RESPONSE:", response)
        if response.user:
            # Fetch role from users table
            profile = supabase.table("users").select("*").eq("id", response.user.id).single().execute()
            user_data = profile.data or {}
            return {
                "success": True,
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "role": user_data.get("role", "candidate"),
                    "firstName": user_data.get("first_name", ""),
                    "lastName": user_data.get("last_name", "")
                }
            }
        return {"success": False, "error": "Invalid email or password"}
    except Exception as e:
        print("LOGIN ERROR:", str(e))
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
            return {"success": False, "error": "Invalid email or password"}
        return {"success": False, "error": error_msg}


# ==============================================================
# CANDIDATE PROFILE
# ==============================================================

def get_candidate_profile(user_id: str) -> dict | None:
    """Get combined user + candidate profile + latest CV analysis."""
    try:
        user_row = supabase.table("users")\
            .select("id, email, role, first_name, last_name, avatar_url")\
            .eq("id", user_id)\
            .single().execute()

        profile_row = supabase.table("candidate_profiles")\
            .select("*")\
            .eq("user_id", user_id)\
            .maybe_single().execute()

        analysis_row = supabase.table("cv_analysis")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("analyzed_at", desc=True)\
            .limit(1)\
            .maybe_single().execute()

        prediction_row = supabase.table("recruitment_predictions")\
            .select("hiring_chance, hiring_recommendation")\
            .eq("user_id", user_id)\
            .order("predicted_at", desc=True)\
            .limit(1)\
            .maybe_single().execute()

        u = user_row.data if user_row else {}
        p = profile_row.data if profile_row else {}
        a = analysis_row.data if analysis_row else {}
        r = prediction_row.data if prediction_row else {}

        full_name = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
        initials = "".join([part[0] for part in full_name.split() if part]).upper()[:2] or "?"

        return {
            "id": u.get("id"),
            "email": u.get("email"),
            "name": full_name,
            "avatar": initials,
            "avatarBg": "bg-primary",
            "role": a.get("predicted_category") or p.get("desired_role") or "Candidate",
            "location": p.get("location", ""),
            "headline": p.get("headline", ""),
            "bio": p.get("bio", ""),
            "linkedinUrl": p.get("linkedin_url", ""),
            "githubUrl": p.get("github_url", ""),
            "portfolioUrl": p.get("portfolio_url", ""),
            "desiredRole": p.get("desired_role", ""),
            "desiredSalary": p.get("desired_salary", ""),
            # CV Analysis results
            "cvScore": a.get("cv_score", 0),
            "atsScore": a.get("ats_score", 0),
            "skillsRelevanceScore": a.get("skills_relevance_score", 0),
            "experienceQualityScore": a.get("experience_quality_score", 0),
            "formatClarityScore": a.get("format_clarity_score", 0),
            "skills": a.get("detected_skills", []),
            "jobCategory": a.get("job_category", ""),
            "experienceLevel": a.get("experience_level", ""),
            "experienceYears": a.get("experience_years", 0),
            "strengths": a.get("strengths", []),
            "improvements": a.get("improvements", []),
            "aiNote": a.get("ai_note", ""),
            "cvAnalyzed": bool(a),
            # Hiring prediction
            "hiringChance": r.get("hiring_chance", 0),
            "hiringRecommendation": r.get("hiring_recommendation", "Not Recommended"),
            "matchScore": a.get("cv_score", 0),
            # CV file info
            "communicationScore": a.get("communication_score", 0),
            "culturalFitScore": a.get("cultural_fit_score", 0),
        }
    except Exception as e:
        print(f"Error fetching candidate profile: {e}")
        return None


def update_candidate_profile(user_id: str, profile_data: dict) -> bool:
    """Update candidate profile fields."""
    try:
        allowed_fields = [
            "headline", "location", "phone", "linkedin_url", "github_url",
            "portfolio_url", "bio", "desired_role", "desired_salary", "available_from"
        ]
        update_payload = {k: v for k, v in profile_data.items() if k in allowed_fields}
        if not update_payload:
            return True

        supabase.table("candidate_profiles")\
            .update(update_payload)\
            .eq("user_id", user_id)\
            .execute()
        return True
    except Exception as e:
        print(f"Error updating candidate profile: {e}")
        return False


# ==============================================================
# CV UPLOAD & STORAGE
# ==============================================================

def upload_cv_to_storage(user_id: str, file_bytes: bytes, filename: str, mime_type: str) -> dict:
    """
    Upload CV file to Supabase Storage bucket 'cv-files' (private bucket).
    SECURITY: Does NOT use get_public_url. Stores only the storage path.
    Use get_signed_cv_url() to generate a temporary access URL on demand.
    """
    try:
        storage_path = f"{user_id}/{filename}"
        
        # Upload to Supabase Storage (private bucket)
        # We try to upload first. If bucket is not found, we create it and retry.
        try:
            supabase.storage.from_("cv-files").upload(
                path=storage_path,
                file=file_bytes,
                # IMPORTANT: upsert must be the string "true", NOT a boolean True.
                # The python SDK maps file_options keys to HTTP headers, which must be strings.
                file_options={"content-type": mime_type, "upsert": "true"}
            )
        except Exception as upload_err:
            err_str = str(upload_err)
            if "Bucket not found" in err_str:
                try:
                    # Auto-create private 'cv-files' bucket
                    supabase.storage.create_bucket(
                        id="cv-files",
                        options={
                            "public": False,
                            "file_size_limit": 10485760,
                            "allowed_mime_types": [
                                "application/pdf", 
                                "application/msword", 
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            ]
                        }
                    )
                    # Retry upload after bucket creation
                    supabase.storage.from_("cv-files").upload(
                        path=storage_path,
                        file=file_bytes,
                        file_options={"content-type": mime_type, "upsert": "true"}
                    )
                except Exception as create_err:
                    raise RuntimeError(f"Bucket 'cv-files' was not found and auto-creation failed: {create_err}") from upload_err
            else:
                raise upload_err

        # SECURITY: We deliberately do NOT call get_public_url() here.
        # The bucket is private. Return only the path; use get_signed_cv_url() for access.
        return {
            "success": True,
            "file_path": storage_path,
            "file_url": f"private://{storage_path}",  # placeholder, not a real URL
            "file_name": filename,
            "mime_type": mime_type,
            "file_size": len(file_bytes)
        }
    except Exception as e:
        print(f"Error uploading to Supabase Storage: {e}")
        return {"success": False, "error": str(e)}


def get_signed_cv_url(file_path: str, expires_in: int = 3600) -> str | None:
    """
    Generate a short-lived signed URL for a private CV file.
    SECURITY FIX: Replaces get_public_url() — signed URLs expire after 'expires_in' seconds.
    Default = 1 hour (3600 seconds).
    """
    try:
        response = supabase.storage.from_("cv-files").create_signed_url(
            path=file_path,
            expires_in=expires_in
        )
        # supabase-py returns a dict with 'signedURL' key
        if isinstance(response, dict):
            return response.get("signedURL") or response.get("signed_url")
        return str(response)
    except Exception as e:
        print(f"Error generating signed URL for '{file_path}': {e}")
        return None


def save_cv_record(user_id: str, file_name: str, file_url: str, file_path: str,
                   file_size: int, mime_type: str) -> str | None:
    """Insert a CV record into the cvs table. Returns the new cv_id."""
    try:
        # Deactivate previous CVs
        supabase.table("cvs")\
            .update({"is_active": False})\
            .eq("user_id", user_id)\
            .execute()

        # Insert new CV record
        result = supabase.table("cvs").insert({
            "user_id": user_id,
            "file_name": file_name,
            "file_url": file_url,
            "file_path": file_path,
            "file_size": file_size,
            "mime_type": mime_type,
            "is_active": True
        }).execute()

        return result.data[0]["id"] if result.data else None
    except Exception as e:
        print(f"Error saving CV record: {e}")
        return None


def get_active_cv(user_id: str) -> dict | None:
    """Get the most recent active CV for a user."""
    try:
        result = supabase.table("cvs")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("is_active", True)\
            .order("uploaded_at", desc=True)\
            .limit(1)\
            .maybe_single().execute()
        return result.data if result else None
    except Exception as e:
        print(f"Error fetching active CV: {e}")
        return None


# ==============================================================
# CV ANALYSIS
# ==============================================================

def save_cv_analysis(user_id: str, cv_id: str, analysis: dict, prediction: dict) -> str | None:
    """Save AI analysis results to cv_analysis table. Returns analysis id."""
    try:
        # Map analysis dict (from cv_analysis_service.py) to DB columns
        payload = {
            "cv_id": cv_id,
            "user_id": user_id,
            "cv_score": analysis.get("cvScore", 0),
            "ats_score": analysis.get("atsScore", 0),
            "skills_relevance_score": analysis.get("details", {}).get("skillScore", 0),
            "experience_quality_score": analysis.get("experienceQualityScore") or analysis.get("details", {}).get("experienceQualityScore") or min(analysis.get("details", {}).get("experienceYears", 0) * 10, 100),
            "format_clarity_score": analysis.get("atsScore", 0),
            "predicted_category": analysis.get("predictedCategory", ""),
            "job_category": analysis.get("predictedCategory", ""),
            "experience_level": analysis.get("experienceLevel", ""),
            "experience_years": round(float(analysis.get("details", {}).get("experienceYears", 0) or 0), 1),
            "education_level": analysis.get("details", {}).get("educationLevel", 1),
            "previous_companies": analysis.get("details", {}).get("previousCompanies", 1),
            "skill_score": analysis.get("details", {}).get("skillScore", 0),
            "detected_skills": analysis.get("skills", []),
            "strengths": analysis.get("strengths", []),
            "improvements": analysis.get("improvements", []),
            "communication_score": analysis.get("communicationScore", 0),
            "cultural_fit_score": analysis.get("culturalFitScore", 0),
            "ai_note": _build_ai_note(analysis, prediction),
            "raw_text_preview": analysis.get("rawTextPreview", "")
        }

        result = supabase.table("cv_analysis").insert(payload).execute()
        return result.data[0]["id"] if result.data else None
    except Exception as e:
        print(f"Error saving CV analysis: {e}")
        return None


def _build_ai_note(analysis: dict, prediction: dict) -> str:
    category = analysis.get("predictedCategory", "Unknown")
    score = analysis.get("cvScore", 0)
    rec = prediction.get("hiringRecommendation", "Not Recommended")
    chance = prediction.get("hiringChance", 0)
    if rec == "Recommended":
        return (f"Candidate matches '{category}' category with {score}/100 CV score. "
                f"Strong match. Hiring probability is high ({chance:.0f}%).")
    return (f"Candidate matches '{category}' category with {score}/100 CV score. "
            f"Interview recommended to assess core qualifications. "
            f"Hiring probability is {chance:.0f}%.")


def get_latest_cv_analysis(user_id: str) -> dict | None:
    """Get the most recent CV analysis for a candidate."""
    try:
        result = supabase.table("cv_analysis")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("analyzed_at", desc=True)\
            .limit(1)\
            .maybe_single().execute()
        return result.data if result else None
    except Exception as e:
        print(f"Error fetching CV analysis: {e}")
        return None


# ==============================================================
# RECRUITMENT PREDICTIONS
# ==============================================================

def save_recruitment_prediction(user_id: str, inputs: dict, outputs: dict,
                                 application_id: str = None,
                                 cv_analysis_id: str = None) -> str | None:
    """Save XGBoost prediction results."""
    try:
        payload = {
            "user_id": user_id,
            "application_id": application_id,
            "cv_analysis_id": cv_analysis_id,
            "age": inputs.get("Age", 27),
            "gender": inputs.get("Gender", 1),
            "education_level": inputs.get("EducationLevel", 1),
            "experience_years": round(float(inputs.get("ExperienceYears", 0) or 0), 1),
            "previous_companies": inputs.get("PreviousCompanies", 1),
            "distance_km": inputs.get("DistanceFromCompany", 10.0),
            "interview_score": inputs.get("InterviewScore", 70),
            "skill_score": inputs.get("SkillScore", 50),
            "personality_score": inputs.get("PersonalityScore", 75),
            "recruitment_strategy": inputs.get("RecruitmentStrategy", 2),
            "hiring_chance": outputs.get("hiringChance", 0.0),
            "hiring_probability": outputs.get("hiringChance", 0.0) / 100,
            "hiring_recommendation": outputs.get("hiringRecommendation", "Not Recommended")
        }
        result = supabase.table("recruitment_predictions").insert(payload).execute()
        return result.data[0]["id"] if result.data else None
    except Exception as e:
        print(f"Error saving recruitment prediction: {e}")
        return None


def get_hiring_prediction(user_id: str) -> dict | None:
    """Get the most recent hiring prediction for a user."""
    try:
        result = supabase.table("recruitment_predictions")\
            .select("hiring_chance, hiring_recommendation, hiring_probability")\
            .eq("user_id", user_id)\
            .order("predicted_at", desc=True)\
            .limit(1)\
            .maybe_single().execute()
        return result.data if result else None
    except Exception as e:
        print(f"Error fetching prediction: {e}")
        return None


# ==============================================================
# RECRUITER — CANDIDATES
# ==============================================================

def get_candidates_for_recruiter(recruiter_id: str) -> list[dict]:
    """
    Get candidates who applied to jobs owned by this recruiter.
    Returns each application as a separate entry (not grouped/deduplicated by candidate).
    Uses batch queries to prevent N+1 queries.
    """
    try:
        # Step 1: Find all job IDs that belong to this recruiter
        recruiter_jobs = supabase.table("jobs")\
            .select("id")\
            .eq("recruiter_id", recruiter_id)\
            .execute()

        job_ids = [j["id"] for j in (recruiter_jobs.data or [])]
        print(f"[DEBUG] recruiter_id: {recruiter_id}")
        print(f"[DEBUG] jobs found: {len(job_ids)}")

        if not job_ids:
            print("[DEBUG] candidates returned: 0")
            return []  # This recruiter has no jobs posted yet

        # Step 2: Find all applications to those jobs (include jobs(title) nested query)
        applications_res = supabase.table("applications")\
            .select("id, candidate_id, job_id, status, applied_at, jobs(title)")\
            .in_("job_id", job_ids)\
            .order("applied_at", desc=True)\
            .execute()

        applications = applications_res.data or []
        print(f"[DEBUG] applications found: {len(applications)}")

        if not applications:
            return []

        # Step 3: Batch fetch user & candidate profile info to prevent N+1 queries
        candidate_ids = list(set(ap["candidate_id"] for ap in applications))

        # Batch users
        users_res = supabase.table("users")\
            .select("id, email, first_name, last_name, created_at")\
            .in_("id", candidate_ids)\
            .execute()
        users_by_id = {u["id"]: u for u in (users_res.data or [])}

        # Batch cv analyses (keep only latest per candidate_id)
        analyses_res = supabase.table("cv_analysis")\
            .select("user_id, cv_score, ats_score, job_category, experience_years, detected_skills, "
                    "improvements, strengths, ai_note, analyzed_at, predicted_category, "
                    "communication_score, cultural_fit_score, skill_score")\
            .in_("user_id", candidate_ids)\
            .execute()
        analyses_by_id = {}
        for a in (analyses_res.data or []):
            uid = a["user_id"]
            if uid not in analyses_by_id or a.get("analyzed_at", "") > analyses_by_id[uid].get("analyzed_at", ""):
                analyses_by_id[uid] = a

        # Batch recruitment predictions (keep only latest per candidate_id)
        preds_res = supabase.table("recruitment_predictions")\
            .select("user_id, hiring_chance, hiring_recommendation, predicted_at")\
            .in_("user_id", candidate_ids)\
            .execute()
        preds_by_id = {}
        for p in (preds_res.data or []):
            uid = p["user_id"]
            if uid not in preds_by_id or p.get("predicted_at", "") > preds_by_id[uid].get("predicted_at", ""):
                preds_by_id[uid] = p

        # Batch candidate profiles
        profiles_res = supabase.table("candidate_profiles")\
            .select("user_id, location, desired_salary")\
            .in_("user_id", candidate_ids)\
            .execute()
        profiles_by_id = {pr["user_id"]: pr for pr in (profiles_res.data or [])}

        # Batch active CVs (keep only latest per candidate_id)
        cvs_res = supabase.table("cvs")\
            .select("user_id, file_path, file_name, uploaded_at")\
            .in_("user_id", candidate_ids)\
            .eq("is_active", True)\
            .execute()
        cvs_by_id = {}
        for cv in (cvs_res.data or []):
            uid = cv["user_id"]
            if uid not in cvs_by_id or cv.get("uploaded_at", "") > cvs_by_id[uid].get("uploaded_at", ""):
                cvs_by_id[uid] = cv

        # Batch candidate resumes
        resumes_res = supabase.table("candidate_resumes")\
            .select("user_id, resume_json")\
            .in_("user_id", candidate_ids)\
            .execute()
        resumes_by_id = {r["user_id"]: r.get("resume_json") or {} for r in (resumes_res.data or [])}

        # Batch fetch other jobs these candidates applied to
        all_apps_res = supabase.table("applications")\
            .select("candidate_id, status, applied_at, jobs(title, department)")\
            .in_("candidate_id", candidate_ids)\
            .execute()
        apps_by_candidate = {}
        for app_row in (all_apps_res.data or []):
            uid = app_row["candidate_id"]
            if uid not in apps_by_candidate:
                apps_by_candidate[uid] = []
            j = app_row.get("jobs") or {}
            apps_by_candidate[uid].append({
                "title": j.get("title", "Unknown Role"),
                "department": j.get("department", "General"),
                "status": app_row.get("status"),
                "appliedAt": app_row.get("applied_at")[:10] if app_row.get("applied_at") else ""
            })

        # Step 4: Map each application to a returned candidate object
        candidates = []
        for ap in applications:
            app_id = ap["id"]
            cid = ap["candidate_id"]
            
            # Retrieve batched details
            u = users_by_id.get(cid)
            if not u:
                continue

            full_name = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
            initials = "".join([part[0] for part in full_name.split() if part]).upper()[:2] or "?"

            a = analyses_by_id.get(cid) or {}
            p = preds_by_id.get(cid) or {}
            pr = profiles_by_id.get(cid) or {}
            cv = cvs_by_id.get(cid) or {}
            res_data = resumes_by_id.get(cid) or {}

            education = res_data.get("education") or []
            experiences = res_data.get("experiences") or []
            certifications = res_data.get("certifications") or []

            applied_jobs = apps_by_candidate.get(cid) or []
            job_title = ap.get("jobs", {}).get("title") or "Position"

            candidates.append({
                "id": app_id,  # UNIQUE per application so different applications aren't grouped
                "name": full_name,
                "email": u.get("email"),
                "avatar": initials,
                "avatarBg": "bg-primary",
                "role": job_title,  # Set the role/subtitle to the applied job title
                "cvScore": a.get("cv_score", 0),
                "atsScore": a.get("ats_score", 0),
                "communicationScore": a.get("communication_score", 0),
                "culturalFitScore": a.get("cultural_fit_score", 0),
                "skillScore": a.get("skill_score", 0),
                "hiringChance": p.get("hiring_chance", 0),
                "hiringRecommendation": p.get("hiring_recommendation", "Not Recommended"),
                "status": ap.get("status", "submitted"),
                "appliedDate": ap.get("applied_at", u.get("created_at", ""))[:10] if ap.get("applied_at") else u.get("created_at", "")[:10],
                "skills": a.get("detected_skills", []),
                "jobCategory": a.get("job_category", ""),
                "location": pr.get("location", ""),
                "experience": f"{a.get('experience_years', 0)} years",
                "salary": pr.get("desired_salary", ""),
                "matchScore": a.get("cv_score", 0),
                "aiNote": a.get("ai_note", "Profile created. Awaiting CV upload and AI analysis."),
                "cvAnalyzed": bool(a),
                "improvements": a.get("improvements", []),
                "strengths": a.get("strengths", []),
                "cvFilePath": cv.get("file_path", ""),
                "cvFileName": cv.get("file_name", ""),
                "education": education,
                "experienceList": experiences,
                "certifications": certifications,
                "appliedJobs": applied_jobs
            })

        print(f"[DEBUG] candidates returned: {len(candidates)}")
        return candidates
    except Exception as e:
        print(f"Error fetching candidates for recruiter: {e}")
        import traceback as _tb
        print(_tb.format_exc())
        return []


def get_candidate_cv_url(file_path: str) -> str | None:
    """Generate a signed URL for recruiter to access a candidate's CV."""
    if not file_path or file_path.startswith("private://"):
         return None
    return get_signed_cv_url(file_path, expires_in=3600)


def update_application_status(candidate_id: str, new_status: str, recruiter_id: str = None, application_id: str = None) -> bool:
    """
    Update the application status for a candidate or specific application.
    SECURITY FIX: When recruiter_id is provided, verifies the application is for one of the
    recruiter's own job postings before updating. Prevents cross-recruiter status manipulation.
    After a successful update, automatically creates an in-app notification for the candidate.
    """
    import traceback as _tb
    try:
        valid_statuses = ["submitted", "screening", "interview", "offered", "accepted", "rejected"]
        if new_status not in valid_statuses:
            return False

        if application_id:
            query = supabase.table("applications")\
                .select("id, job_id, candidate_id")\
                .eq("id", application_id)\
                .maybe_single()
        else:
            query = supabase.table("applications")\
                .select("id, job_id, candidate_id")\
                .eq("candidate_id", candidate_id)\
                .order("applied_at", desc=True)\
                .limit(1)\
                .maybe_single()

        app = query.execute()

        if not app or not app.data:
            print(f"No application found for ID/candidate {application_id or candidate_id}")
            return False

        application_id = app.data["id"]
        job_id = app.data["job_id"]
        candidate_id = app.data["candidate_id"]

        # SECURITY: If recruiter_id is provided, verify they own the job for this application
        if recruiter_id:
            job_check = supabase.table("jobs")\
                .select("id")\
                .eq("id", job_id)\
                .eq("recruiter_id", recruiter_id)\
                .maybe_single().execute()
            if not job_check or not job_check.data:
                print(f"Recruiter {recruiter_id} is not authorized to update application {application_id}")
                return False

        supabase.table("applications")\
            .update({"status": new_status})\
            .eq("id", application_id)\
            .execute()

        # ── Fire candidate in-app notification ───────────────────────────
        # Only notify on meaningful stage transitions (not 'submitted')
        notifiable_statuses = ["screening", "interview", "offered", "accepted", "rejected"]
        if new_status in notifiable_statuses:
            try:
                # Fetch job title for the notification message
                job_res = supabase.table("jobs").select("title").eq("id", job_id).maybe_single().execute()
                job_title = (job_res.data or {}).get("title", "the position") if job_res else "the position"
                create_candidate_notification(
                    user_id=candidate_id,
                    application_id=application_id,
                    new_status=new_status,
                    job_title=job_title
                )

                # Fire email notification (non-blocking)
                try:
                    from services.email_service import send_status_change_email
                    send_status_change_email(
                        candidate_id=candidate_id,
                        application_id=application_id,
                        job_id=job_id,
                        new_status=new_status,
                        job_title=job_title
                    )
                except Exception as mail_err:
                    print(f"[update_application_status] Email notification error (non-fatal): {mail_err}")
            except Exception as notif_err:
                # Notification failure must NOT block the status update
                print(f"[update_application_status] Notification error (non-fatal): {notif_err}")
                print(_tb.format_exc())
        # ── End notification ──────────────────────────────────────────────

        return True
    except Exception as e:
        print(f"Error updating application status: {e}")
        return False



# ==============================================================
# JOBS
# ==============================================================

def get_open_jobs() -> list[dict]:
    """Get all open job postings."""
    try:
        result = supabase.table("jobs")\
            .select("*, users(first_name, last_name)")\
            .eq("status", "open")\
            .order("created_at", desc=True)\
            .execute()
        return result.data or []
    except Exception as e:
        print(f"Error fetching jobs: {e}")
        return []


def get_recruiter_jobs(recruiter_id: str) -> list[dict]:
    """Get all jobs posted by a specific recruiter."""
    try:
        result = supabase.table("jobs")\
            .select("*")\
            .eq("recruiter_id", recruiter_id)\
            .order("created_at", desc=True)\
            .execute()
        return result.data or []
    except Exception as e:
        print(f"Error fetching recruiter jobs: {e}")
        return []


def create_job(recruiter_id: str, job_data: dict) -> dict | None:
    """Create a new job posting."""
    try:
        allowed = [
            "title", "department", "location", "employment_type", "salary_min",
            "salary_max", "currency", "description", "requirements",
            "required_skills", "experience_min_years", "education_level_min",
            "status", "deadline"
        ]
        payload = {k: v for k, v in job_data.items() if k in allowed}
        payload["recruiter_id"] = recruiter_id
        payload.setdefault("status", "open")

        result = supabase.table("jobs").insert(payload).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error creating job: {e}")
        return None


# ==============================================================
# APPLICATIONS
# ==============================================================

def apply_to_job(candidate_id: str, job_id: str, cv_id: str = None,
                 cover_letter: str = "") -> dict | None:
    """Submit a job application."""
    import traceback as _tb
    try:
        result = supabase.table("applications").insert({
            "job_id": job_id,
            "candidate_id": candidate_id,
            "cv_id": cv_id,
            "cover_letter": cover_letter,
            "status": "submitted"
        }).execute()
        if result.data:
            app_data = result.data[0]
            try:
                # Find job and recruiter details
                job_res = supabase.table("jobs").select("title, recruiter_id").eq("id", job_id).maybe_single().execute()
                if job_res and job_res.data:
                    rec_id = job_res.data["recruiter_id"]
                    job_title = job_res.data["title"]
                    
                    # Get candidate's name
                    cand_res = supabase.table("users").select("first_name, last_name").eq("id", candidate_id).maybe_single().execute()
                    cand_name = "A candidate"
                    if cand_res and cand_res.data:
                        cand_name = f"{cand_res.data.get('first_name', '')} {cand_res.data.get('last_name', '')}".strip() or "A candidate"
                        
                    # Insert notification
                    msg = f"New application received from {cand_name} for the position of {job_title}."
                    supabase.table("notifications").insert({
                        "user_id": rec_id,
                        "message": msg,
                        "is_read": False
                    }).execute()
            except Exception as e:
                print(f"Error generating notification inside apply_to_job: {e}")
                print(_tb.format_exc())
            return app_data
        return None
    except Exception as e:
        print(f"[apply_to_job] Error applying to job: {e}")
        print(_tb.format_exc())
        return None



def get_candidate_applications(candidate_id: str) -> list[dict]:
    """Get all job applications for a candidate."""
    try:
        result = supabase.table("applications")\
            .select("*, jobs(title, department, location, employment_type)")\
            .eq("candidate_id", candidate_id)\
            .order("applied_at", desc=True)\
            .execute()
        return result.data or []
    except Exception as e:
        print(f"Error fetching applications: {e}")
        return []


# ==============================================================
# REPORTS (Recruiter)
# ==============================================================

def get_recruiter_report_stats(recruiter_id: str) -> dict:
    """
    Aggregate stats for recruiter reports page — scoped strictly to this recruiter's jobs.
    SECURITY: Scoped to recruiter's own pipeline.
    """
    try:
        # Step 1: Get this recruiter's job IDs
        jobs_res = supabase.table("jobs")\
            .select("id")\
            .eq("recruiter_id", recruiter_id)\
            .execute()
        job_ids = [j["id"] for j in (jobs_res.data or [])]

        if not job_ids:
            return {
                "totalCandidates": 0,
                "totalApplications": 0,
                "averageCvScore": 0,
                "pipelineConversion": "0%",
                "hiringConversion": "0%",
                "hiringTrends": [],
                "cvScoreDist": [],
                "topCategories": [],
                "skillDistribution": [],
                "funnel": []
            }

        # Step 2: Get applications scoped to recruiter's jobs
        apps_res = supabase.table("applications")\
            .select("id, candidate_id, status, applied_at, updated_at")\
            .in_("job_id", job_ids)\
            .execute()
        apps = apps_res.data or []

        total_applications = len(apps)
        candidate_ids = list(set(a["candidate_id"] for a in apps))
        total_candidates = len(candidate_ids)

        # Applications by status
        status_counts: dict = {}
        for row in apps:
            s = row["status"]
            status_counts[s] = status_counts.get(s, 0) + 1

        # Step 3: CV scores for candidates in this pipeline
        cv_scores = []
        category_counts: dict = {}
        skill_counts: dict = {}

        for cid in candidate_ids:
            analysis = supabase.table("cv_analysis")\
                .select("cv_score, job_category, detected_skills")\
                .eq("user_id", cid)\
                .order("analyzed_at", desc=True)\
                .limit(1)\
                .maybe_single().execute()
            if analysis and analysis.data:
                score = analysis.data.get("cv_score")
                if score is not None:
                    cv_scores.append(score)
                cat = analysis.data.get("job_category") or "Unknown"
                category_counts[cat] = category_counts.get(cat, 0) + 1
                for skill in (analysis.data.get("detected_skills") or []):
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1

        avg_cv_score = round(sum(cv_scores) / len(cv_scores), 1) if cv_scores else 0

        # Pipeline Conversion (screening, interview, offered, accepted) / total
        past_submitted = sum(1 for a in apps if a["status"] in ["screening", "interview", "offered", "accepted"])
        pipeline_conversion = f"{round((past_submitted / total_applications) * 100)}%" if total_applications > 0 else "0%"

        # Hiring Conversion (accepted) / total
        accepted_apps = sum(1 for a in apps if a["status"] == "accepted")
        hiring_conversion = f"{round((accepted_apps / total_applications) * 100)}%" if total_applications > 0 else "0%"

        # Hiring Trends over the last 6 months
        import datetime
        today = datetime.date.today()
        month_list = []
        for i in range(5, -1, -1):
            y = today.year
            m = today.month - i
            while m <= 0:
                m += 12
                y -= 1
            label = datetime.date(y, m, 1).strftime("%b")
            month_list.append((y, m, label))

        trends = {label: {"month": label, "applied": 0, "hired": 0, "rejected": 0} for _, _, label in month_list}

        for a in apps:
            applied_str = a.get("applied_at")
            if applied_str:
                try:
                    dt = datetime.datetime.fromisoformat(applied_str.split("T")[0])
                    label = dt.strftime("%b")
                    if label in trends:
                        trends[label]["applied"] += 1
                except Exception:
                    pass

            status = a.get("status")
            if status == "accepted":
                date_str = a.get("updated_at") or a.get("applied_at")
            elif status == "rejected":
                date_str = a.get("applied_at")
            else:
                date_str = None

            if date_str:
                try:
                    dt = datetime.datetime.fromisoformat(date_str.split("T")[0])
                    label = dt.strftime("%b")
                    if label in trends:
                        if status == "accepted":
                            trends[label]["hired"] += 1
                        elif status == "rejected":
                            trends[label]["rejected"] += 1
                except Exception:
                    pass

        hiring_trends_list = [trends[label] for _, _, label in month_list]

        # CV Score Distribution
        ranges = {
            "0–59": 0,
            "60–69": 0,
            "70–79": 0,
            "80–89": 0,
            "90–100": 0
        }
        for score in cv_scores:
            if score >= 90:
                ranges["90–100"] += 1
            elif score >= 80:
                ranges["80–89"] += 1
            elif score >= 70:
                ranges["70–79"] += 1
            elif score >= 60:
                ranges["60–69"] += 1
            else:
                ranges["0–59"] += 1

        colors = ["#fecdd3", "#ffd6a5", "#bae6fd", "#e9d5ff", "#b8f2e6"]
        cv_score_dist = [
            {"range": r, "count": count, "fill": colors[i]}
            for i, (r, count) in enumerate(ranges.items())
        ]

        # Categories
        cat_colors = ["#6366f1", "#06b6d4", "#ffb86c", "#f472b6", "#4ade80"]
        sorted_cats = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_categories = [
            {"category": cat, "count": count} for cat, count in sorted_cats
        ]

        # Skill Distribution (Radar)
        sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:6]
        skill_distribution = [{"skill": skill, "A": count} for skill, count in sorted_skills]
        if not skill_distribution:
            skill_distribution = [
                {"skill": "Figma", "A": 0},
                {"skill": "React", "A": 0},
                {"skill": "Research", "A": 0},
                {"skill": "Leadership", "A": 0},
                {"skill": "Agile", "A": 0},
                {"skill": "Data", "A": 0}
            ]

        # Funnel
        applied_cnt = len(apps)
        screened_cnt = sum(1 for a in apps if a["status"] in ["screening", "interview", "offered", "accepted"])
        interview_cnt = sum(1 for a in apps if a["status"] in ["interview", "offered", "accepted"])
        offer_cnt = sum(1 for a in apps if a["status"] in ["offered", "accepted"])
        hired_cnt = sum(1 for a in apps if a["status"] == "accepted")

        funnel = [
            {"stage": "Applied", "count": applied_cnt, "color": "bg-[#bae6fd]", "text": "text-sky-700"},
            {"stage": "Screened", "count": screened_cnt, "color": "bg-[#e9d5ff]", "text": "text-violet-700"},
            {"stage": "Interview", "count": interview_cnt, "color": "bg-[#ffd6a5]", "text": "text-orange-700"},
            {"stage": "Offer", "count": offer_cnt, "color": "bg-[#b8f2e6]", "text": "text-emerald-700"},
            {"stage": "Hired", "count": hired_cnt, "color": "bg-primary", "text": "text-white"}
        ]

        return {
            "totalCandidates": total_candidates,
            "totalApplications": total_applications,
            "averageCvScore": avg_cv_score,
            "pipelineConversion": pipeline_conversion,
            "hiringConversion": hiring_conversion,
            "hiringTrends": hiring_trends_list,
            "cvScoreDist": cv_score_dist,
            "topCategories": top_categories,
            "skillDistribution": skill_distribution,
            "funnel": funnel
        }
    except Exception as e:
        print(f"Error generating report stats: {e}")
        return {
            "totalCandidates": 0,
            "totalApplications": 0,
            "averageCvScore": 0,
            "pipelineConversion": "0%",
            "hiringConversion": "0%",
            "hiringTrends": [],
            "cvScoreDist": [],
            "topCategories": [],
            "skillDistribution": [],
            "funnel": []
        }


def get_candidate_cv_history(user_id: str) -> list[dict]:
    """Fetch all past CV analyses for a candidate, joined with CV info and prediction results."""
    try:
        # Fetch cv_analysis records for this user, including details of the associated cvs
        result = supabase.table("cv_analysis")\
            .select("*, cvs(file_name)")\
            .eq("user_id", user_id)\
            .order("analyzed_at", desc=True)\
            .execute()
        
        analyses = result.data or []
        history = []
        
        for a in analyses:
            # Get the recruitment prediction for this specific cv_analysis_id
            pred_res = supabase.table("recruitment_predictions")\
                .select("hiring_chance, hiring_recommendation")\
                .eq("cv_analysis_id", a["id"])\
                .maybe_single().execute()
            p = pred_res.data if pred_res else {}
            
            cv_info = a.get("cvs") or {}
            
            history.append({
                "id": a.get("id"),
                "cvId": a.get("cv_id"),
                "fileName": cv_info.get("file_name") or "Unknown CV",
                "analyzedAt": a.get("analyzed_at"),
                "cvScore": a.get("cv_score", 0),
                "atsScore": a.get("ats_score", 0),
                "skillsRelevanceScore": a.get("skills_relevance_score", 0),
                "experienceQualityScore": a.get("experience_quality_score", 0),
                "formatClarityScore": a.get("format_clarity_score", 0),
                "skills": a.get("detected_skills", []),
                "jobCategory": a.get("job_category", ""),
                "predictedCategory": a.get("predicted_category", ""),
                "experienceLevel": a.get("experience_level", ""),
                "experienceYears": a.get("experience_years", 0),
                "educationLevel": a.get("education_level", 1),
                "previousCompanies": a.get("previous_companies", 1),
                "skillScore": a.get("skill_score", 0),
                "strengths": a.get("strengths", []),
                "improvements": a.get("improvements", []),
                "aiNote": a.get("ai_note", ""),
                "communicationScore": a.get("communication_score", 0),
                "culturalFitScore": a.get("cultural_fit_score", 0),
                "hiringChance": p.get("hiring_chance", 0),
                "hiringRecommendation": p.get("hiring_recommendation", "Not Recommended")
            })
        return history
    except Exception as e:
        print(f"Error fetching CV history: {e}")
        return []


def get_candidate_resume(user_id: str) -> dict | None:
    """Get the candidate's last saved resume."""
    try:
        result = supabase.table("candidate_resumes")\
            .select("*")\
            .eq("user_id", user_id)\
            .maybe_single().execute()
        return result.data if result else None
    except Exception as e:
        print(f"Error fetching candidate resume: {e}")
        return None


def save_candidate_resume(user_id: str, resume_json: dict, template_name: str) -> bool:
    """Upsert the candidate's resume draft."""
    try:
        # Check if record exists
        existing = supabase.table("candidate_resumes").select("id").eq("user_id", user_id).maybe_single().execute()
        
        payload = {
            "user_id": user_id,
            "resume_json": resume_json,
            "template_name": template_name,
            "updated_at": "now()"
        }
        
        if existing and existing.data:
            supabase.table("candidate_resumes").update(payload).eq("user_id", user_id).execute()
        else:
            supabase.table("candidate_resumes").insert(payload).execute()
        return True
    except Exception as e:
        print(f"Error saving candidate resume: {e}")
        return False


# ==============================================================
# NOTIFICATIONS (Recruiter)
# ==============================================================

def get_recruiter_notifications(recruiter_id: str) -> list[dict]:
    """Get notifications for a recruiter, newest first."""
    try:
        res = supabase.table("notifications")\
            .select("*")\
            .eq("user_id", recruiter_id)\
            .order("created_at", desc=True)\
            .execute()
        return res.data or []
    except Exception as e:
        print(f"Error fetching recruiter notifications: {e}")
        return []


def mark_notification_as_read(notification_id: str, recruiter_id: str) -> bool:
    """Mark a specific recruiter notification as read."""
    try:
        supabase.table("notifications")\
            .update({"is_read": True})\
            .eq("id", notification_id)\
            .eq("user_id", recruiter_id)\
            .execute()
        return True
    except Exception as e:
        print(f"Error marking recruiter notification as read: {e}")
        return False


# ==============================================================
# NOTIFICATIONS (Candidate)
# ==============================================================

# Notification content map per stage transition
# Titles and messages match the exact wording specified for the platform.
_NOTIFICATION_CONTENT = {
    "screening": {
        "title": "Application Moved to Screening",
        "message": "Your application for {job_title} has moved to Screening.",
    },
    "interview": {
        "title": "Advanced to Interview Stage",
        "message": "You have advanced to Interview stage for {job_title}.",
    },
    "offered": {
        "title": "Job Offer Received",
        "message": "You have received a job offer for {job_title}.",
    },
    "accepted": {
        "title": "Application Accepted",
        "message": "Congratulations! You have been accepted for {job_title}.",
    },
    "rejected": {
        "title": "Application Not Selected",
        "message": "Your application for {job_title} was not selected.",
    },
}


def create_candidate_notification(
    user_id: str,
    application_id: str,
    new_status: str,
    job_title: str = "the position"
) -> str | None:
    """
    Insert a notification record for a candidate when their application stage changes.

    Duplicate prevention:
        A notification is only created when no existing notification with the same
        (application_id, type) pair already exists for this user.  This ensures
        that re-triggering the same transition (e.g. recruiter clicks twice) does
        NOT produce duplicate entries.

    Returns the new notification id on success, or None if skipped / on failure.
    """
    try:
        content = _NOTIFICATION_CONTENT.get(new_status)
        if not content:
            print(f"[create_candidate_notification] No template for status '{new_status}' — skipping")
            return None

        # ── Duplicate guard ───────────────────────────────────────────────────
        # Check: does a notification with the same application_id + type exist?
        existing = supabase.table("notifications") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("application_id", application_id) \
            .eq("type", new_status) \
            .limit(1) \
            .execute()

        if existing and existing.data:
            print(
                f"[create_candidate_notification] Duplicate skipped — "
                f"notification for application={application_id} type={new_status} already exists "
                f"(id={existing.data[0]['id']})"
            )
            return existing.data[0]["id"]  # return existing id, not an error
        # ── End duplicate guard ───────────────────────────────────────────────

        title   = content["title"]
        message = content["message"].format(job_title=job_title)

        res = supabase.table("notifications").insert({
            "user_id":        user_id,
            "application_id": application_id,
            "title":          title,
            "message":        message,
            "type":           new_status,
            "is_read":        False,
        }).execute()

        if res.data:
            notif_id = res.data[0]["id"]
            print(
                f"[create_candidate_notification] Created — "
                f"id={notif_id} user={user_id} status={new_status} "
                f"application={application_id} job='{job_title}'"
            )
            return notif_id
        return None
    except Exception as e:
        print(f"[create_candidate_notification] Error: {e}")
        return None


def get_candidate_notifications(user_id: str, limit: int = 50) -> list[dict]:
    """
    Get notifications for a candidate, newest first.
    Only returns notifications where type is a candidate-facing stage.
    """
    try:
        res = supabase.table("notifications")\
            .select("id, application_id, title, message, type, is_read, created_at")\
            .eq("user_id", user_id)\
            .in_("type", ["screening", "interview", "offered", "accepted", "rejected"])\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        return res.data or []
    except Exception as e:
        print(f"[get_candidate_notifications] Error: {e}")
        return []


def mark_candidate_notification_as_read(notification_id: str, user_id: str) -> bool:
    """
    Mark a single candidate notification as read.
    Scoped to user_id to prevent cross-user manipulation.
    """
    try:
        supabase.table("notifications")\
            .update({"is_read": True})\
            .eq("id", notification_id)\
            .eq("user_id", user_id)\
            .execute()
        return True
    except Exception as e:
        print(f"[mark_candidate_notification_as_read] Error: {e}")
        return False


def mark_all_candidate_notifications_as_read(user_id: str) -> bool:
    """
    Mark all unread notifications for a candidate as read.
    """
    try:
        supabase.table("notifications")\
            .update({"is_read": True})\
            .eq("user_id", user_id)\
            .eq("is_read", False)\
            .execute()
        return True
    except Exception as e:
        print(f"[mark_all_candidate_notifications_as_read] Error: {e}")
        return False


def get_candidate_unread_notification_count(user_id: str) -> int:
    """Return the number of unread notifications for a candidate."""
    try:
        res = supabase.table("notifications")\
            .select("id", count="exact")\
            .eq("user_id", user_id)\
            .eq("is_read", False)\
            .in_("type", ["screening", "interview", "offered", "accepted", "rejected"])\
            .execute()
        return res.count if res.count is not None else 0
    except Exception as e:
        print(f"[get_candidate_unread_notification_count] Error: {e}")
        return 0


# ==============================================================
# FEEDBACK
# ==============================================================

def get_eligible_feedback_applications(user_id: str) -> list[dict]:
    """
    Return applications for this candidate that are in a terminal state
    (accepted or rejected) AND have no feedback yet.
    """
    try:
        apps_res = (
            supabase.table("applications")
            .select("id, status, applied_at, jobs(title, department)")
            .eq("candidate_id", user_id)
            .in_("status", ["accepted", "rejected"])
            .order("applied_at", desc=True)
            .execute()
        )
        apps = apps_res.data or []

        if not apps:
            return []

        app_ids = [a["id"] for a in apps]

        # Find which of these already have feedback
        existing_fb = (
            supabase.table("feedback")
            .select("application_id")
            .eq("user_id", user_id)
            .in_("application_id", app_ids)
            .execute()
        )
        already_submitted = {row["application_id"] for row in (existing_fb.data or [])}

        eligible = []
        for a in apps:
            if a["id"] not in already_submitted:
                job_info = a.get("jobs") or {}
                eligible.append({
                    "applicationId": a["id"],
                    "status": a["status"],
                    "appliedAt": a.get("applied_at", ""),
                    "jobTitle": job_info.get("title", "Unknown Position"),
                    "department": job_info.get("department", ""),
                })
        return eligible
    except Exception as e:
        print(f"[get_eligible_feedback_applications] Error: {e}")
        return []


def submit_feedback(user_id: str, application_id: str, payload: dict) -> dict:
    """
    Submit candidate experience feedback.
    Validates that the application is in a terminal state and belongs to the user.
    Returns {"success": True} or {"success": False, "error": "..."}.
    """
    try:
        # Verify the application exists, belongs to candidate, and is terminal
        app_res = (
            supabase.table("applications")
            .select("id, status, candidate_id")
            .eq("id", application_id)
            .eq("candidate_id", user_id)
            .maybe_single()
            .execute()
        )
        if not app_res or not app_res.data:
            return {"success": False, "error": "Application not found or not authorized."}

        app_status = app_res.data.get("status")
        if app_status not in ("accepted", "rejected"):
            return {"success": False, "error": "Feedback can only be submitted for accepted or rejected applications."}

        # Check duplicate
        existing = (
            supabase.table("feedback")
            .select("id")
            .eq("user_id", user_id)
            .eq("application_id", application_id)
            .maybe_single()
            .execute()
        )
        if existing and existing.data:
            return {"success": False, "error": "Feedback already submitted for this application."}

        # Insert feedback
        insert_payload = {
            "user_id": user_id,
            "application_id": application_id,
            "overall_rating": int(payload.get("overall_rating", 1)),
            "ease_of_use_rating": int(payload.get("ease_of_use_rating", 1)),
            "ui_design_rating": int(payload.get("ui_design_rating", 1)),
            "recommendation_accuracy_rating": int(payload.get("recommendation_accuracy_rating", 1)),
            "recommendation_score": int(payload.get("recommendation_score", 5)),
            "favorite_feature": payload.get("favorite_feature"),
            "comment": payload.get("comment") or None,
        }
        res = supabase.table("feedback").insert(insert_payload).execute()
        if res.data:
            return {"success": True, "feedback_id": res.data[0]["id"]}
        return {"success": False, "error": "Failed to insert feedback."}
    except Exception as e:
        print(f"[submit_feedback] Error: {e}")
        return {"success": False, "error": str(e)}


def get_feedback_analytics(recruiter_id: str) -> dict:
    """
    Aggregated feedback analytics scoped to a recruiter's pipeline.
    Returns averages, NPS, feature distribution, and recent comments.
    """
    try:
        # Step 1: Get job IDs for this recruiter
        jobs_res = (
            supabase.table("jobs")
            .select("id")
            .eq("recruiter_id", recruiter_id)
            .execute()
        )
        job_ids = [j["id"] for j in (jobs_res.data or [])]
        if not job_ids:
            return _empty_analytics()

        # Step 2: Get all applications in this recruiter's pipeline that are terminal
        apps_res = (
            supabase.table("applications")
            .select("id, candidate_id")
            .in_("job_id", job_ids)
            .in_("status", ["accepted", "rejected"])
            .execute()
        )
        app_ids = [a["id"] for a in (apps_res.data or [])]
        if not app_ids:
            return _empty_analytics()

        # Step 3: Get feedback rows for those applications
        fb_res = (
            supabase.table("feedback")
            .select("*, applications(jobs(title)), users(first_name, last_name)")
            .in_("application_id", app_ids)
            .order("created_at", desc=True)
            .execute()
        )
        rows = fb_res.data or []

        if not rows:
            return _empty_analytics()

        total = len(rows)

        def avg(key):
            vals = [r[key] for r in rows if r.get(key) is not None]
            return round(sum(vals) / len(vals), 2) if vals else 0.0

        overall_avg           = avg("overall_rating")
        ease_avg              = avg("ease_of_use_rating")
        ui_avg                = avg("ui_design_rating")
        rec_accuracy_avg      = avg("recommendation_accuracy_rating")
        nps_avg               = avg("recommendation_score")

        # NPS category breakdown (promoters ≥9, detractors ≤6)
        promoters  = sum(1 for r in rows if (r.get("recommendation_score") or 0) >= 9)
        passives   = sum(1 for r in rows if (r.get("recommendation_score") or 0) in (7, 8))
        detractors = sum(1 for r in rows if (r.get("recommendation_score") or 0) <= 6)
        nps_score  = round(((promoters - detractors) / total) * 100) if total else 0

        # Favorite feature distribution
        feature_counts: dict = {}
        for r in rows:
            feat = r.get("favorite_feature")
            if feat:
                feature_counts[feat] = feature_counts.get(feat, 0) + 1

        feature_distribution = sorted(
            [{"feature": k, "count": v, "pct": round(v / total * 100)} for k, v in feature_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )

        # Rating distribution for overall experience (1-5 stars)
        rating_dist = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        for r in rows:
            val = r.get("overall_rating")
            if val in rating_dist:
                rating_dist[val] += 1
        rating_distribution = [
            {"rating": f"{k} Star", "count": v} for k, v in sorted(rating_dist.items())
        ]

        # Recent comments (latest 10)
        recent_comments = []
        for r in rows:
            if not r.get("comment"):
                continue
            
            job_title = "Unknown Position"
            app_data = r.get("applications")
            if isinstance(app_data, dict):
                job_data = app_data.get("jobs")
                if isinstance(job_data, dict):
                    job_title = job_data.get("title", "Unknown Position")
                    
            initials = "C"
            user_data = r.get("users")
            if isinstance(user_data, dict):
                first = user_data.get("first_name", "")
                last = user_data.get("last_name", "")
                if first or last:
                    initials = ((first[0] if first else "") + (last[0] if last else "")).upper()
            
            recent_comments.append({
                "comment": r["comment"],
                "rating": r["overall_rating"],
                "date": r["created_at"][:10],
                "jobTitle": job_title,
                "initials": initials
            })
        recent_comments = recent_comments[:10]

        return {
            "totalResponses": total,
            "averageRatings": {
                "overall": overall_avg,
                "easeOfUse": ease_avg,
                "uiDesign": ui_avg,
                "recommendationAccuracy": rec_accuracy_avg,
            },
            "nps": {
                "average": round(nps_avg, 1),
                "score": nps_score,
                "promoters": promoters,
                "passives": passives,
                "detractors": detractors,
            },
            "featureDistribution": feature_distribution,
            "ratingDistribution": rating_distribution,
            "recentComments": recent_comments,
        }
    except Exception as e:
        print(f"[get_feedback_analytics] Error: {e}")
        return _empty_analytics()


def _empty_analytics() -> dict:
    return {
        "totalResponses": 0,
        "averageRatings": {"overall": 0, "easeOfUse": 0, "uiDesign": 0, "recommendationAccuracy": 0},
        "nps": {"average": 0, "score": 0, "promoters": 0, "passives": 0, "detractors": 0},
        "featureDistribution": [],
        "ratingDistribution": [
            {"rating": "1 Star", "count": 0},
            {"rating": "2 Star", "count": 0},
            {"rating": "3 Star", "count": 0},
            {"rating": "4 Star", "count": 0},
            {"rating": "5 Star", "count": 0},
        ],
        "recentComments": [],
    }
