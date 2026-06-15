import os
import re
import joblib
import pandas as pd
import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Setup directories
SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SERVICES_DIR)
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Ensure NLTK downloads are available
try:
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('omw-1.4')

# Initialize NLTK components
stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

# Load models
try:
    resume_classifier = joblib.load(os.path.join(MODELS_DIR, "resume_classifier.pkl"))
    vectorizer = joblib.load(os.path.join(MODELS_DIR, "vectorizer.pkl"))
    label_encoder = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))
except Exception as e:
    print(f"Error loading CV Analysis models: {e}")
    resume_classifier = None
    vectorizer = None
    label_encoder = None

# Keywords lists for skills detection
SKILLS_KEYWORDS = {
    "Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", 
    "Express", "Django", "Flask", "Spring Boot", "SQL", "NoSQL", "MongoDB", "PostgreSQL", 
    "MySQL", "AWS", "Docker", "Kubernetes", "Git", "GitHub", "HTML", "CSS", "Tailwind", "Bootstrap", 
    "Machine Learning", "Data Science", "Data Analysis", "Deep Learning", "TensorFlow", 
    "PyTorch", "Pandas", "NumPy", "Scikit-Learn", "Figma", "UI/UX", "User Research", 
    "Prototyping", "Design Systems", "Product Management", "Agile", "Scrum", "DevOps", 
    "CI/CD", "Linux", "Cybersecurity", "Network Security", "Cloud Computing", "Android", 
    "iOS", "Swift", "Kotlin", "Flutter", "React Native", "PHP", "C#", "C++", "Ruby", "Go",
    "Supabase", "Google Colab", "Arduino IDE", "VS Code", "Grafana"
}

def clean_text_for_prediction(text):
    """Preprocess resume text for TF-IDF Vectorizer."""
    # Remove URLs
    text = re.sub(r'http\S+\s*', ' ', text)
    # Remove HTML/RTF tags
    text = re.sub(r'<[^>]*>', ' ', text)
    # Remove emails
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', ' ', text)
    # Remove special characters, punctuation, and digits
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    # Convert to lowercase
    text = text.lower()
    # Tokenize
    words = text.split()
    # Remove stopwords and lemmatize
    cleaned_words = [lemmatizer.lemmatize(w) for w in words if w not in stop_words and len(w) > 2]
    return ' '.join(cleaned_words)

def preprocess_spaced_text(text):
    """
    Detects and collapses spaced-out letters (e.g. 'p y t h o n' -> 'python').
    Common in PDF generators (like Canva or Word) with custom kerning.
    """
    lines = text.split("\n")
    processed_lines = []
    
    for line in lines:
        words = line.split()
        if len(words) > 3:
            single_letter_words = sum(1 for w in words if len(w) == 1)
            ratio = single_letter_words / len(words)
            if ratio > 0.6:  # If more than 60% of words are single letters, it's spaced out
                temp = re.sub(r'\s{2,}', ' __WORD_SEP__ ', line)
                temp = temp.replace(' ', '')
                line = temp.replace('__WORD_SEP__', ' ')
        processed_lines.append(line)
        
    return "\n".join(processed_lines)

