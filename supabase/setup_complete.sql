-- ============================================================
-- AI RECRUITMENT PLATFORM — SUPABASE COMPLETE SETUP
-- Jalankan file ini 1x di: Supabase Dashboard > SQL Editor
-- Sudah mencakup: schema, triggers, functions, RLS policies, storage
-- Aman untuk project baru (menggunakan IF NOT EXISTS & ON CONFLICT)
-- ============================================================


-- ============================================================
-- STEP 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- STEP 2: TABLES
-- ============================================================

-- TABLE: users
-- Mirrors auth.users dengan tambahan role dan profile data
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

-- TABLE: candidate_profiles
-- Extended profile data untuk candidates
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

-- TABLE: cvs
-- Metadata CV yang diupload + URL ke Supabase Storage
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

-- TABLE: cv_analysis
-- Hasil analisis AI per upload CV
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
    raw_text_preview        TEXT DEFAULT '',   -- 500 karakter pertama dari teks CV

    -- Communication & Fit
    communication_score     INTEGER DEFAULT 0,
    cultural_fit_score      INTEGER DEFAULT 0,

    analyzed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cv_analysis_user_id ON public.cv_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_analysis_cv_id ON public.cv_analysis(cv_id);

-- TABLE: jobs
-- Job posting yang dibuat oleh recruiter
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

-- TABLE: applications
-- Lamaran candidate ke job posting
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

-- TABLE: recruitment_predictions
-- Output model XGBoost per candidate / application
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

-- TABLE: candidate_resumes
-- Data resume candidate dalam format JSON untuk resume builder
CREATE TABLE IF NOT EXISTS public.candidate_resumes (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    resume_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
    template_name TEXT NOT NULL DEFAULT 'harvard',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_resumes_user_id ON public.candidate_resumes(user_id);


-- ============================================================
-- STEP 3: FUNCTIONS & TRIGGERS
-- ============================================================

-- Function: auto-update kolom updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger: updated_at untuk setiap tabel yang perlu
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_profiles_updated_at ON public.candidate_profiles;
CREATE TRIGGER update_candidate_profiles_updated_at
    BEFORE UPDATE ON public.candidate_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_resumes_updated_at ON public.candidate_resumes;
CREATE TRIGGER update_candidate_resumes_updated_at
    BEFORE UPDATE ON public.candidate_resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: auto-create user profile saat signup
-- Dipanggil oleh trigger Supabase Auth
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

    -- Jika candidate, buat blank candidate_profile otomatis
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'candidate') = 'candidate' THEN
        INSERT INTO public.candidate_profiles (user_id)
        VALUES (NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook ke Supabase Auth: trigger setiap ada user baru
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function: ambil role user yang sedang login
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- STEP 4: ROW LEVEL SECURITY (RLS) — ENABLE
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_resumes ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 5: RLS POLICIES — TABLE: users
-- ============================================================

-- Drop dulu supaya aman kalau re-run
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_all_for_recruiter" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_service_role" ON public.users;

-- User bisa baca profil sendiri
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Recruiter & admin bisa lihat semua user
CREATE POLICY "users_select_all_for_recruiter"
    ON public.users FOR SELECT
    USING (get_current_user_role() IN ('recruiter', 'admin'));

-- User hanya bisa update profil sendiri
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Insert ditangani trigger (handle_new_user)
CREATE POLICY "users_insert_service_role"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);


-- ============================================================
-- STEP 6: RLS POLICIES — TABLE: candidate_profiles
-- ============================================================
DROP POLICY IF EXISTS "candidate_profiles_select_own" ON public.candidate_profiles;
DROP POLICY IF EXISTS "candidate_profiles_select_recruiter" ON public.candidate_profiles;
DROP POLICY IF EXISTS "candidate_profiles_select_recruiter_scoped" ON public.candidate_profiles;
DROP POLICY IF EXISTS "candidate_profiles_update_own" ON public.candidate_profiles;
DROP POLICY IF EXISTS "candidate_profiles_insert_own" ON public.candidate_profiles;

CREATE POLICY "candidate_profiles_select_own"
    ON public.candidate_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Recruiter HANYA bisa lihat profil candidate yang melamar ke job mereka
CREATE POLICY "candidate_profiles_select_recruiter_scoped"
    ON public.candidate_profiles FOR SELECT
    USING (
        get_current_user_role() = 'admin'
        OR (
            get_current_user_role() = 'recruiter'
            AND EXISTS (
                SELECT 1
                FROM public.applications a
                JOIN public.jobs j ON j.id = a.job_id
                WHERE
                    a.candidate_id = candidate_profiles.user_id
                    AND j.recruiter_id = auth.uid()
            )
        )
    );

CREATE POLICY "candidate_profiles_update_own"
    ON public.candidate_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "candidate_profiles_insert_own"
    ON public.candidate_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- STEP 7: RLS POLICIES — TABLE: cvs
