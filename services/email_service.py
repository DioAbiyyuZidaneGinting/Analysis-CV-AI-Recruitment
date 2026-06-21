import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader, select_autoescape

load_dotenv()

# ─── SMTP Configuration ────────────────────────────────────────────────────────
MAIL_SERVER   = os.environ.get("MAIL_SERVER",   "smtp.gmail.com")
MAIL_PORT     = int(os.environ.get("MAIL_PORT", 587))
MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "talentlensai.system@gmail.com")
MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
MAIL_USE_TLS  = os.environ.get("MAIL_USE_TLS",  "True").lower() in ("true", "1", "yes")
APP_URL       = os.environ.get("APP_URL", "http://localhost:5173")

# ─── Jinja2 template environment ───────────────────────────────────────────────
_TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "email_templates")
_jinja_env = Environment(
    loader=FileSystemLoader(_TEMPLATE_DIR),
    autoescape=select_autoescape(["html"]),
)

# ─── Logo Path ────────────────────────────────────────────────────────────────
_LOGO_PATH = os.path.join(os.path.dirname(__file__), "..", "logo", "logo.png")

# ─── Subject Mapping ──────────────────────────────────────────────────────────
SUBJECT_MAP = {
    "screening": "Your Application Has Moved to Screening ✅",
    "interview": "Interview Invitation — You've Been Selected 🎤",
    "offered":   "Congratulations! A Job Offer Awaits You 🎉",
    "accepted":  "Welcome Aboard! You Have Been Accepted 🏆",
    "rejected":  "Application Status Update",
}