def extract_skills(text):
    """
    Extract known technical skills from text using a robust hybrid matcher
    that handles both standard text and spaced-out PDF text formats.
    """
    detected = []
    text_lower = text.lower()
    
    # 1. Standard match on original text
    for skill in SKILLS_KEYWORDS:
        escaped = re.escape(skill.lower())
        if not re.match(r'^.*\w$', skill):
            pattern = r"\b" + escaped + r"(?=\s|$|[.,;!])"
        else:
            pattern = r"\b" + escaped + r"\b"
            
        if re.search(pattern, text_lower):
            detected.append(skill)
            
    # 2. Standard match on collapsed text
    collapsed = preprocess_spaced_text(text)
    collapsed_lower = collapsed.lower()
    for skill in SKILLS_KEYWORDS:
        escaped = re.escape(skill.lower())
        if not re.match(r'^.*\w$', skill):
            pattern = r"\b" + escaped + r"(?=\s|$|[.,;!])"
        else:
            pattern = r"\b" + escaped + r"\b"
            
        if re.search(pattern, collapsed_lower):
            detected.append(skill)
            
    # 3. Space-insensitive regex match for spaced-out documents (only for skills length >= 3 to avoid false positives)
    words = text.split()
    is_spaced = False
    if len(words) > 10:
        single_letter_words = sum(1 for w in words if len(w) == 1)
        if (single_letter_words / len(words)) > 0.4:
            is_spaced = True
            
    if is_spaced:
        for skill in SKILLS_KEYWORDS:
            if len(skill) >= 3:
                # Create regex with optional spaces between letters, e.g. "c\s*s\s*s"
                chars = [re.escape(c) for c in skill.lower()]
                pattern = r"\b" + r"\s*".join(chars) + r"\b"
                if re.search(pattern, text_lower):
                    detected.append(skill)
                
    return sorted(list(set(detected)))

def extract_education_level(text):
    """Extract education level from resume text (1: High School, 2: Bachelor, 3: Master, 4: PhD)."""
    text_lower = text.lower()
    if re.search(r"\b(phd|ph\.d|doctorate|doctor of philosophy)\b", text_lower):
        return 4
    elif re.search(r"\b(master|m\.sc|m\.s\.|m\.a\.|mba|postgraduate)\b", text_lower):
        return 3
    elif re.search(r"\b(bachelor|b\.sc|b\.s\.|b\.a\.|b\.tech|undergraduate|degree|s1|stmik|universitas|university|institut|politeknik|mahasiswa|college)\b", text_lower):
        return 2
    return 1

# Month name → number mapping (full + abbreviated) in English and Indonesian
_MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "jun": 6, "jul": 7, "aug": 8,
    "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
    # Indonesian
    "januari": 1, "februari": 2, "maret": 3, "mei": 5, "juni": 6, "juli": 7, "agustus": 8,
    "oktober": 10, "desember": 12
}
_MONTH_PAT = r"(?:" + "|".join(sorted(_MONTHS.keys(), key=len, reverse=True)) + r")"
_PRESENT_PAT = r"present|current|sekarang|now"


def _parse_month_year(s: str):
    """Parse 'February 2026' or 'Feb 2026' → (month_int, year_int). Returns None on failure."""
    s = s.strip().lower()
    # already just a year?
    m = re.fullmatch(r"20\d{2}", s)
    if m:
        return (1, int(s))
    m = re.match(rf"({_MONTH_PAT})\s+(20\d{{2}})", s)
    if m:
        return (_MONTHS[m.group(1)], int(m.group(2)))
    return None


def extract_sections(text: str) -> dict:
    """Split resume text into sections based on headers."""
    sections = {}
    lines = text.split('\n')
    
    headers = {
        "experience": ["experience", "employment", "work history", "professional experience", "work experience", "career history", "pengalaman kerja", "pengalaman profesional", "riwayat pekerjaan", "riwayat karir", "pengalaman"],
        "education": ["education", "academic", "qualification", "educational background", "studies", "academic history", "pendidikan", "riwayat pendidikan", "latar belakang pendidikan", "akademik"],
        "projects": ["projects", "project", "portfolio", "academic projects", "personal projects", "proyek", "proyek akademik", "proyek personal", "portofolio"],
        "leadership": ["leadership", "leadership & activities", "leadership and activities", "co-curricular activities", "organization experience", "organizational experience", "extracurricular activities", "kepemimpinan", "organisasi", "pengalaman organisasi", "kegiatan"],
        "skills": ["skills", "skills & interests", "skills and interests", "technical skills", "competencies", "keahlian", "keterampilan", "skill", "keahlian & minat"]
    }
    
    current_section = "general"
    sections[current_section] = []
    
    for line in lines:
        cleaned_line = line.strip().lower()
        cleaned_line = re.sub(r'^[#*\s-]+', '', cleaned_line)
        cleaned_line = re.sub(r'[#*\s-]+$', '', cleaned_line)
        
        is_header = False
        for sec_name, keywords in headers.items():
            for kw in keywords:
                if cleaned_line == kw or cleaned_line == kw + "s" or cleaned_line.startswith(kw + " "):
                    if len(cleaned_line) < 40:
                        current_section = sec_name
                        is_header = True
                        if current_section not in sections:
                            sections[current_section] = []
                        break
            if is_header:
                break
                
        if not is_header:
            sections[current_section].append(line)
            
    return {k: "\n".join(v) for k, v in sections.items()}


