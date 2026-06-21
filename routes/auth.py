"""
Authentication routes using Supabase Auth.
Replaces db.json flat-file auth with real Supabase user management.
Includes Google OAuth user synchronization endpoint.
"""
import os
from flask import Blueprint, request, jsonify
from services.supabase_service import register_user, login_user

auth_bp = Blueprint("auth", __name__)

APP_URL = os.environ.get("APP_URL", "https://talentlens-ai.vercel.app")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role")  # optional role hint from frontend

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    result = login_user(email, password)

    if not result["success"]:
        return jsonify({"error": result.get("error", "Invalid email or password")}), 401

    user = result["user"]

    # Optional: Validate role matches what the UI sent
    if role and user.get("role") != role:
        return jsonify({
            "error": f"Role mismatch. This account is registered as '{user.get('role')}', "
                     f"not '{role}'."
        }), 400

    return jsonify({
        "message": "Login successful",
        "access_token": result.get("access_token"),
        "refresh_token": result.get("refresh_token"),
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "firstName": user["firstName"],
            "lastName": user["lastName"]
        }
    }), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    print("FRONTEND REGISTER PAYLOAD:", data)
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "candidate")
    first_name = data.get("firstName", "").strip()
    last_name = data.get("lastName", "").strip()

    if not email or not password:
        print("FRONTEND REGISTER RESPONSE: Email and password are required. HTTP 400")
        return jsonify({"error": "Email and password are required"}), 400

    if role not in ("candidate", "recruiter", "admin"):
        print("FRONTEND REGISTER RESPONSE: Invalid role. HTTP 400")
        return jsonify({"error": "Invalid role. Must be 'candidate' or 'recruiter'."}), 400

    if len(password) < 6:
        print("FRONTEND REGISTER RESPONSE: Password too short. HTTP 400")
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    result = register_user(
        email=email,
        password=password,
        role=role,
        first_name=first_name,
        last_name=last_name
    )

    if not result["success"]:
        error = result.get("error", "Registration failed")
        if "already registered" in error.lower() or "already exists" in error.lower():
            print("FRONTEND REGISTER RESPONSE: Account already exists. HTTP 400")
            return jsonify({"error": "An account with this email already exists."}), 400
        print(f"FRONTEND REGISTER RESPONSE: {error}. HTTP 400")
        return jsonify({"error": error}), 400

    print("FRONTEND REGISTER RESPONSE: Success. HTTP 201")
    return jsonify({
        "message": "Registration successful. Please check your email to confirm your account.",
        "user": result["user"],
        "access_token": result.get("access_token"),
        "refresh_token": result.get("refresh_token")
    }), 201


@auth_bp.route("/refresh", methods=["POST"])
def refresh_token():
    """Exchange a Supabase refresh_token for a new access_token."""
    from services.supabase_service import supabase_anon
    data = request.get_json() or {}
    refresh_tok = data.get("refresh_token", "").strip()

    if not refresh_tok:
        return jsonify({"error": "refresh_token is required"}), 400

    try:
        result = supabase_anon.auth.refresh_session(refresh_tok)
        if not result or not result.session:
            return jsonify({"error": "Failed to refresh session"}), 401

        return jsonify({
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "expires_in": result.session.expires_in,
        }), 200
    except Exception as e:
        print(f"Token refresh error: {e}")
        return jsonify({"error": "Token refresh failed", "details": str(e)}), 401