# ─── Per-status visual configuration ─────────────────────────────────────────
STATUS_CONFIG = {
    "screening": {
        "status_label":           "Under Screening",
        "hero_headline":          "You're Being Reviewed",
        "hero_subtext":           "Great news! Your application has moved to the Screening stage. Our recruitment team is carefully reviewing your profile.",
        "hero_text_color":        "#111827",
        "hero_subtext_color":     "#4b5563",
        "accent_color":           "#F97316", # Screening color (Orange)
        "badge_bg":               "#ffedd5", # Light Orange
        "badge_color":            "#c2410c", # Dark Orange
        "cta_label":              "View Application",
        "cta_bg":                 "#DC2626", # Primary Red
        "cta_text_color":         "#ffffff",
        "cta_shadow":             "rgba(220,38,38,0.15)",
        "msg_card_label":         "What happens next?",
        "msg_card_gradient_start":"#fff7ed", # Very Light Orange
        "msg_card_gradient_end":  "#ffedd5",
        "msg_label_color":        "#F97316",
        "msg_text_color":         "#374151",
        "preview_text":           "Your application is now under screening.",
        "features": [
            {"emoji": "📋", "title": "Profile Review",       "desc": "We're carefully reading your resume and cover letter."},
            {"emoji": "🎯", "title": "Skills Matching",      "desc": "Your skills are being matched against job requirements."},
            {"emoji": "👤", "title": "Recruiter Review",     "desc": "A dedicated recruiter is evaluating your profile."},
            {"emoji": "📊", "title": "Progress Tracking",    "desc": "Log in anytime to track your application status."},
        ],
        "pipeline_current": "screening",
    },
    "interview": {
        "status_label":           "Interview Invitation",
        "hero_headline":          "You're Invited to Interview",
        "hero_subtext":           "Outstanding! Your application has advanced to the Interview stage. Our hiring team is excited to learn more about you.",
        "hero_text_color":        "#111827",
        "hero_subtext_color":     "#4b5563",
        "accent_color":           "#DC2626", # Interview color (Primary Red)
        "badge_bg":               "#FEE2E2", # Light Red
        "badge_color":            "#991B1B", # Dark Red
        "cta_label":              "Go to Dashboard",
        "cta_bg":                 "#DC2626", # Primary Red
        "cta_text_color":         "#ffffff",
        "cta_shadow":             "rgba(220,38,38,0.15)",
        "msg_card_label":         "Interview Invitation",
        "msg_card_gradient_start":"#fef2f2", # Very Light Red
        "msg_card_gradient_end":  "#fee2e2",
        "msg_label_color":        "#DC2626",
        "msg_text_color":         "#1f2937",
        "preview_text":           "You have been invited for an interview.",
        "features": [
            {"emoji": "📅", "title": "Interview Details",    "desc": "Our team will contact you to schedule date & time."},
            {"emoji": "📝", "title": "Preparation Tips",     "desc": "Research the role and prepare your answers in advance."},
            {"emoji": "🤝", "title": "Hiring Team",          "desc": "You'll meet the people who will work with you every day."},
            {"emoji": "⏭️", "title": "Next Steps",           "desc": "After the interview, we'll provide feedback within 3–5 days."},
        ],
        "pipeline_current": "interview",
    },
    "offered": {
        "status_label":           "Job Offer",
        "hero_headline":          "You Have an Offer",
        "hero_subtext":           "Congratulations! We are pleased to extend a formal job offer to you. Please log in to review the full offer details.",
        "hero_text_color":        "#111827",
        "hero_subtext_color":     "#374151",
        "accent_color":           "#B91C1C", # Offered color (Dark Red)
        "badge_bg":               "#FEE2E2", # Light Red
        "badge_color":            "#991B1B", # Dark Red
        "cta_label":              "Review Your Offer",
        "cta_bg":                 "#DC2626", # Primary Red
        "cta_text_color":         "#ffffff",
        "cta_shadow":             "rgba(220,38,38,0.15)",
        "msg_card_label":         "Your Offer Awaits",
        "msg_card_gradient_start":"#fef2f2", # Very Light Red
        "msg_card_gradient_end":  "#fee2e2",
        "msg_label_color":        "#B91C1C",
        "msg_text_color":         "#1f2937",
        "preview_text":           "A job offer has been extended to you. Log in to review.",
        "features": [
            {"emoji": "💰", "title": "Compensation",         "desc": "Review your salary and benefits package in the portal."},
            {"emoji": "📅", "title": "Start Date",           "desc": "Your proposed start date is included in the offer."},
            {"emoji": "📋", "title": "Contract Details",     "desc": "Read through your contract and employment terms."},
            {"emoji": "✍️", "title": "Accept or Decline",   "desc": "Log in to formally accept or decline this offer."},
        ],
        "pipeline_current": "offered",
    },
    "accepted": {
        "status_label":           "🎉 Accepted",
        "hero_headline":          "Congratulations",
        "hero_subtext":           "We are absolutely thrilled to welcome you to the TalentLens AI team! Your journey with us starts now. Our team will contact you shortly with onboarding details.",
        "hero_text_color":        "#111827",
        "hero_subtext_color":     "#374151",
        "accent_color":           "#16A34A", # Accepted color (Green)
        "badge_bg":               "#dcfce7", # Light Green
        "badge_color":            "#15803d", # Dark Green
        "cta_label":              "Go to Dashboard",
        "cta_bg":                 "#DC2626", # Primary Red
        "cta_text_color":         "#ffffff",
        "cta_shadow":             "rgba(220,38,38,0.15)",
        "msg_card_label":         "Welcome to the Team! 🎊",
        "msg_card_gradient_start":"#f0fdf4", # Very Light Green
        "msg_card_gradient_end":  "#dcfce7",
        "msg_label_color":        "#16A34A",
        "msg_text_color":         "#1f2937",
        "preview_text":           "You have been accepted! Welcome to the team.",
        "features": [
            {"emoji": "🔔", "title": "Stay Updated",         "desc": "Check your dashboard for onboarding instructions."},
            {"emoji": "🚀", "title": "Onboarding",           "desc": "Our HR team will guide you through your first days."},
            {"emoji": "🤝", "title": "Great Team",           "desc": "You're joining an amazing group of professionals."},
            {"emoji": "✨", "title": "Exciting Journey",     "desc": "Prepare for a fulfilling and exciting career ahead!"},
        ],
        "pipeline_current": "accepted",
    },
    "rejected": {
        "status_label":           "Application Update",
        "hero_headline":          "Thank You for Applying",
        "hero_subtext":           "After careful consideration, we have decided to move forward with other candidates at this time. We truly appreciate the time and effort you invested in your application.",
        "hero_text_color":        "#111827",
        "hero_subtext_color":     "#4b5563",
        "accent_color":           "#DC2626", # Rejected color (Red)
        "badge_bg":               "#FEE2E2", # Light Red
        "badge_color":            "#991B1B", # Dark Red
        "cta_label":              "View Other Openings",
        "cta_bg":                 "#374151", # Professional Dark Gray
        "cta_text_color":         "#ffffff",
        "cta_shadow":             "rgba(55,65,81,0.15)",
        "msg_card_label":         "A Note from Our Team",
        "msg_card_gradient_start":"#fafafa",
        "msg_card_gradient_end":  "#f4f4f5",
        "msg_label_color":        "#6b7280",
        "msg_text_color":         "#374151",
        "preview_text":           "An update on your application status.",
        "features": [
            {"emoji": "🙏", "title": "Thank You",            "desc": "We deeply appreciate your interest in joining our team."},
            {"emoji": "💡", "title": "Keep Growing",         "desc": "Continue building your skills for future opportunities."},
            {"emoji": "🔍", "title": "Other Openings",       "desc": "Check out other open positions that may be a good fit."},
            {"emoji": "🌱", "title": "Stay Connected",       "desc": "Follow us for future job openings and company updates."},
        ],
        "pipeline_current": "rejected",
    },
}