def is_non_professional_context(context: str) -> bool:
    """Check if the context around a date range indicates a non-professional activity."""
    context_lower = context.lower()
    
    strict_excludes = [
        "skillsbuild", "juaragcp", "bootcamp", "volunteer", "sukarelawan",
        "certification", "sertifikasi", "course", "kursus", "training",
        "pelatihan", "leadership", "kepemimpinan", "organisasi",
        "extracurricular", "academic", "akademik", "education", "pendidikan"
    ]
    for kw in strict_excludes:
        if kw in context_lower:
            return True
            
    if "project" in context_lower or "proyek" in context_lower:
        # Allow professional project job titles
        professional_project_titles = [
            "project manager", "project engineer", "project leader", "project officer",
            "project coordinator", "project director", "project specialist",
            "project consultant", "project analyst", "manajer proyek", "pimpinan proyek"
        ]
        if any(title in context_lower for title in professional_project_titles):
            return False
        return True
        
    return False


def calculate_text_years(text: str, is_professional: bool = False) -> float:
    """Helper to calculate years of experience from isolated text content."""
    import datetime
    text_lower = text.lower()
    NOW = datetime.date.today()

    # --- 1. Explicit statement ---
    explicit = re.findall(r"(\d+)\+?\s*years?\s+of?\s+(?:work\s+)?experience", text_lower)
    if explicit and not is_professional:
        return min(max(int(x) for x in explicit), 15)

    total_months = 0

    # --- 2 & 3. Month-Year ranges ---
    month_range_pat = re.compile(
        rf"({_MONTH_PAT})\s+(20\d{{2}})"
        rf"\s*[\-–/]+\s*"
        rf"((?:{_MONTH_PAT})\s+(?:20\d{{2}})|{_PRESENT_PAT})",
        re.IGNORECASE,
    )
    for m in month_range_pat.finditer(text_lower):
        if is_professional:
            # Check context window before the match (150 chars)
            start_idx = max(0, m.start() - 150)
            context = text_lower[start_idx:m.start()]
            if is_non_professional_context(context):
                continue
                
        start_month = _MONTHS.get(m.group(1).lower(), 1)
        start_year = int(m.group(2))
        end_str = m.group(3).strip().lower()

        if re.fullmatch(_PRESENT_PAT, end_str):
            end_month, end_year = NOW.month, NOW.year
        else:
            parsed = _parse_month_year(end_str)
            if not parsed:
                continue
            end_month, end_year = parsed

        diff = (end_year - start_year) * 12 + (end_month - start_month)
        if 0 < diff <= 240:
            total_months += diff

    # --- 4 & 5. Year-only ranges ---
    year_range_pat = re.compile(
        rf"\b(20\d{{2}})\b\s*[\-–/]+\s*\b(20\d{{2}}|{_PRESENT_PAT})\b",
        re.IGNORECASE,
    )
    for m in year_range_pat.finditer(text_lower):
        if is_professional:
            # Check context window before the match (150 chars)
            start_idx = max(0, m.start() - 150)
            context = text_lower[start_idx:m.start()]
            if is_non_professional_context(context):
                continue
                
        start_yr = int(m.group(1))
        end_raw = m.group(2).lower()
        end_yr = NOW.year if re.fullmatch(_PRESENT_PAT, end_raw) else int(end_raw)
        diff_months = (end_yr - start_yr) * 12
        if 0 < diff_months <= 240:
            total_months += diff_months

    if total_months > 0:
        return min(round(total_months / 12, 1), 15)

    # --- 6. Fresh-graduate credit for internships / projects ---
    if is_professional:
        # Only formal internships
        internship_kws = ["intern", "internship", "magang", "trainee", "apprentice"]
        for kw in internship_kws:
            if kw in text_lower:
                # Make sure it's not non-professional
                if not any(np_kw in text_lower for np_kw in ["skillsbuild", "juaragcp", "bootcamp", "project", "proyek", "volunteer", "sukarelawan"]):
                    return 0.5
        return 0.0
    else:
        internship_kws = [
            "intern", "internship", "magang", "trainee", "apprentice",
            "program participant", "volunteer", "freelance",
            "capstone", "research assistant", "project developer",
            "cloud skills", "juaragcp", "skillsbuild",
        ]
        for kw in internship_kws:
            if kw in text_lower:
                return 0.5  # credit: 6 months equivalent

    return 0.0


