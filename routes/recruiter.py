"""
Recruiter routes — hardened with JWT authentication.

SECURITY:
- All routes use @require_auth(allowed_roles=['recruiter']) decorator.
- recruiter_id is ALWAYS taken from the verified JWT token (user.id), never from request params.
- Candidate access is scoped to recruiter's own job postings only.
"""
from flask import Blueprint, request, jsonify
from services.supabase_service import (
    require_auth,
    get_candidates_for_recruiter,
    get_candidate_cv_url,
    update_application_status,
    get_recruiter_jobs,
    create_job,
    get_recruiter_report_stats,
    get_feedback_analytics,
)

recruiter_bp = Blueprint("recruiter", __name__)


@recruiter_bp.route("/candidates", methods=["GET"])
@require_auth(allowed_roles=["recruiter", "admin"])
def get_candidates(user):
    """
    Return candidates who applied to this recruiter's job postings.
    SECURITY: recruiter_id is from JWT token (user.id), NOT from request params.
    """
    import json
    from services.supabase_service import supabase
    
    recruiter_id = user.id
    print(f"\n[GET /candidates] Triggered by recruiter_id: {recruiter_id}")
    
    # Query database stats for local debug print
    jobs_res = supabase.table("jobs").select("id").eq("recruiter_id", recruiter_id).execute()
    job_ids = [j["id"] for j in (jobs_res.data or [])]
    print(f"[GET /candidates] Jobs found in DB: {len(job_ids)} (IDs: {job_ids})")
    
    apps_res = supabase.table("applications").select("id", "status").in_("job_id", job_ids).execute() if job_ids else None
    apps_count = len(apps_res.data) if (apps_res and apps_res.data) else 0
    print(f"[GET /candidates] Applications found in DB: {apps_count}")
    
    candidates = get_candidates_for_recruiter(recruiter_id=recruiter_id)
    print(f"[GET /candidates] Candidates returned by helper: {len(candidates)}")
    
    response_data = {"candidates": candidates}
    print(f"[GET /candidates] Exact JSON Response:\n{json.dumps(response_data, indent=2)}")
    
    return jsonify(response_data), 200


@recruiter_bp.route("/candidate/<string:candidate_id>/action", methods=["POST"])
@require_auth(allowed_roles=["recruiter", "admin"])
def candidate_action(user, candidate_id: str):
    """
    Update the application status for a candidate or specific application.
    SECURITY: Only updates applications to jobs owned by this recruiter.
    Enforces stage-by-stage workflow:
      submitted -> screening -> interview -> offered -> accepted/rejected
    """
    from services.supabase_service import supabase

    data = request.get_json() or {}
    action = data.get("action")

    valid_statuses = ["submitted", "screening", "interview", "offered", "accepted", "rejected"]
    if not action:
        return jsonify({"error": "Action status is required"}), 400
    if action not in valid_statuses:
        return jsonify({"error": f"Invalid status '{action}'. Must be one of: {valid_statuses}"}), 400

    # Fetch the recruiter's jobs to scope the lookup
    recruiter_jobs = supabase.table("jobs").select("id").eq("recruiter_id", user.id).execute()
    job_ids = [j["id"] for j in (recruiter_jobs.data or [])]
    if not job_ids:
        return jsonify({"error": "No jobs found for this recruiter"}), 404

    # Check if the parameter is actually an application ID
    app_check = supabase.table("applications") \
        .select("id, status, candidate_id") \
        .eq("id", candidate_id) \
        .maybe_single().execute()

    is_app_id = False
    if app_check and app_check.data:
        is_app_id = True
        app_id = app_check.data["id"]
        current_status = app_check.data["status"]
        real_candidate_id = app_check.data["candidate_id"]
    else:
        # Look up the current application status — ORDER BY applied_at DESC
        app_res = supabase.table("applications") \
            .select("id, status, candidate_id") \
            .eq("candidate_id", candidate_id) \
            .in_("job_id", job_ids) \
            .order("applied_at", desc=True) \
            .limit(1) \
            .maybe_single().execute()

        if not app_res or not app_res.data:
            return jsonify({"error": "Candidate or application not found, or not authorized"}), 404

        app_id = app_res.data["id"]
        current_status = app_res.data["status"]
        real_candidate_id = app_res.data["candidate_id"]

    # ── Enforce workflow transitions ──────────────────────────────────────────
    ALLOWED_TRANSITIONS = {
        "submitted": ["screening", "rejected"],
        "screening":  ["interview", "rejected"],
        "interview":  ["offered",   "rejected"],
        "offered":    ["accepted",  "rejected"],
        "accepted":   [],   # final state
        "rejected":   [],   # final state
    }

    allowed_next = ALLOWED_TRANSITIONS.get(current_status, [])
    if action not in allowed_next and action != current_status:
        return jsonify({
            "error": (
                f"Invalid transition: cannot move from '{current_status}' to '{action}'. "
                f"Allowed next steps: {allowed_next if allowed_next else ['none (final state)']}"
            )
        }), 400
    # ── End workflow guard ────────────────────────────────────────────────────

    success = update_application_status(
        candidate_id=real_candidate_id,
        new_status=action,
        recruiter_id=user.id,  # scoped to this recruiter's jobs
        application_id=app_id
    )
    if not success:
        return jsonify({"error": "Failed to update application status"}), 500

    return jsonify({"message": f"Candidate status updated to '{action}'"}), 200