# ─── Pipeline steps definition ────────────────────────────────────────────────
_PIPELINE_STAGES = ["submitted", "screening", "interview", "offered", "accepted"]
_PIPELINE_LABELS = {
    "submitted": "Applied",
    "screening": "Screening",
    "interview": "Interview",
    "offered":   "Offered",
    "accepted":  "Accepted",
}

def _build_pipeline_steps(current_status: str) -> list[dict]:
    """Build the pipeline step dicts for the progress tracker."""
    if current_status == "rejected":
        # Show all stages as not reached, with a rejected indicator
        return [
            {
                "label":   _PIPELINE_LABELS[s],
                "past":    False,
                "current": False,
            }
            for s in _PIPELINE_STAGES
        ]

    current_idx = _PIPELINE_STAGES.index(current_status) if current_status in _PIPELINE_STAGES else 0
    steps = []
    for i, stage in enumerate(_PIPELINE_STAGES):
        steps.append({
            "label":   _PIPELINE_LABELS[stage],
            "past":    i < current_idx,
            "current": i == current_idx,
        })
    return steps


# ─── Template renderer ────────────────────────────────────────────────────────
def render_email_template(status: str, context: dict) -> str:
    """Render the base.html template with status-specific config + candidate context."""
    cfg = STATUS_CONFIG.get(status, STATUS_CONFIG["screening"])
    template = _jinja_env.get_template("base.html")

    render_ctx = {
        # Status visual config
        **cfg,
        # Candidate / job context
        "candidate_name":  context.get("candidate_name", "Candidate"),
        "job_title":       context.get("job_title", "the position"),
        "department":      context.get("department", "—"),
        "company_name":    context.get("company_name", "TalentLens AI"),
        "employment_type": context.get("employment_type", "Full-time"),
        "location":        context.get("location", "—"),
        "message":         context.get("message", cfg.get("hero_subtext", "")),
        "login_url":       context.get("login_url", "http://localhost:5173"),
        # Shared
        "email_subject":   SUBJECT_MAP.get(status, "Application Status Update"),
        "pipeline_steps":  _build_pipeline_steps(status),
    }
    return template.render(**render_ctx)