def extract_experience_years(text: str) -> float:
    """Extract total active years (for Quality Score calculation)."""
    return calculate_text_years(text, is_professional=False)


def extract_professional_experience_years(text: str) -> float:
    """Extract professional experience years, targeting only work experience sections."""
    sections = extract_sections(text)
    
    # Target experience section specifically
    exp_text = sections.get("experience", "")
    
    if not exp_text.strip():
        # Fallback: search the whole text except education, projects, skills, leadership sections
        exp_text = text
        for sec in ["education", "projects", "skills", "leadership"]:
            if sec in sections:
                exp_text = exp_text.replace(sections[sec], "")
                
    return calculate_text_years(exp_text, is_professional=True)


def calculate_experience_quality_score(text: str, experience_years: float) -> int:
    """
    More nuanced Experience Quality score that rewards:
      - Real work experience (main factor)
      - Internships, cloud programs, capstone projects
      - Quantified achievements
      - Multiple experiences
    Scale: 0–100
    """
    text_lower = text.lower()
    score = 0

    # Base: years of formal experience (capped at 50 pts for 5+ yrs)
    score += min(int(experience_years * 10), 50)

    # Internship / training programs (+15)
    if any(kw in text_lower for kw in ["intern", "internship", "magang", "trainee",
                                        "skillsbuild", "juaragcp", "cloud skills",
                                        "bootcamp", "fellowship"]):
        score += 15

    # Project experience (+10)
    if any(kw in text_lower for kw in ["project", "capstone", "built", "developed",
                                        "designed", "implemented", "created"]):
        score += 10

    # Certifications boost (+10)
    if any(kw in text_lower for kw in ["certified", "certification", "certificate",
                                        "dicoding", "coursera", "google", "ibm",
                                        "aws", "microsoft", "cisco"]):
        score += 10

    # Quantified achievements (+10)
    if re.search(r"\d+\s*%|\d+x\b|\d+\s*(?:million|billion|users|clients|requests)",
                 text_lower):
        score += 10

    # Multiple roles / companies (+5)
    role_count = len(re.findall(
        r"(?:intern|participant|developer|engineer|analyst|designer|researcher)",
        text_lower
    ))
    if role_count >= 2:
        score += 5

    return min(score, 100)


def calculate_communication_score(text, sections_found):
    """Calculate rule-based Communication Score."""
    score = 70  # Base score
    # Structure presence helps readability
    if "summary" in sections_found or "profile" in sections_found:
        score += 8
    if "languages" in sections_found:
        score += 8
    if "certifications" in sections_found or "organizations" in sections_found:
        score += 8
    # Formatting bullet check
    if re.search(r"[•\-\*]\s+[A-Z]", text):
        score += 6
        
    return min(score, 100)

