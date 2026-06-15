-- ============================================================
-- AI Recruitment Platform - Supabase RLS Policies
-- Run this AFTER schema.sql in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_predictions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- TABLE: users
-- ============================================================

-- Users can read their own profile
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Recruiters and admins can view all users
CREATE POLICY "users_select_all_for_recruiter"
    ON public.users FOR SELECT
    USING (get_current_user_role() IN ('recruiter', 'admin'));

-- Users can update only their own profile
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Insert is handled via the trigger (handle_new_user), no direct insert needed
CREATE POLICY "users_insert_service_role"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE: candidate_profiles
-- ============================================================

-- Candidates can read and update their own profile
CREATE POLICY "candidate_profiles_select_own"
    ON public.candidate_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Recruiters can read all candidate profiles
CREATE POLICY "candidate_profiles_select_recruiter"
    ON public.candidate_profiles FOR SELECT
    USING (get_current_user_role() IN ('recruiter', 'admin'));

-- Candidates can update their own profile
CREATE POLICY "candidate_profiles_update_own"
    ON public.candidate_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- System inserts (via trigger)
CREATE POLICY "candidate_profiles_insert_own"
    ON public.candidate_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: cvs
-- ============================================================

-- Candidates can see their own CVs
CREATE POLICY "cvs_select_own"
    ON public.cvs FOR SELECT
    USING (auth.uid() = user_id);

-- Recruiters can see all CVs
CREATE POLICY "cvs_select_recruiter"
    ON public.cvs FOR SELECT
    USING (get_current_user_role() IN ('recruiter', 'admin'));

-- Candidates can upload their own CVs
CREATE POLICY "cvs_insert_own"
    ON public.cvs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Candidates can delete their own CVs
CREATE POLICY "cvs_delete_own"
    ON public.cvs FOR DELETE
    USING (auth.uid() = user_id);

-- Candidates can update their own CVs (e.g. set is_active)
CREATE POLICY "cvs_update_own"
    ON public.cvs FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: cv_analysis
-- ============================================================

-- Candidates can read their own analysis
CREATE POLICY "cv_analysis_select_own"
    ON public.cv_analysis FOR SELECT
    USING (auth.uid() = user_id);

-- Recruiters can read all analyses
CREATE POLICY "cv_analysis_select_recruiter"
    ON public.cv_analysis FOR SELECT
    USING (get_current_user_role() IN ('recruiter', 'admin'));

-- Only backend service inserts analysis (service role key)
CREATE POLICY "cv_analysis_insert_own"
    ON public.cv_analysis FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: jobs
-- ============================================================

-- Anyone can view open jobs
CREATE POLICY "jobs_select_open"
    ON public.jobs FOR SELECT
    USING (status = 'open');

-- Recruiters can view all their own jobs
CREATE POLICY "jobs_select_recruiter_own"
    ON public.jobs FOR SELECT
    USING (auth.uid() = recruiter_id);

-- Admins can view all jobs
CREATE POLICY "jobs_select_admin"
    ON public.jobs FOR SELECT
    USING (get_current_user_role() = 'admin');

-- Only recruiters can create jobs
CREATE POLICY "jobs_insert_recruiter"
    ON public.jobs FOR INSERT
    WITH CHECK (
        auth.uid() = recruiter_id
        AND get_current_user_role() IN ('recruiter', 'admin')
    );

-- Recruiters can update their own jobs
CREATE POLICY "jobs_update_own"
    ON public.jobs FOR UPDATE
    USING (auth.uid() = recruiter_id);

-- Recruiters can delete their own jobs
CREATE POLICY "jobs_delete_own"
    ON public.jobs FOR DELETE
    USING (auth.uid() = recruiter_id);

-- ============================================================
-- TABLE: applications
-- ============================================================

-- Candidates can view their own applications
CREATE POLICY "applications_select_own_candidate"
    ON public.applications FOR SELECT
    USING (auth.uid() = candidate_id);

-- Recruiters can view all applications for their jobs
CREATE POLICY "applications_select_recruiter"
    ON public.applications FOR SELECT
    USING (
        get_current_user_role() IN ('recruiter', 'admin')
    );

