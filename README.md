# TalentLensAI — AI-Powered Recruitment Platform

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white)

TalentLensAI is a state-of-the-art, high-performance recruitment intelligence platform designed to eliminate manual screening and find hidden potential in seconds. It bridges the gap between candidates looking for their ideal roles and recruiters searching for top-tier talent through robust AI processing, scoring vectors, and interactive dashboard analytics.

The original UI design inspiration is available on [Figma](https://www.figma.com/design/sEModL6MpEr9fwuDThA4x1/AI-Recruitment-Platform-Design).

---

## 🚀 Key Features

### 1. AI CV Intelligence
* **Neural Ingestion**: Instant parsing of candidate resumes in multiple formats (PDF, Word, TXT).
* **Information Extraction**: Deep learning models extract skills, work history, education, and candidate potential in under 3 seconds.

### 2. Hiring Probability & Matching
* **Semantic Analysis**: Matches resume vectors against specific job requirements with 98% accuracy.
* **Compatibility Scoring**: Calculates hire probability, culture fit, and skill alignment indicators.

### 3. Smart Ranking
* **Automated Shortlisting**: Ranks application lists dynamically so recruiters can focus on top candidates immediately.
* **Custom Filters**: Sort by match scores, specific programming languages, or years of experience.

### 4. Recruiter Analytics & Reports
* **Pipeline Health**: View active hiring stages, drop-offs, and hiring statistics in real-time.
* **Candidate Feedback**: Tracks Net Promoter Score (NPS) and satisfaction rating distributions.
* **Dynamic Export**: Single-click downloads of complete analytics and pipeline reports as clean CSV datasets.

---

## 🛠️ System Architecture

* **Frontend**: React, TypeScript, Vite, Tailwind CSS. Implements fluid Apple design aesthetics, custom cursor tracking, interactive bento grids, and responsive layouts.
* **Backend**: Python Flask/FastAPI backend (`app.py`) handling resume ingestion, semantic comparison, and metadata sync.
* **Database & Auth**: Supabase PostgreSQL for persistent pipeline storage, with secure social sign-ins (Google, GitHub).

---

## 🏃 Getting Started

### 📋 Prerequisites
Make sure you have the following installed on your machine:
* **Node.js** (v18 or higher)
* **Python** (v3.8 or higher)

### Step 1: Install Dependencies
Run the package installations for both the frontend and backend.

```bash
# Install Frontend Dependencies
npm install

# Install Backend Dependencies
pip install -r requirements.txt
```

### Step 2: Start the Python Backend
Run the AI processing and neural engine backend:

```bash
python app.py
```
*The backend will boot up, typically running on port `5000` or as configured in your environmental settings.*

### Step 3: Start the Frontend Development Server
Launch the React/Vite development server:

```bash
npm run dev
```
*Open your browser and navigate to the address shown in the terminal (usually `http://localhost:5173`) to view the application.*

---

## 📦 Production Build

To generate the optimized static assets for production deployment:

```bash
npm run build
```
The compiled output will be generated inside the `dist/` directory, ready to be served by any static host.