# ─── Per-status message text ──────────────────────────────────────────────────
def _get_status_message(status: str, candidate_name: str, job_title: str, company: str) -> str:
    msgs = {
        "screening": (
            f"Hello {candidate_name}, your application for {job_title} at {company} has entered the Screening stage. "
            "Our recruitment team is carefully reviewing your profile and qualifications. "
            "We will notify you as soon as there are further updates. Thank you for your patience!"
        ),
        "interview": (
            f"Hello {candidate_name}, fantastic news! Your application for {job_title} at {company} has advanced to the Interview stage. "
            "Our hiring team is eager to meet you and learn more about your experience. "
            "A member of our team will reach out to you shortly to schedule your interview. Please log in to your dashboard for updates."
        ),
        "offered": (
            f"Hello {candidate_name}, we are thrilled to inform you that {company} has extended a formal job offer for the position of {job_title}. "
            "Please log in to your candidate dashboard to review the complete offer details, including your compensation package and start date. "
            "We look forward to welcoming you on board!"
        ),
        "accepted": (
            f"Welcome, {candidate_name}! 🎊 We are absolutely delighted to confirm your acceptance to the {job_title} role at {company}. "
            "You are officially part of the team! Our HR department will reach out to you within the next 1–2 business days "
            "with onboarding instructions, contract details, and your first-day schedule. Congratulations and welcome aboard!"
        ),
        "rejected": (
            f"Dear {candidate_name}, thank you so much for your interest in the {job_title} position at {company} "
            "and for the time you invested in the application process. After careful review of all candidates, "
            "we have decided to move forward with another applicant whose experience more closely matches our current needs. "
            "We genuinely appreciate your effort and encourage you to apply for future openings that match your profile. "
            "We wish you every success in your career journey."
        ),
    }
    return msgs.get(status, msgs["screening"])


# ─── Logging helper ───────────────────────────────────────────────────────────
def log_email_delivery(
    application_id: str,
    recipient_email: str,
    notification_type: str,
    delivery_status: str,
    error_message: str = None,
):
    """Inserts a record into the email_logs table for audit trail."""
    from services.supabase_service import supabase
    try:
        payload = {
            "application_id":    application_id,
            "recipient_email":   recipient_email,
            "notification_type": notification_type,
            "delivery_status":   delivery_status,
            "error_message":     error_message,
        }
        supabase.table("email_logs").insert(payload).execute()
        print(f"[email_service] Logged: recipient={recipient_email}, status={delivery_status}")
    except Exception as log_err:
        print(f"[email_service] Critical: Error writing to email_logs: {log_err}")


