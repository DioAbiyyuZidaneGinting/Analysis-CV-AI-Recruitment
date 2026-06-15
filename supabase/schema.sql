-- ============================================================
-- AI Recruitment Platform - Supabase Schema Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- Mirrors auth.users with additional role and profile data
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL UNIQUE,
    role        TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    first_name  TEXT NOT NULL DEFAULT '',
    last_name   TEXT NOT NULL DEFAULT '',
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: candidate_profiles
-- Extended profile data for candidates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    headline                TEXT DEFAULT 'Candidate',
    location                TEXT DEFAULT '',
    phone                   TEXT DEFAULT '',
    linkedin_url            TEXT DEFAULT '',
    github_url              TEXT DEFAULT '',
    portfolio_url           TEXT DEFAULT '',
    bio                     TEXT DEFAULT '',
    desired_role            TEXT DEFAULT '',
    desired_salary          TEXT DEFAULT '',
    available_from          DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: cvs
-- Stores uploaded CV metadata and Supabase Storage URL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cvs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    file_url        TEXT NOT NULL,          -- Supabase Storage public URL
    file_path       TEXT NOT NULL,          -- Storage bucket path: cv-files/{user_id}/{filename}
    file_size       INTEGER,                -- bytes
    mime_type       TEXT,                   -- application/pdf | application/vnd.openxmlformats...
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs(user_id);

-- ============================================================
-- TABLE: cv_analysis
-- AI analysis results per CV upload
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cv_analysis (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id                   UUID NOT NULL REFERENCES public.cvs(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Scores
    cv_score                INTEGER NOT NULL DEFAULT 0,
    ats_score               INTEGER NOT NULL DEFAULT 0,
    skills_relevance_score  INTEGER NOT NULL DEFAULT 0,
    experience_quality_score INTEGER NOT NULL DEFAULT 0,
    format_clarity_score    INTEGER NOT NULL DEFAULT 0,

    -- AI Predictions
    predicted_category      TEXT,
    job_category            TEXT,
    experience_level        TEXT,           -- Entry Level, Mid Level, Senior Level, Lead/Expert
    experience_years        FLOAT DEFAULT 0.0,
    education_level         INTEGER DEFAULT 1, -- 1=HS, 2=Bachelor, 3=Master, 4=PhD
    previous_companies      INTEGER DEFAULT 1,
    skill_score             INTEGER DEFAULT 0,

    -- Detailed results
    detected_skills         TEXT[] DEFAULT '{}',
    strengths               TEXT[] DEFAULT '{}',
    improvements            TEXT[] DEFAULT '{}',
    ai_note                 TEXT DEFAULT '',
    raw_text_preview        TEXT DEFAULT '',   -- first 500 chars of parsed CV text

    -- Communication & Fit
    communication_score     INTEGER DEFAULT 0,
    cultural_fit_score      INTEGER DEFAULT 0,

    analyzed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cv_analysis_user_id ON public.cv_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_analysis_cv_id ON public.cv_analysis(cv_id);

-- ============================================================
-- TABLE: jobs
-- Job postings created by recruiters
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recruiter_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    department          TEXT DEFAULT '',
    location            TEXT DEFAULT '',
    employment_type     TEXT DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote')),
    salary_min          INTEGER,
    salary_max          INTEGER,
    currency            TEXT DEFAULT 'USD',
    description         TEXT DEFAULT '',
    requirements        TEXT[] DEFAULT '{}',
    required_skills     TEXT[] DEFAULT '{}',
    experience_min_years INTEGER DEFAULT 0,
    education_level_min  INTEGER DEFAULT 1,
    status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft', 'paused')),
    deadline            DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- ============================================================
-- TABLE: applications
-- Candidate applications to jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.applications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cv_id           UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
    cover_letter    TEXT DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'screening', 'interview', 'offered', 'accepted', 'rejected')
    ),
    match_score     INTEGER DEFAULT 0,
    recruiter_note  TEXT DEFAULT '',
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (job_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- ============================================================
-- TABLE: recruitment_predictions
-- XGBoost model output per candidate / application
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recruitment_predictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    application_id      UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    cv_analysis_id      UUID REFERENCES public.cv_analysis(id) ON DELETE SET NULL,

    -- Model inputs
    age                 INTEGER DEFAULT 27,
    gender              INTEGER DEFAULT 1,
    education_level     INTEGER DEFAULT 1,
    experience_years    FLOAT DEFAULT 0.0,
    previous_companies  INTEGER DEFAULT 1,
    distance_km         FLOAT DEFAULT 10.0,
    interview_score     INTEGER DEFAULT 70,
    skill_score         INTEGER DEFAULT 50,
    personality_score   INTEGER DEFAULT 75,
    recruitment_strategy INTEGER DEFAULT 2,

    -- Model outputs
    hiring_chance       FLOAT DEFAULT 0.0,
    hiring_probability  FLOAT DEFAULT 0.0,
    hiring_recommendation TEXT DEFAULT 'Not Recommended' CHECK (
        hiring_recommendation IN ('Recommended', 'Not Recommended')
    ),

    predicted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruitment_predictions_user_id ON public.recruitment_predictions(user_id);

-- ============================================================
-- TRIGGERS: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_profiles_updated_at
    BEFORE UPDATE ON public.candidate_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: auto-create user profile on signup
-- Triggered by Supabase Auth webhook (via database trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'candidate'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );

    -- If candidate, also create blank candidate_profile
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'candidate') = 'candidate' THEN
        INSERT INTO public.candidate_profiles (user_id)
        VALUES (NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook into Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- TABLE: candidate_resumes
-- Stores candidate resume data in JSON format for the builder
-- ============================================================
CREATE TABLE IF NOT EXISTS public.candidate_resumes (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    resume_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
    template_name TEXT NOT NULL DEFAULT 'harvard',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_resumes_user_id ON public.candidate_resumes(user_id);

CREATE TRIGGER update_candidate_resumes_updated_at
    BEFORE UPDATE ON public.candidate_resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