@recruiter_bp.route("/candidate/<string:candidate_id>/cv-url", methods=["GET"])
@require_auth(allowed_roles=["recruiter", "admin"])
def get_cv_download_url(user, candidate_id: str):
    """
    Generate a signed (expiring) URL to download a candidate's CV.
    SECURITY: Signed URLs expire in 1 hour. No public URLs are ever generated.
    """
    from services.supabase_service import supabase

    # Check if the parameter is actually an application ID
    app_res = supabase.table("applications") \
        .select("candidate_id") \
        .eq("id", candidate_id) \
        .maybe_single().execute()
    if app_res and app_res.data:
        real_candidate_id = app_res.data["candidate_id"]
    else:
        real_candidate_id = candidate_id

    # Verify candidate applied to one of this recruiter's jobs before granting URL
    recruiter_jobs = supabase.table("jobs").select("id").eq("recruiter_id", user.id).execute()
    job_ids = [j["id"] for j in (recruiter_jobs.data or [])]
    if not job_ids:
        return jsonify({"error": "Not authorized"}), 403

    # Check if this candidate applied to any of the recruiter's jobs
    app_check = supabase.table("applications")\
        .select("id")\
        .eq("candidate_id", real_candidate_id)\
        .in_("job_id", job_ids)\
        .limit(1)\
        .execute()

    if not app_check.data:
        return jsonify({"error": "Candidate did not apply to your job listings"}), 403

    # Get the candidate's active CV path
    cv_res = supabase.table("cvs")\
        .select("file_path, file_name")\
        .eq("user_id", real_candidate_id)\
        .eq("is_active", True)\
        .order("uploaded_at", desc=True)\
        .limit(1)\
        .maybe_single().execute()

    if not cv_res or not cv_res.data or not cv_res.data.get("file_path"):
        return jsonify({"error": "No CV found for this candidate"}), 404

    signed_url = get_candidate_cv_url(cv_res.data["file_path"])
    if not signed_url:
        return jsonify({"error": "Could not generate signed URL"}), 500

    return jsonify({
        "signedUrl": signed_url,
        "fileName": cv_res.data.get("file_name", "cv.pdf"),
        "expiresIn": 3600
    }), 200


@recruiter_bp.route("/jobs", methods=["GET"])
@require_auth(allowed_roles=["recruiter", "admin"])
def get_jobs(user):
    """
    Get all jobs posted by this recruiter.
    SECURITY: recruiter_id from JWT token — not request params.
    """
    jobs = get_recruiter_jobs(user.id)
    return jsonify({"jobs": jobs}), 200