@auth_bp.route("/sync-oauth-user", methods=["POST"])
def sync_oauth_user():
    """
    Called by the frontend after a successful OAuth callback.

    Responsibilities:
    1. Validate the Supabase access token from the Authorization header.
    2. Look up our `users` table by email.
    3. If the user already exists  → return the existing record, preserving role.
    4. If the user is new          → create a record with role=candidate.
    5. Return { user: { id, email, role, firstName, lastName } }

    SECURITY: user identity is taken from the validated Supabase JWT,
              never from the request body.
    """
    from services.supabase_service import supabase, supabase_anon

    # ── 1. Validate the access token ──────────────────────────────────────────
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing Authorization header"}), 401

    access_token = auth_header.split(" ", 1)[1].strip()

    try:
        user_resp = supabase_anon.auth.get_user(access_token)
        if not user_resp or not user_resp.user:
            return jsonify({"error": "Invalid or expired token"}), 401
        auth_user = user_resp.user
    except Exception as e:
        print(f"[sync-oauth-user] Token validation error: {e}")
        return jsonify({"error": "Token validation failed", "details": str(e)}), 401

    email = auth_user.email
    if not email:
        return jsonify({"error": "OAuth account has no email address"}), 400

    # Determine provider dynamically
    provider = None
    if auth_user.app_metadata:
        provider = auth_user.app_metadata.get("provider")
    if not provider and auth_user.identities:
        for identity in auth_user.identities:
            if identity.provider:
                provider = identity.provider
                break
    if provider:
        provider = provider.lower()
    if provider not in ("google", "github"):
        provider = "google"

    # Extract name from provider metadata
    user_meta = auth_user.user_metadata or {}
    full_name  = user_meta.get("full_name") or user_meta.get("name") or ""
    if not full_name and user_meta.get("login"):
        full_name = user_meta.get("login")
        
    first_name = user_meta.get("given_name") or (full_name.split()[0] if full_name else "")
    last_name  = user_meta.get("family_name") or (" ".join(full_name.split()[1:]) if full_name else "")

    if not first_name:
        first_name = full_name

    print(f"[sync-oauth-user] email={email} provider={provider} full_name='{full_name}' auth_id={auth_user.id}")

    # ── 2. Look up existing record by email ───────────────────────────────────
    try:
        existing = supabase.table("users") \
            .select("id, email, role, first_name, last_name") \
            .eq("email", email) \
            .maybe_single().execute()
    except Exception as e:
        print(f"[sync-oauth-user] DB lookup error: {e}")
        return jsonify({"error": "Database error during user lookup"}), 500

    raw = existing.data if existing else None
    if isinstance(raw, list):
        raw = raw[0] if raw else None

    if raw:
        # ── 3. User exists — reuse it, preserving role (never overwrite recruiter role) ───
        print(f"[sync-oauth-user] Existing user found: id={raw['id']} role={raw['role']}")

        # Backfill name if the DB record has empty fields (e.g. trigger inserted without metadata)
        db_first = raw.get("first_name") or ""
        db_last  = raw.get("last_name")  or ""
        if (not db_first.strip()) and first_name:
            print(f"[sync-oauth-user] Backfilling name: '{first_name}' '{last_name}'")
            try:
                supabase.table("users").update({
                    "first_name": first_name,
                    "last_name":  last_name,
                }).eq("id", raw["id"]).execute()
                db_first = first_name
                db_last  = last_name
            except Exception as upd_err:
                print(f"[sync-oauth-user] Name backfill failed (non-fatal): {upd_err}")

        return jsonify({
            "user": {
                "id": raw["id"],
                "email": raw["email"],
                "role": raw.get("role", "candidate"),
                "firstName": db_first,
                "lastName": db_last,
            }
        }), 200

    # ── 4. New user — create record ───────────────────────────────────────────
    # Use the Supabase auth UUID as the primary key so it aligns with auth.users
    try:
        insert_res = supabase.table("users").insert({
            "id": auth_user.id,          # match auth.users.id
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "role": "candidate",          # default role for OAuth sign-ups
        }).execute()
        new_row = insert_res.data[0] if insert_res.data else {}
        db_role = new_row.get("role", "candidate")
        db_first = new_row.get("first_name", first_name)
        db_last = new_row.get("last_name", last_name)
    except Exception as e:
        # Handle race condition: another request already inserted this user
        err_str = str(e)
        if "duplicate" in err_str.lower() or "unique" in err_str.lower() or "23505" in err_str:
            print(f"[sync-oauth-user] Race condition — user already inserted, fetching…")
            try:
                retry = supabase.table("users") \
                    .select("id, email, role, first_name, last_name") \
                    .eq("email", email) \
                    .maybe_single().execute()
                raw2 = retry.data if retry else None
                if isinstance(raw2, list):
                    raw2 = raw2[0] if raw2 else None
                if raw2:
                    return jsonify({
                        "user": {
                            "id": raw2["id"],
                            "email": raw2["email"],
                            "role": raw2.get("role", "candidate"),
                            "firstName": raw2.get("first_name", ""),
                            "lastName": raw2.get("last_name", ""),
                        }
                    }), 200
            except Exception:
                pass
        print(f"[sync-oauth-user] Insert error: {e}")
        return jsonify({"error": "Failed to create user record", "details": str(e)}), 500

    print(f"[sync-oauth-user] New user created: id={auth_user.id} email={email}")

    return jsonify({
        "user": {
            "id": auth_user.id,
            "email": email,
            "role": db_role,
            "firstName": db_first,
            "lastName": db_last,
        }
    }), 201


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """
    Sends a branded password reset email via Brevo.
    Uses Supabase's resetPasswordForEmail to generate a secure token,
    then sends our own branded email with the reset link.
    """
    from services.supabase_service import supabase_anon, supabase
    from services.email_service import send_password_reset_email

    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Email address is required."}), 400

    # Always return success to prevent email enumeration attacks
    try:
        # Look up the user in our users table
        user_res = (
            supabase.table("users")
            .select("id, email, first_name, last_name")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        user_row = user_res.data if user_res else None
        if isinstance(user_row, list):
            user_row = user_row[0] if user_row else None

        if user_row:
            first_name = user_row.get("first_name") or "there"
            recipient_name = f"{first_name} {user_row.get('last_name', '')}".strip() or first_name

            # Build the redirect URL that Supabase will forward the user to after verification
            redirect_to = f"{APP_URL}/reset-password"

            # Generate the recovery/reset link via Supabase Auth Admin API.
            # This avoids Supabase sending its own unbranded email, returning the link instead.
            link_res = supabase.auth.admin.generate_link({
                "email": email,
                "type": "recovery",
                "options": {
                    "redirect_to": redirect_to
                }
            })

            action_link = None
            if hasattr(link_res, "properties") and hasattr(link_res.properties, "action_link"):
                action_link = link_res.properties.action_link
            elif isinstance(link_res, dict):
                action_link = link_res.get("properties", {}).get("action_link") or link_res.get("action_link")

            if not action_link:
                print(f"[forgot-password] Failed to generate recovery link. Response: {link_res}")
                raise RuntimeError("Failed to retrieve action link from Supabase.")

            print(f"[forgot-password] Supabase reset link generated for {email}.")

            # Send our custom branded email via Brevo containing the secure action link
            send_password_reset_email(email, recipient_name, action_link)
        else:
            print(f"[forgot-password] Email not found: {email} (silent ignore)")

    except Exception as e:
        print(f"[forgot-password] Error: {e}")
        # Still return success to prevent enumeration

    return jsonify({
        "message": "If an account with that email exists, a password reset link has been sent."
    }), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Resets the user's password using a Supabase access token obtained from
    the #access_token hash fragment after clicking the reset link.
    """
    from services.supabase_service import supabase_anon

    data = request.get_json() or {}
    access_token = data.get("access_token", "").strip()
    new_password = data.get("new_password", "")

    if not access_token or not new_password:
        return jsonify({"error": "access_token and new_password are required."}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    try:
        # Set the session using the recovery token
        session_res = supabase_anon.auth.set_session(access_token, "")
        if not session_res or not session_res.session:
            return jsonify({"error": "Invalid or expired reset link. Please request a new one."}), 401

        # Update the password
        update_res = supabase_anon.auth.update_user({"password": new_password})
        if not update_res or not update_res.user:
            return jsonify({"error": "Failed to update password. Please try again."}), 500

        print(f"[reset-password] Password updated for user {update_res.user.email}")
        return jsonify({"message": "Password updated successfully."}), 200

    except Exception as e:
        print(f"[reset-password] Error: {e}")
        return jsonify({"error": "Failed to reset password. Please request a new reset link.", "details": str(e)}), 500