-- ============================================================
DROP POLICY IF EXISTS "cvs_select_own" ON public.cvs;
DROP POLICY IF EXISTS "cvs_select_recruiter" ON public.cvs;
DROP POLICY IF EXISTS "cvs_insert_own" ON public.cvs;
DROP POLICY IF EXISTS "cvs_delete_own" ON public.cvs;
DROP POLICY IF EXISTS "cvs_update_own" ON public.cvs;

CREATE POLICY "cvs_select_own"
    ON public.cvs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "cvs_select_recruiter"
    ON public.cvs FOR SELECT
    USING (get_current_user_role() IN ('recruiter', 'admin'));

CREATE POLICY "cvs_insert_own"
    ON public.cvs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cvs_delete_own"
    ON public.cvs FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "cvs_update_own"
    ON public.cvs FOR UPDATE
    USING (auth.uid() = user_id);


-- ============================================================
-- STEP 8: RLS POLICIES — TABLE: cv_analysis
-- ============================================================
DROP POLICY IF EXISTS "cv_analysis_select_own" ON public.cv_analysis;
DROP POLICY IF EXISTS "cv_analysis_select_recruiter" ON public.cv_analysis;
DROP POLICY IF EXISTS "cv_analysis_select_recruiter_scoped" ON public.cv_analysis;
DROP POLICY IF EXISTS "cv_analysis_insert_own" ON public.cv_analysis;

CREATE POLICY "cv_analysis_select_own"
    ON public.cv_analysis FOR SELECT
    USING (auth.uid() = user_id);

-- Recruiter HANYA bisa lihat analisis candidate yang melamar ke job mereka
CREATE POLICY "cv_analysis_select_recruiter_scoped"
    ON public.cv_analysis FOR SELECT
    USING (
        get_current_user_role() = 'admin'
        OR (
            get_current_user_role() = 'recruiter'
            AND EXISTS (
                SELECT 1
                FROM public.applications a
                JOIN public.jobs j ON j.id = a.job_id
                WHERE
                    a.candidate_id = cv_analysis.user_id
                    AND j.recruiter_id = auth.uid()
            )
        )
    );

CREATE POLICY "cv_analysis_insert_own"
    ON public.cv_analysis FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- STEP 9: RLS POLICIES — TABLE: jobs
-- ============================================================
DROP POLICY IF EXISTS "jobs_select_open" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_recruiter_own" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_admin" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_recruiter" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_own" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete_own" ON public.jobs;

-- Siapa saja bisa lihat job yang status-nya 'open'
CREATE POLICY "jobs_select_open"
    ON public.jobs FOR SELECT
    USING (status = 'open');

-- Recruiter bisa lihat semua job milik mereka sendiri
CREATE POLICY "jobs_select_recruiter_own"
    ON public.jobs FOR SELECT
    USING (auth.uid() = recruiter_id);

-- Admin bisa lihat semua job
CREATE POLICY "jobs_select_admin"
    ON public.jobs FOR SELECT
    USING (get_current_user_role() = 'admin');

CREATE POLICY "jobs_insert_recruiter"
    ON public.jobs FOR INSERT
    WITH CHECK (
        auth.uid() = recruiter_id
        AND get_current_user_role() IN ('recruiter', 'admin')
    );

CREATE POLICY "jobs_update_own"
    ON public.jobs FOR UPDATE
    USING (auth.uid() = recruiter_id);

CREATE POLICY "jobs_delete_own"
    ON public.jobs FOR DELETE
    USING (auth.uid() = recruiter_id);


-- ============================================================
-- STEP 10: RLS POLICIES — TABLE: applications
-- ============================================================
DROP POLICY IF EXISTS "applications_select_own_candidate" ON public.applications;
DROP POLICY IF EXISTS "applications_select_recruiter" ON public.applications;
DROP POLICY IF EXISTS "applications_insert_candidate" ON public.applications;
DROP POLICY IF EXISTS "applications_update_recruiter" ON public.applications;
DROP POLICY IF EXISTS "applications_delete_own" ON public.applications;

-- Candidate bisa lihat lamaran mereka sendiri
CREATE POLICY "applications_select_own_candidate"
    ON public.applications FOR SELECT
    USING (auth.uid() = candidate_id);

-- Recruiter & admin bisa lihat semua lamaran
CREATE POLICY "applications_select_recruiter"
    ON public.applications FOR SELECT
    USING (
        get_current_user_role() IN ('recruiter', 'admin')
    );

-- Candidate bisa melamar pekerjaan
CREATE POLICY "applications_insert_candidate"
    ON public.applications FOR INSERT
    WITH CHECK (
        auth.uid() = candidate_id
        AND get_current_user_role() = 'candidate'
    );