@recruiter_bp.route("/jobs", methods=["POST"])
@require_auth(allowed_roles=["recruiter", "admin"])
def post_job(user):
    """
    Create a new job posting.
    SECURITY: recruiter_id is from JWT token — frontend cannot inject a different ID.
    """
    data = request.get_json() or {}
    # Remove any recruiter_id from body — always use JWT identity
    data.pop("recruiter_id", None)

    job = create_job(recruiter_id=user.id, job_data=data)
    if not job:
        return jsonify({"error": "Failed to create job"}), 500

    return jsonify({"message": "Job created successfully", "job": job}), 201


@recruiter_bp.route("/reports/stats", methods=["GET"])
@require_auth(allowed_roles=["recruiter", "admin"])
def get_report_stats(user):
    """
    Get aggregated stats for the recruiter reports page.
    Scoped to this recruiter's jobs.
    """
    stats = get_recruiter_report_stats(recruiter_id=user.id)
    return jsonify(stats), 200


@recruiter_bp.route("/jobs/<string:job_id>", methods=["PUT"])
@require_auth(allowed_roles=["recruiter", "admin"])
def update_job(user, job_id: str):
    """
    Update an existing job posting.
    SECURITY: Scoped to this recruiter.
    """
    from services.supabase_service import supabase
    data = request.get_json() or {}
    
    # Verify job ownership
    job_check = supabase.table("jobs").select("id").eq("id", job_id).eq("recruiter_id", user.id).maybe_single().execute()
    if not job_check or not job_check.data:
        return jsonify({"error": "Job not found or not authorized"}), 404
        
    allowed = [
        "title", "department", "location", "employment_type", "salary_min",
        "salary_max", "currency", "description", "requirements",
        "required_skills", "experience_min_years", "education_level_min",
        "status", "deadline"
    ]
    payload = {k: v for k, v in data.items() if k in allowed}
    
    try:
        res = supabase.table("jobs").update(payload).eq("id", job_id).execute()
        if res.data:
            return jsonify({"message": "Job updated successfully", "job": res.data[0]}), 200
        return jsonify({"error": "Failed to update job"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recruiter_bp.route("/jobs/<string:job_id>", methods=["DELETE"])
@require_auth(allowed_roles=["recruiter", "admin"])
def delete_job(user, job_id: str):
    """
    Delete a job posting.
    SECURITY: Scoped to this recruiter.
    """
    from services.supabase_service import supabase
    
    # Verify job ownership
    job_check = supabase.table("jobs").select("id").eq("id", job_id).eq("recruiter_id", user.id).maybe_single().execute()
    if not job_check or not job_check.data:
        return jsonify({"error": "Job not found or not authorized"}), 404
        
    try:
        supabase.table("jobs").delete().eq("id", job_id).execute()
        return jsonify({"message": "Job deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recruiter_bp.route("/notifications", methods=["GET"])
@require_auth(allowed_roles=["recruiter", "admin"])
def get_notifications(user):
    """
    Get all notifications for the logged in recruiter.
    """
    from services.supabase_service import get_recruiter_notifications
    notifications = get_recruiter_notifications(recruiter_id=user.id)
    return jsonify({"notifications": notifications}), 200


@recruiter_bp.route("/notifications/<string:notif_id>/read", methods=["POST"])
@require_auth(allowed_roles=["recruiter", "admin"])
def mark_notification_read(user, notif_id: str):
    """
    Mark a notification as read.
    """
    from services.supabase_service import mark_notification_as_read
    success = mark_notification_as_read(notification_id=notif_id, recruiter_id=user.id)
    if not success:
        return jsonify({"error": "Notification not found or not authorized"}), 404
    return jsonify({"message": "Notification marked as read"}), 200


# ==============================================================
# RECRUITER — FEEDBACK ANALYTICS
# ==============================================================

@recruiter_bp.route("/feedback/analytics", methods=["GET"])
@require_auth(allowed_roles=["recruiter", "admin"])
def get_feedback_analytics_route(user):
    """
    GET /api/recruiter/feedback/analytics
    Returns aggregated candidate experience feedback analytics
    scoped to this recruiter's pipeline.
    SECURITY: recruiter_id from JWT.
    """
    data = get_feedback_analytics(recruiter_id=user.id)
    return jsonify(data), 200