# ─── Main send function ───────────────────────────────────────────────────────
def send_status_change_email(
    candidate_id: str,
    application_id: str,
    job_id: str,
    new_status: str,
    job_title: str = None,
) -> bool:
    """
    Sends a premium HTML notification email to the candidate when their
    application status changes. Prevents duplicates by checking email_logs.
    Records delivery status AND any SMTP error message.
    """
    from services.supabase_service import supabase

    # 1. Duplicate prevention
    try:
        existing = (
            supabase.table("email_logs")
            .select("id")
            .eq("application_id", application_id)
            .eq("notification_type", new_status)
            .eq("delivery_status", "success")
            .execute()
        )
        if existing and existing.data:
            print(f"[email_service] Duplicate skipped: app={application_id}, status={new_status}")
            return True
    except Exception as dupe_err:
        print(f"[email_service] Warn: duplicate check failed: {dupe_err}")

    # 2. Fetch candidate info
    try:
        cand_res = (
            supabase.table("users")
            .select("email, first_name, last_name")
            .eq("id", candidate_id)
            .maybe_single()
            .execute()
        )
        if not cand_res or not cand_res.data:
            print(f"[email_service] Candidate not found: {candidate_id}")
            return False
        recipient_email  = cand_res.data.get("email")
        candidate_name   = f"{cand_res.data.get('first_name', '')} {cand_res.data.get('last_name', '')}".strip()
    except Exception as e:
        print(f"[email_service] Error fetching candidate: {e}")
        return False

    if not recipient_email:
        print(f"[email_service] Candidate has no email.")
        return False

    # 3. Fetch job details
    company    = "TalentLens AI"
    department = ""
    location   = ""
    employment_type = "Full-time"

    try:
        job_res = (
            supabase.table("jobs")
            .select("title, department, location, employment_type")
            .eq("id", job_id)
            .maybe_single()
            .execute()
        )
        if job_res and job_res.data:
            if not job_title:
                job_title       = job_res.data.get("title", "the position")
            department          = job_res.data.get("department", "")
            location            = job_res.data.get("location", "")
            employment_type     = job_res.data.get("employment_type", "Full-time")
    except Exception as je:
        print(f"[email_service] Error fetching job: {je}")
        job_title = job_title or "the position"

    # 4. Build context for template rendering
    subject = SUBJECT_MAP.get(new_status, "Application Status Update")
    message = _get_status_message(new_status, candidate_name, job_title or "the position", company)

    # Build feedback URL for terminal statuses
    feedback_url = None
    if new_status in ("accepted", "rejected"):
        feedback_url = f"{APP_URL}/candidate/feedback?application_id={application_id}"

    template_context = {
        "candidate_name":  candidate_name,
        "job_title":       job_title or "the position",
        "department":      department or "—",
        "company_name":    company,
        "employment_type": employment_type or "Full-time",
        "location":        location or "—",
        "message":         message,
        "login_url":       APP_URL,
        "feedback_url":    feedback_url,
    }

    # 5. Render HTML and plaintext
    try:
        html_body = render_email_template(new_status, template_context)
    except Exception as tmpl_err:
        print(f"[email_service] Template render error: {tmpl_err}")
        # Fallback to basic HTML
        html_body = f"<html><body><p>Hello {candidate_name},</p><p>{message}</p></body></html>"

    plain_body = (
        f"Hello {candidate_name},\n\n"
        f"{message}\n\n"
        f"Position: {job_title}\n"
        f"Company: {company}\n"
        f"Status: {new_status.capitalize()}\n\n"
        f"Log in: {APP_URL}\n"
    )
    if feedback_url:
        plain_body += (
            f"\n--- Share Your Experience ---\n"
            f"We'd love to hear about your experience with TalentLens AI.\n"
            f"Leave feedback: {feedback_url}\n"
        )
    plain_body += "\nBest regards,\nTalentLens AI Recruiting Team"

    # 6. Build MIME message (Standard alternative structure with public hosted logo)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"TalentLens AI <{MAIL_USERNAME}>"
    msg["To"]      = recipient_email
    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body,  "html"))

    # 7. Send via SMTP
    try:
        if not MAIL_USERNAME or not MAIL_PASSWORD:
            raise ValueError("MAIL_USERNAME or MAIL_PASSWORD not set.")

        if MAIL_PORT == 465:
            server = smtplib.SMTP_SSL(MAIL_SERVER, MAIL_PORT, timeout=10)
        else:
            server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT, timeout=10)
            server.ehlo()
            if MAIL_USE_TLS:
                server.starttls()
                server.ehlo()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_USERNAME, recipient_email, msg.as_string())
        server.quit()

        log_email_delivery(
            application_id=application_id,
            recipient_email=recipient_email,
            notification_type=new_status,
            delivery_status="success",
            error_message=None,
        )
        print(f"[email_service] ✅ Email sent: {recipient_email} ({new_status})")
        return True

    except Exception as smtp_err:
        error_msg = str(smtp_err)
        print(f"[email_service] ❌ SMTP error: {error_msg}")
        log_email_delivery(
            application_id=application_id,
            recipient_email=recipient_email,
            notification_type=new_status,
            delivery_status="failed",
            error_message=error_msg,
        )
        return False