-- Candidates can apply to jobs
CREATE POLICY "applications_insert_candidate"
    ON public.applications FOR INSERT
    WITH CHECK (
        auth.uid() = candidate_id
        AND get_current_user_role() = 'candidate'
    );

-- Recruiters can update application status
CREATE POLICY "applications_update_recruiter"
    ON public.applications FOR UPDATE
    USING (get_current_user_role() IN ('recruiter', 'admin'));

-- Candidates can withdraw (delete) their own applications
CREATE POLICY "applications_delete_own"
    ON public.applications FOR DELETE
    USING (auth.uid() = candidate_id);

-- ============================================================
-- TABLE: recruitment_predictions
-- ============================================================

-- Candidates can view their own predictions
CREATE POLICY "predictions_select_own"
    ON public.recruitment_predictions FOR SELECT
    USING (auth.uid() = user_id);

-- Recruiters can view all predictions
CREATE POLICY "predictions_select_recruiter"
    ON public.recruitment_predictions FOR SELECT
    USING (get_current_user_role() IN ('recruiter', 'admin'));

-- Backend inserts predictions
CREATE POLICY "predictions_insert_own"
    ON public.recruitment_predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- STORAGE: cv-files bucket policies
-- SECURITY: cv-files bucket MUST be set to PRIVATE (not public).
-- These policies control signed URL generation via Supabase Storage.
-- Run these SQL statements in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Step 1: Create the private bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cv-files',
    'cv-files',
    FALSE,  -- PRIVATE bucket: no public URLs
    10485760,  -- 10 MB max file size
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]
) ON CONFLICT (id) DO UPDATE SET
    public = FALSE,  -- Enforce private on conflict
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Candidates upload their own CV files (path: {user_id}/filename)
CREATE POLICY "cv_files_upload_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (string_to_array(name, '/'))[1]
    );

-- Step 4: Candidates can READ (view/download) their own CV files
CREATE POLICY "cv_files_select_own"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (string_to_array(name, '/'))[1]
    );

-- Step 5: Candidates can REPLACE (upsert) their own CV files
CREATE POLICY "cv_files_update_own"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (string_to_array(name, '/'))[1]
    );

-- Step 6: Candidates can DELETE their own CV files
CREATE POLICY "cv_files_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (string_to_array(name, '/'))[1]
    );

-- Step 7: Recruiters can READ CV files for candidates who applied to their jobs
-- SECURITY: Access is scoped to recruiter's own job applicants ONLY.
-- A recruiter cannot access CVs of candidates who never applied to their jobs.
CREATE POLICY "cv_files_select_recruiter_scoped"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'cv-files'
        AND auth.role() = 'authenticated'
        AND (
            -- Must be a recruiter or admin
            (SELECT role FROM public.users WHERE id = auth.uid()) IN ('recruiter', 'admin')
        )
        AND (
            -- The CV owner (first path segment = user_id) must have applied
            -- to at least one job belonging to this recruiter
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

-- Step 8: Backend service role has full access (bypasses RLS for AI processing)
-- This is already handled by using SUPABASE_SERVICE_KEY in the backend.
-- No additional policy needed — service_role bypasses RLS by default.

-- ============================================================
-- TIGHTENED RLS: candidate_profiles — restrict recruiter access
-- ============================================================

-- Drop the overly broad recruiter policy (replaced with scoped version)
DROP POLICY IF EXISTS "candidate_profiles_select_recruiter" ON public.candidate_profiles;

-- Recruiters can ONLY read profiles of candidates who applied to their jobs
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

-- ============================================================
-- TIGHTENED RLS: cv_analysis — restrict recruiter access
-- ============================================================

DROP POLICY IF EXISTS "cv_analysis_select_recruiter" ON public.cv_analysis;

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

-- ============================================================
-- TIGHTENED RLS: recruitment_predictions — restrict recruiter access
-- ============================================================

DROP POLICY IF EXISTS "predictions_select_recruiter" ON public.recruitment_predictions;

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


-- ============================================================
-- TABLE: candidate_resumes
-- ============================================================
ALTER TABLE public.candidate_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidate_resumes_select_own"
    ON public.candidate_resumes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "candidate_resumes_insert_own"
    ON public.candidate_resumes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "candidate_resumes_update_own"
    ON public.candidate_resumes FOR UPDATE
    USING (auth.uid() = user_id);

