-- ============================================================
-- FEEDBACK TABLE MIGRATION
-- TalentLens AI — Candidate Experience Feedback System
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id                           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id                      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    application_id               uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    overall_rating               integer NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    ease_of_use_rating           integer NOT NULL CHECK (ease_of_use_rating BETWEEN 1 AND 5),
    ui_design_rating             integer NOT NULL CHECK (ui_design_rating BETWEEN 1 AND 5),
    recommendation_accuracy_rating integer NOT NULL CHECK (recommendation_accuracy_rating BETWEEN 1 AND 5),
    recommendation_score         integer NOT NULL CHECK (recommendation_score BETWEEN 0 AND 10),
    favorite_feature             text CHECK (favorite_feature IN (
                                    'CV Analysis',
                                    'Job Matching',
                                    'Resume Builder',
                                    'Application Tracking',
                                    'Email Notifications',
                                    'Overall Experience'
                                 )),
    comment                      text,
    created_at                   timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT feedback_unique_per_application UNIQUE (user_id, application_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Candidates can insert their own feedback
CREATE POLICY "Candidates can submit feedback"
    ON public.feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Candidates can view their own feedback
CREATE POLICY "Candidates can view own feedback"
    ON public.feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role (backend) has full access (bypasses RLS via service key)
-- No extra policy needed; supabase service_role key bypasses RLS by default.

-- 4. Comments for documentation
COMMENT ON TABLE public.feedback IS
  'Post-recruitment experience feedback submitted by candidates after accepted/rejected decisions.';
COMMENT ON COLUMN public.feedback.recommendation_score IS
  'NPS-style score 0–10: Would you recommend TalentLens AI to others?';
COMMENT ON COLUMN public.feedback.favorite_feature IS
  'Feature the candidate found most valuable during the recruitment journey.';
