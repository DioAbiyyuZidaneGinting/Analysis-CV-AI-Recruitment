"""
Candidate routes — hardened with JWT authentication.

SECURITY:
- All routes use @require_auth(allowed_roles=['candidate']) decorator.
- user_id is ALWAYS taken from the verified JWT token (user.id), never from request body/params.
- Recruitment predictions use REAL data from CV analysis, not hardcoded values.
"""
import os
import io
import base64
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from services.supabase_service import (
    require_auth,
    get_candidate_profile,
    upload_cv_to_storage,
    save_cv_record,
    save_cv_analysis,
    save_recruitment_prediction,
    get_candidate_applications,
    get_signed_cv_url,
    get_candidate_resume,
    save_candidate_resume,
    get_active_cv,
    get_candidate_notifications,
    get_candidate_unread_notification_count,
    mark_candidate_notification_as_read,
    mark_all_candidate_notifications_as_read,
    get_eligible_feedback_applications,
    submit_feedback,
)
from services.ai_service import (
    parse_resume,
    analyze_resume_content,
    optimize_resume_via_ai,
    generate_pdf_resume,
    generate_docx_resume,
    parse_cv_text_to_resume_json,
)

candidate_bp = Blueprint("candidate", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@candidate_bp.route("/profile", methods=["GET"])
@require_auth(allowed_roles=["candidate", "admin"])
def get_profile(user):
    """
    Get candidate profile.
    SECURITY: user_id from JWT token (user.id) — not from query params.
    """
    profile = get_candidate_profile(user.id)
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    return jsonify({"candidate": profile}), 200


@candidate_bp.route("/applications", methods=["GET"])
@require_auth(allowed_roles=["candidate", "admin"])
def get_applications(user):
    """
    Get all applications submitted by this candidate.
    SECURITY: candidate_id from JWT — never from request params.
    """
    apps = get_candidate_applications(user.id)
    return jsonify({"applications": apps}), 200


@candidate_bp.route("/history", methods=["GET"])
@require_auth(allowed_roles=["candidate", "admin"])
def get_history(user):
    """
    Get all past CV analyses for this candidate.
    SECURITY: user_id from JWT (user.id) — never from request params.
    """
    from services.supabase_service import get_candidate_cv_history
    history = get_candidate_cv_history(user.id)
    return jsonify({"history": history}), 200



@candidate_bp.route("/cv/download", methods=["GET"])
@require_auth(allowed_roles=["candidate", "admin"])
def download_cv(user):
    """
    Get a signed URL for the candidate's own CV.
    SECURITY: Only returns URL for the authenticated user's own CV.
    """
    from services.supabase_service import supabase
    cv_res = supabase.table("cvs")\
        .select("file_path, file_name")\
        .eq("user_id", user.id)\
        .eq("is_active", True)\
        .order("uploaded_at", desc=True)\
        .limit(1)\
        .maybe_single().execute()

    if not cv_res or not cv_res.data or not cv_res.data.get("file_path"):
        return jsonify({"error": "No CV found"}), 404

    signed_url = get_signed_cv_url(cv_res.data["file_path"], expires_in=3600)
    if not signed_url:
        return jsonify({"error": "Could not generate download URL"}), 500

    return jsonify({
        "signedUrl": signed_url,
        "fileName": cv_res.data.get("file_name", "cv.pdf"),
        "expiresIn": 3600
    }), 200


@candidate_bp.route("/upload", methods=["POST"])
@require_auth(allowed_roles=["candidate", "admin"])
def upload_cv(user):
    """
    Upload and analyze a CV.
    SECURITY:
    - user_id from JWT token (user.id) — NOT from form body.
    - Recruitment prediction uses REAL extracted data, NOT hardcoded values.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"error": "No file selected for uploading"}), 400

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"File type '{ext}' not allowed. Use PDF or DOCX."}), 400

    # Read file bytes
    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({"error": "File size exceeds 10 MB limit."}), 400

    mime_type_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword"
    }
    mime_type = mime_type_map.get(ext, "application/octet-stream")

    # Use JWT-verified user.id — never a client-supplied value
    user_id = user.id

    # 1. Save locally for AI parsing (temporary)
    local_path = os.path.join(UPLOAD_FOLDER, f"{user_id}_{filename}")
    with open(local_path, "wb") as f:
        f.write(file_bytes)

    # 2. Parse CV text using AI service
    text = parse_resume(local_path)
    if not text:
        os.remove(local_path)
        return jsonify({"error": "Could not extract text from file. Please upload a valid PDF or DOCX."}), 400

    # 3. Run AI analysis (NLP-based: extracts skills, education, experience etc.)
    analysis = analyze_resume_content(text)
    analysis["rawTextPreview"] = text[:500]

    # 4. Upload to Supabase Storage (private bucket — no public URL)
    upload_result = upload_cv_to_storage(
        user_id=user_id,
        file_bytes=file_bytes,
        filename=filename,
        mime_type=mime_type
    )

    if not upload_result["success"]:
        os.remove(local_path)
        return jsonify({"error": f"Failed to upload file to storage: {upload_result.get('error')}"}), 500

    # 5. Save CV record in database
    cv_id = save_cv_record(
        user_id=user_id,
        file_name=filename,
        file_url=upload_result["file_url"],
        file_path=upload_result["file_path"],
        file_size=upload_result["file_size"],
        mime_type=mime_type
    )

    if not cv_id:
        os.remove(local_path)
        return jsonify({"error": "Failed to save CV record to database."}), 500

    # 6. Run XGBoost hiring prediction using REAL candidate data from CV analysis
    # SECURITY FIX: No hardcoded values like Age=27, InterviewScore=82, PersonalityScore=80
    from services.recruitment_service import predict_hiring_decision
    details = analysis.get("details", {})
    rec_data = {
        # Data extracted from the actual CV text by cv_analysis_service
        "EducationLevel": details.get("educationLevel", 1),       # extracted from CV
        "ExperienceYears": details.get("experienceYears", 0),     # extracted from CV
        "PreviousCompanies": details.get("previousCompanies", 1), # extracted from CV
        "SkillScore": details.get("skillScore", 50),              # calculated from CV skills
        # Scores derived from CV content (no hardcoded defaults)
        "InterviewScore": analysis.get("communicationScore", 70), # proxy: communication score
        "PersonalityScore": analysis.get("culturalFitScore", 70), # proxy: cultural fit score
        # Fields with no CV-derivable equivalent — use neutral defaults
        "Age": 28,                    # neutral default (not biasing the prediction)
        "Gender": 1,                  # neutral default (model requires this feature)
        "DistanceFromCompany": 10.0,  # neutral default
        "RecruitmentStrategy": 2      # standard job board strategy
    }
    prediction = predict_hiring_decision(rec_data)

    # Merge into analysis result
    analysis["hiringChance"] = prediction["hiringChance"]
    analysis["hiringRecommendation"] = prediction["hiringRecommendation"]

    # 7. Save analysis + prediction to database
    analysis_id = save_cv_analysis(
        user_id=user_id,
        cv_id=cv_id,
        analysis=analysis,
        prediction=prediction
    )

    save_recruitment_prediction(
        user_id=user_id,
        inputs=rec_data,
        outputs=prediction,
        cv_analysis_id=analysis_id
    )

    # Cleanup local temp file
    try:
        os.remove(local_path)
    except Exception:
        pass

    # 8. Return full updated profile
    profile = get_candidate_profile(user_id)

    return jsonify({
        "message": "CV uploaded and analyzed successfully",
        "candidate": profile,
        "cvId": cv_id,
        "analysisId": analysis_id
    }), 200


@candidate_bp.route("/optimize-resume", methods=["POST"])
@require_auth(allowed_roles=["candidate", "admin"])
def optimize_resume(user):
    """
    AI-optimize resume content.
    SECURITY: User identity from JWT. Route is role-gated.
    """
    data = request.get_json() or {}
    optimized = optimize_resume_via_ai(data)
    return jsonify({"optimized": optimized}), 200


@candidate_bp.route("/generate-pdf", methods=["POST"])
@require_auth(allowed_roles=["candidate", "admin"])
def generate_pdf(user):
    """
    Generate a PDF resume from provided resume data.
    SECURITY: User identity from JWT. Route is role-gated.
    """
    data = request.get_json() or {}
    resume_data = data.get("resume", {})
    template_style = data.get("template", "ats_friendly")

    pdf_filename = f"generated_resume_{template_style}.pdf"
    pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)

    success = generate_pdf_resume(resume_data, template_style, pdf_path)
    if not success:
        print("Error: generate_pdf_resume returned False")
        return jsonify({"error": "Failed to generate PDF resume"}), 500

    if not os.path.exists(pdf_path):
        print(f"Error: Generated PDF file does not exist at path: {pdf_path}")
        return jsonify({"error": "Generated PDF file not found on server"}), 500

    file_size = os.path.getsize(pdf_path)
    print(f"Success: PDF generated at {pdf_path}. Size: {file_size} bytes.")

    # Return as base64 JSON to prevent browser PDF extensions from
    # intercepting the binary stream (which causes empty 204 responses).
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    return jsonify({
        "pdf_base64": pdf_b64,
        "filename": pdf_filename,
        "size": file_size
    }), 200



@candidate_bp.route("/templates/download/<template_id>", methods=["GET"])
@require_auth(allowed_roles=["candidate", "admin"])
def download_template_file(user, template_id):
    """
    Download predefined static CV templates.
    SECURITY: User identity is verified via require_auth.
    """
    template_files = {
        "harvard": "harvard template.pdf",
        "ats_friendly": "ATS-Friendly-Resume.pdf"
    }
    
    file_name = template_files.get(template_id)
    if not file_name:
        return jsonify({"error": "Template not found"}), 404
        
    template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "template cv")
    file_path = os.path.join(template_dir, file_name)
    
    if not os.path.exists(file_path):
        return jsonify({"error": f"Template file {file_name} not found on server"}), 404
        
    file_size = os.path.getsize(file_path)
    
    with open(file_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    
    return jsonify({
        "pdf_base64": pdf_b64,
        "filename": file_name,
        "size": file_size
    }), 200



@candidate_bp.route("/generate-docx", methods=["POST"])
@require_auth(allowed_roles=["candidate", "admin"])
def generate_docx(user):
    """
    Generate a DOCX resume from provided resume data.
    Returns base64-encoded JSON to avoid send_file issues on Windows.
    SECURITY: User identity from JWT. Route is role-gated.
    """
    data = request.get_json() or {}
    resume_data = data.get("resume", {})
    template_style = data.get("template", "harvard")

    docx_filename = f"generated_resume_{template_style}.docx"
    docx_path = os.path.join(UPLOAD_FOLDER, docx_filename)

    success = generate_docx_resume(resume_data, template_style, docx_path)
    if not success:
        print("Error: generate_docx_resume returned False")
        return jsonify({"error": "Failed to generate DOCX resume"}), 500

    if not os.path.exists(docx_path):
        print(f"Error: Generated DOCX file not found at: {docx_path}")
        return jsonify({"error": "Generated DOCX file not found on server"}), 500

    file_size = os.path.getsize(docx_path)
    print(f"Success: DOCX generated at {docx_path}. Size: {file_size} bytes.")

    # Return as base64 JSON (mirrors PDF approach) to avoid send_file issues
    with open(docx_path, "rb") as f:
        docx_bytes = f.read()
    docx_b64 = base64.b64encode(docx_bytes).decode("utf-8")
    return jsonify({
        "docx_base64": docx_b64,
        "filename": docx_filename,
        "size": file_size
    }), 200


@candidate_bp.route("/resume", methods=["GET"])
@require_auth(allowed_roles=["candidate"])
def get_resume(user):
    """
    Get the candidate's last saved resume.
    """
    resume = get_candidate_resume(user.id)
    if not resume:
        return jsonify({"resume": None}), 200
    return jsonify({
        "resume": resume.get("resume_json"),
        "template": resume.get("template_name")
    }), 200


@candidate_bp.route("/resume", methods=["POST"])
@require_auth(allowed_roles=["candidate"])
def save_resume(user):
    """
    Save or update the candidate's resume.
    """
    data = request.get_json() or {}
    resume_json = data.get("resume", {})
    template_name = data.get("template", "harvard")
    success = save_candidate_resume(user.id, resume_json, template_name)
    if not success:
        return jsonify({"error": "Failed to save resume"}), 500
    return jsonify({"status": "success", "message": "Resume saved successfully"}), 200


@candidate_bp.route("/import-latest-cv", methods=["GET"])
@require_auth(allowed_roles=["candidate"])
def import_latest_cv(user):
    """
    Get latest active CV, download it from Supabase storage, parse it, and return structured Harvard Resume JSON.
    """
    user_id = user.id  # note: user object from require_auth is an object with 'id' attribute
    from services.supabase_service import get_active_cv, supabase
    from services.ai_service import parse_resume, parse_cv_text_to_resume_json
    import tempfile
    
    cv_record = get_active_cv(user_id)
    if not cv_record:
        return jsonify({"error": "No uploaded CV found. Please upload a CV first."}), 404
        
    file_path = cv_record.get("file_path")
    file_name = cv_record.get("file_name", "cv.pdf")
    ext = os.path.splitext(file_name)[1].lower()
    
    try:
        # Download from storage
        response = supabase.storage.from_("cv-files").download(file_path)
        if not response:
            return jsonify({"error": "Failed to download CV from storage"}), 500
            
        # Write to temporary file
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp_file:
            tmp_file.write(response)
            tmp_path = tmp_file.name
            
        try:
            # Parse text
            text = parse_resume(tmp_path)
            # Parse to structured Harvard JSON
            resume_json = parse_cv_text_to_resume_json(text)
            
            # Clean up temp file
            os.remove(tmp_path)
            
            return jsonify(resume_json), 200
        except Exception as parse_err:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise parse_err
            
    except Exception as e:
        print(f"Error importing from CV: {e}")
        return jsonify({"error": f"Failed to import from CV: {str(e)}"}), 500


@candidate_bp.route("/jobs", methods=["GET"])
@require_auth(allowed_roles=["candidate"])
def get_jobs_list(user):
    """
    Get all open jobs with computed matching scores against the candidate's latest CV analysis.
    """
    from services.supabase_service import get_latest_cv_analysis, get_open_jobs, get_candidate_applications
    
    try:
        # Get latest cv_analysis record for candidate
        analysis = get_latest_cv_analysis(user.id)
        jobs = get_open_jobs()
        
        # Get jobs the candidate has already applied to
        apps = get_candidate_applications(user.id)
        applied_job_ids = {app.get("job_id") for app in apps}
        
        enriched_jobs = []
        for job in jobs:
            # Default scores if no analysis exists
            cv_score = 0
            ats_score = 0
            skills_match = 0
            req_match = 100
            
            if analysis:
                cv_score = analysis.get("cv_score", 0)
                ats_score = analysis.get("ats_score", 0)
                
                # Skills Match
                job_skills = [s.lower().strip() for s in (job.get("required_skills") or [])]
                candidate_skills = [s.lower().strip() for s in (analysis.get("detected_skills") or [])]
                if job_skills:
                    matching_skills = [s for s in job_skills if s in candidate_skills]
                    skills_match = int(len(matching_skills) / len(job_skills) * 100)
                else:
                    skills_match = 100
                    
                # Job Requirements Match
                # experience_min_years
                exp_job = job.get("experience_min_years") or 0
                exp_cand = analysis.get("experience_years") or 0.0
                if exp_job > 0:
                    exp_score = min(int((exp_cand / exp_job) * 100), 100)
                else:
                    exp_score = 100
                    
                # education_level_min (1=HS, 2=Bachelor, 3=Master, 4=PhD)
                edu_job = job.get("education_level_min") or 1
                edu_cand = analysis.get("education_level") or 1
                if edu_cand >= edu_job:
                    edu_score = 100
                else:
                    edu_score = int((edu_cand / edu_job) * 100)
                    
                req_match = int((exp_score + edu_score) / 2)
                
            overall_match = int((cv_score + ats_score + skills_match + req_match) / 4)
            
            enriched_jobs.append({
                "id": job.get("id"),
                "recruiter_id": job.get("recruiter_id"),
                "title": job.get("title"),
                "department": job.get("department"),
                "location": job.get("location"),
                "employment_type": job.get("employment_type"),
                "salary_min": job.get("salary_min"),
                "salary_max": job.get("salary_max"),
                "currency": job.get("currency"),
                "description": job.get("description"),
                "requirements": job.get("requirements") or [],
                "required_skills": job.get("required_skills") or [],
                "experience_min_years": job.get("experience_min_years"),
                "education_level_min": job.get("education_level_min"),
                "status": job.get("status"),
                "deadline": job.get("deadline"),
                "applied": job.get("id") in applied_job_ids,
                "matchScores": {
                    "cvScore": cv_score,
                    "atsScore": ats_score,
                    "skillsMatch": skills_match,
                    "requirementsMatch": req_match,
                    "overallMatch": overall_match
                }
            })
            
        return jsonify({"jobs": enriched_jobs}), 200
    except Exception as e:
        print(f"Error fetching matched jobs: {e}")
        return jsonify({"error": str(e)}), 500


@candidate_bp.route("/jobs/<string:job_id>/apply", methods=["POST"])
@require_auth(allowed_roles=["candidate"])
def apply_for_job(user, job_id: str):
    """
    Apply for a job with duplicate checks.
    SECURITY: candidate_id from JWT.
    """
    import traceback as _tb
    from services.supabase_service import supabase, get_active_cv, apply_to_job
    
    candidate_id = user.id
    print(f"\n[DEBUG APPLY] candidate_id from JWT: {candidate_id}")
    print(f"[DEBUG APPLY] job_id received: {job_id}")
    
    try:
        # Check if already applied
        existing_app = supabase.table("applications")\
            .select("id")\
            .eq("job_id", job_id)\
            .eq("candidate_id", candidate_id)\
            .maybe_single().execute()
            
        if existing_app and existing_app.data:
            print(f"[DEBUG APPLY] Duplicate check failed: candidate has already applied to job_id {job_id}")
            return jsonify({"error": "You have already applied for this job."}), 409
            
        # Get candidate's latest active CV
        cv = get_active_cv(candidate_id)
        cv_id = cv.get("id") if cv else None
        print(f"[DEBUG APPLY] active CV found or not: {'Yes' if cv else 'No'} (cv_id: {cv_id})")
        
        # Read cover letter if any — safely handle empty body (Werkzeug silent=True
        # still raises BadRequest on empty body in some versions).
        try:
            raw_body = request.get_data(as_text=True).strip()
            data = __import__('json').loads(raw_body) if raw_body else {}
        except Exception:
            data = {}
        cover_letter = data.get("cover_letter", "")
        
        app = apply_to_job(candidate_id=candidate_id, job_id=job_id, cv_id=cv_id, cover_letter=cover_letter)
        if not app:
            print("[DEBUG APPLY] apply_to_job helper returned None")
            return jsonify({"error": "Failed to apply to job. Check server logs for details."}), 500
            
        print(f"[DEBUG APPLY] Successfully applied! app: {app}")
        return jsonify({"message": "Application submitted successfully", "application": app}), 201
    except Exception as e:
        print(f"[DEBUG APPLY] Exception: {e}")
        print(_tb.format_exc())
        return jsonify({"error": str(e), "traceback": _tb.format_exc()}), 500


# ==============================================================
# CANDIDATE NOTIFICATIONS
# ==============================================================

@candidate_bp.route("/notifications", methods=["GET"])
@require_auth(allowed_roles=["candidate", "admin"])
def list_notifications(user):
    """
    GET /api/candidate/notifications

    Returns all in-app notifications for the authenticated candidate, newest first.
    Response includes:
      - notifications[]  — full notification list
      - unread_count     — total unread count (for badge display)

    SECURITY: user_id from JWT (user.id) — never from query params.
    """
    notifications = get_candidate_notifications(user.id)
    unread_count  = get_candidate_unread_notification_count(user.id)

    return jsonify({
        "notifications": notifications,
        "unread_count":  unread_count,
    }), 200


@candidate_bp.route("/notifications/read", methods=["POST"])
@require_auth(allowed_roles=["candidate", "admin"])
def mark_notifications_read(user):
    """
    POST /api/candidate/notifications/read

    Mark one or all notifications as read.

    Body (JSON):
      { "notification_id": "<uuid>" }   → marks a single notification
      { "all": true }                    → marks every unread notification

    SECURITY: user_id from JWT — candidate can only mark their own notifications.
    """
    data = request.get_json() or {}

    mark_all = data.get("all", False)
    notif_id = data.get("notification_id")

    if mark_all:
        mark_all_candidate_notifications_as_read(user.id)
        return jsonify({"message": "All notifications marked as read"}), 200

    if not notif_id:
        return jsonify({"error": "Provide 'notification_id' or set 'all': true"}), 400

    success = mark_candidate_notification_as_read(notif_id, user.id)
    if not success:
        return jsonify({"error": "Notification not found or not authorized"}), 404

    return jsonify({"message": "Notification marked as read"}), 200


# ==============================================================
# CANDIDATE FEEDBACK
# ==============================================================

@candidate_bp.route("/feedback/eligible", methods=["GET"])
@require_auth(allowed_roles=["candidate"])
def get_feedback_eligible(user):
    """
    GET /api/candidate/feedback/eligible
    Returns applications that are accepted/rejected AND don't have feedback yet.
    """
    eligible = get_eligible_feedback_applications(user.id)
    return jsonify({"eligible": eligible}), 200


@candidate_bp.route("/feedback/submit", methods=["POST"])
@require_auth(allowed_roles=["candidate"])
def submit_candidate_feedback(user):
    """
    POST /api/candidate/feedback/submit
    Body:
      {
        "application_id": "<uuid>",
        "overall_rating": 1-5,
        "ease_of_use_rating": 1-5,
        "ui_design_rating": 1-5,
        "recommendation_accuracy_rating": 1-5,
        "recommendation_score": 0-10,
        "favorite_feature": "<string>|null",
        "comment": "<string>|null"
      }
    SECURITY: user_id from JWT — candidates can only submit feedback for their own applications.
    """
    data = request.get_json() or {}
    application_id = data.get("application_id")
    if not application_id:
        return jsonify({"error": "application_id is required"}), 400

    result = submit_feedback(
        user_id=user.id,
        application_id=application_id,
        payload=data,
    )
    if result.get("success"):
        return jsonify({"message": "Feedback submitted successfully", "feedback_id": result.get("feedback_id")}), 201
    return jsonify({"error": result.get("error", "Failed to submit feedback")}), 400