-- Recruiter bisa update status lamaran
CREATE POLICY "applications_update_recruiter"
    ON public.applications FOR UPDATE
    USING (get_current_user_role() IN ('recruiter', 'admin'));

-- Candidate bisa tarik (hapus) lamarannya sendiri
CREATE POLICY "applications_delete_own"
    ON public.applications FOR DELETE
    USING (auth.uid() = candidate_id);


-- ============================================================
-- STEP 11: RLS POLICIES — TABLE: recruitment_predictions
-- ============================================================
DROP POLICY IF EXISTS "predictions_select_own" ON public.recruitment_predictions;
DROP POLICY IF EXISTS "predictions_select_recruiter" ON public.recruitment_predictions;
DROP POLICY IF EXISTS "predictions_select_recruiter_scoped" ON public.recruitment_predictions;
DROP POLICY IF EXISTS "predictions_insert_own" ON public.recruitment_predictions;

CREATE POLICY "predictions_select_own"
    ON public.recruitment_predictions FOR SELECT
    USING (auth.uid() = user_id);

-- Recruiter HANYA bisa lihat prediksi candidate yang melamar ke job mereka
CREATE POLICY "predictions_select_recruiter_scoped"
    ON public.recruitment_predictions FOR SELECT
    USING (
        get_current_user_role() = 'admin'
        OR (
            get_current_user_role() = 'recruiter'
            AND EXISTS (
                SELECT 1
                FROM public.applications a
                JOIN public.jobs j ON j.id = a.job_id
                WHERE
                    a.candidate_id = recruitment_predictions.user_id
                    AND j.recruiter_id = auth.uid()
            )
        )
    );

CREATE POLICY "predictions_insert_own"
    ON public.recruitment_predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- STEP 12: RLS POLICIES — TABLE: candidate_resumes
-- ============================================================
DROP POLICY IF EXISTS "candidate_resumes_select_own" ON public.candidate_resumes;
DROP POLICY IF EXISTS "candidate_resumes_insert_own" ON public.candidate_resumes;
DROP POLICY IF EXISTS "candidate_resumes_update_own" ON public.candidate_resumes;

CREATE POLICY "candidate_resumes_select_own"
    ON public.candidate_resumes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "candidate_resumes_insert_own"
    ON public.candidate_resumes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "candidate_resumes_update_own"
    ON public.candidate_resumes FOR UPDATE
    USING (auth.uid() = user_id);


-- ============================================================
-- STEP 13: STORAGE — Bucket cv-files (PRIVATE)
-- ============================================================

-- Buat bucket private untuk file CV
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cv-files',
    'cv-files',
    FALSE,  -- PRIVATE: tidak ada public URL
    10485760,  -- 10 MB max
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]
) ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Catatan: RLS di storage.objects sudah aktif secara default di Supabase.
-- JANGAN jalankan: ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY
-- (akan error 42501 karena tabel ini dimiliki oleh supabase_storage_admin)

-- Drop policies lama kalau ada
DROP POLICY IF EXISTS "cv_files_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "cv_files_select_own" ON storage.objects;
DROP POLICY IF EXISTS "cv_files_update_own" ON storage.objects;
DROP POLICY IF EXISTS "cv_files_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "cv_files_select_recruiter_scoped" ON storage.objects;

-- Candidate upload CV mereka sendiri (path: {user_id}/filename)
CREATE POLICY "cv_files_upload_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (string_to_array(name, '/'))[1]
    );

-- Candidate bisa baca/download CV mereka sendiri
CREATE POLICY "cv_files_select_own"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (string_to_array(name, '/'))[1]
    );

-- Candidate bisa replace (upsert) CV mereka sendiri
CREATE POLICY "cv_files_update_own"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (string_to_array(name, '/'))[1]
    );

-- Candidate bisa hapus CV mereka sendiri
CREATE POLICY "cv_files_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (string_to_array(name, '/'))[1]
    );

-- Recruiter HANYA bisa baca CV dari candidate yang melamar ke job mereka
-- Keamanan: recruiter tidak bisa akses CV candidate yang tidak pernah melamar ke job mereka
CREATE POLICY "cv_files_select_recruiter_scoped"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND (
            (SELECT role FROM public.users WHERE id = auth.uid()) IN ('recruiter', 'admin')
        )
        AND (
            EXISTS (
                SELECT 1
                FROM public.applications a
                JOIN public.jobs j ON j.id = a.job_id
                WHERE
                    a.candidate_id = (string_to_array(name, '/'))[1]::uuid
                    AND j.recruiter_id = auth.uid()
            )
        )
    );


-- ============================================================
-- SELESAI ✅
-- Semua tabel, trigger, function, RLS policies, dan storage
-- sudah terkonfigurasi. Platform siap digunakan.
-- ============================================================
