import os
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory, render_template
from flask_cors import CORS

load_dotenv()
from routes.auth import auth_bp
from routes.candidate import candidate_bp
from routes.recruiter import recruiter_bp

app = Flask(
    __name__,
    static_folder="static",
    template_folder="templates"
)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(candidate_bp, url_prefix="/api/candidate")
app.register_blueprint(recruiter_bp, url_prefix="/api/recruiter")

# Add a test endpoint
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "AI Recruitment Flask backend is running"}), 200

# Catch-all route to serve React app
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def catch_all(path):
    if path.startswith("api/"):
        return jsonify({"error": "Not Found"}), 404
        
    # Check if request is for static file in static directory
    static_file_path = os.path.join(app.static_folder, path)
    if path and os.path.exists(static_file_path):
        return send_from_directory(app.static_folder, path)
        
    # Default to index.html in templates for React Router routing
    index_path = os.path.join(app.template_folder, "index.html")
    if os.path.exists(index_path):
        return render_template("index.html")
        
    return jsonify({
        "message": "Welcome to AI Recruitment Platform API. Frontend build index.html not found in templates folder. Please run the build script."
    }), 200
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