def calculate_cultural_fit_score(text):
    """Calculate rule-based Cultural Fit Score based on collaboration keywords."""
    score = 70 # Base score
    cultural_keywords = [
        'agile', 'scrum', 'teamwork', 'collaborate', 'leadership', 
        'ownership', 'mentor', 'coordinate', 'manage', 'solved'
    ]
    text_lower = text.lower()
    for kw in cultural_keywords:
        if kw in text_lower:
            score += 4
            
    return min(score, 100)

def extract_previous_companies(text):
    """Estimate count of previous companies from corporate keywords."""
    text_lower = text.lower()
    company_keywords = ["company", "inc", "ltd", "corp", "corporation", "pt", "software", "agency", "studio"]
    company_matches = re.findall(r"\b(" + "|".join(company_keywords) + r")\b", text_lower)
    if company_matches:
        return min(len(set(company_matches)), 5)
    return 1

def analyze_cv(text):
    """
    Perform hybrid analysis of the resume.
    Uses Machine Learning for job category prediction.
    Uses Rule-Based logic for score calculations, strengths, and suggestions.
    """
    if not text or not text.strip():
        return {
            "predictedCategory": "Software Engineering",
            "cvScore": 50,
            "atsScore": 50,
            "skills": [],
            "communicationScore": 60,
            "experienceLevel": "Entry Level",
            "culturalFitScore": 60,
            "strengths": ["Basic formatting"],
            "improvements": ["Add contact details", "Include technical skills"],
            "details": {
                "educationLevel": 1,
                "experienceYears": 1,
                "previousCompanies": 1,
                "skillScore": 50
            }
        }

    # 1. Extract technical skills using the robust matcher on the ORIGINAL raw text
    detected_skills = extract_skills(text)
    num_skills = len(detected_skills)
    skill_score = min(55 + 5 * num_skills, 98)

    # Preprocess spaced-out text (from PDF exporters with custom kerning) for all other features
    processed_text = preprocess_spaced_text(text)

    # 2. Predict Category using Machine Learning Model (resume_classifier) on processed_text
    predicted_category = "Web Designing"
    if resume_classifier and vectorizer and label_encoder:
        try:
            cleaned_pred_text = clean_text_for_prediction(processed_text)
            tfidf_vec = vectorizer.transform([cleaned_pred_text])
            class_idx = resume_classifier.predict(tfidf_vec)[0]
            predicted_category = label_encoder.inverse_transform([class_idx])[0]
        except Exception as e:
            print(f"Error predicting category: {e}")
            if "design" in processed_text.lower():
                predicted_category = "Web Designing"
            else:
                predicted_category = "Java Developer"
    else:
        if "design" in processed_text.lower():
            predicted_category = "Web Designing"
        else:
            predicted_category = "Java Developer"

    # 3. Extract Education Level
    education_level = extract_education_level(processed_text)
    education_scores = {1: 40, 2: 60, 3: 80, 4: 100}
    education_score = education_scores.get(education_level, 40)

    # 4. Extract Experience Years (Total and Professional)
    total_experience_years = extract_experience_years(processed_text)
    professional_experience_years = extract_professional_experience_years(processed_text)
    
    # Map experience years to labels (using professional experience)
    if professional_experience_years <= 2:
        exp_level = "Entry Level"
    elif professional_experience_years <= 5:
        exp_level = "Mid Level"
    elif professional_experience_years <= 9:
        exp_level = "Senior Level"
    else:
        exp_level = "Lead / Expert"
 
    # 5. Extract Previous Companies Count
    prev_companies = extract_previous_companies(processed_text)
 
    # 6. Calculate ATS Score
    # Use case-insensitive search and recognize Harvard/common resume header variants
    ats_score = 60
    sections_found = []
    text_lower = processed_text.lower()
 
    # Map canonical section names to what the ATS looks for (including Harvard-style variants)
    section_patterns = {
        "experience":     ["experience", "employment", "work history", "leadership & activities",
                           "leadership and activities", "professional experience", "internship"],
        "education":      ["education", "academic", "qualification"],
        "skills":         ["skills", "skills & interests", "skills and interests",
                           "technical skills", "competencies"],
        "projects":       ["projects", "project", "portfolio"],
        "certifications": ["certifications", "certification", "certificates", "awards",
                           "achievements", "licenses"],
        "languages":      ["languages", "programming languages", "foreign languages"],
        "summary":        ["summary", "objective", "profile", "about"],
        "profile":        ["profile", "about me", "bio"],
    }
 
    for canonical, patterns in section_patterns.items():
        for p in patterns:
            if p in text_lower:
                if canonical not in sections_found:
                    ats_score += 4
                    sections_found.append(canonical)
                break
            
    if re.search(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", processed_text):  # email
        ats_score += 4
    if re.search(r"\b(linkedin\.com/in/\S+|github\.com/\S+)\b", processed_text.lower()):  # social links
        ats_score += 4
    if num_skills >= 5:
        ats_score += 4
    ats_score = min(ats_score, 100)
 
    # 7. Calculate Experience Quality Score (nuanced calculation using total active years)
    experience_quality_score = calculate_experience_quality_score(processed_text, total_experience_years)
 
    # Calculate CV Score (Weighted)
    # Include Experience Quality to reward comprehensive CV profiles
    cv_score = int(0.35 * skill_score + 0.35 * ats_score + 0.15 * education_score + 0.15 * experience_quality_score)
    cv_score = min(max(cv_score, 10), 100)
 
    # Debug Logging
    print("ATS:", ats_score)
    print("Skills:", skill_score)
    print("Education:", education_score)
    print("Experience Quality:", experience_quality_score)
    print("Final CV Score:", cv_score)
 
    # 8. Calculate Communication & Cultural Fit Scores
    communication_score = calculate_communication_score(processed_text, sections_found)
    cultural_fit_score = calculate_cultural_fit_score(processed_text)
 
    # 9. Strengths & Improvements Analysis
    strengths = []
    improvements = []
    
    if education_level >= 3:
        strengths.append("High Education Level (Master/PhD)")
    else:
        strengths.append("Standard academic background")
        
    if professional_experience_years >= 4:
        strengths.append("Strong Professional Experience")
    elif professional_experience_years > 0:
        strengths.append("Relevant work history")
        
    if num_skills >= 8:
        strengths.append("Broad Technical Skillset")
    elif num_skills >= 4:
        strengths.append("Core technical skills detected")
        
    if ats_score >= 80:
        strengths.append("Excellent ATS format compatibility")
        
    # Improvements
    if "education" not in sections_found:
        improvements.append("Clearly outline your Education history in a dedicated section.")
    if "skills" not in sections_found:
        improvements.append("Structure your Technical Skills into a clean, scannable section.")
    if "projects" not in sections_found:
        improvements.append("Add a Projects section to showcase how you apply your skills.")
    if num_skills < 6:
        improvements.append("Incorporate more industry-relevant technical keywords and tools.")
    if not re.search(r"\b(linkedin\.com/in/\S+|github\.com/\S+)\b", text.lower()):
        improvements.append("Add links to your professional profiles (LinkedIn or GitHub) in the header.")
        
    if len(improvements) == 0:
        improvements.append("Quantify achievements (e.g. 'optimized page load time by 30%').")
        improvements.append("Tailor keywords specifically to your target job position.")
 
    return {
        "predictedCategory": predicted_category,
        "cvScore": cv_score,
        "atsScore": ats_score,
        "skills": detected_skills,
        "communicationScore": communication_score,
        "experienceLevel": exp_level,
        "culturalFitScore": cultural_fit_score,
        "strengths": strengths[:3],
        "improvements": improvements[:3],
        "experienceQualityScore": experience_quality_score,
        "details": {
            "educationLevel": education_level,
            "experienceYears": professional_experience_years,
            "previousCompanies": prev_companies,
            "skillScore": skill_score,
            "experienceQualityScore": experience_quality_score
        }
    }

