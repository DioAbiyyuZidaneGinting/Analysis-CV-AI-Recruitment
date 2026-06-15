-- MIGRATION: email_logs table for Gmail SMTP Notifications

-- 1. CREATE TABLE: email_logs
CREATE TABLE IF NOT EXISTS public.email_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id    UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    recipient_email   TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('screening', 'interview', 'offered', 'accepted', 'rejected')),
    delivery_status   TEXT NOT NULL CHECK (delivery_status IN ('success', 'failed')),
    error_message     TEXT,
    sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_email_logs_application_id ON public.email_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(notification_type);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
DROP POLICY IF EXISTS "email_logs_select_own" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_insert_service" ON public.email_logs;

-- Each candidate or recruiter can view email logs related to their own applications
CREATE POLICY "email_logs_select_own"
    ON public.email_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = email_logs.application_id
            AND (a.candidate_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.jobs j
                WHERE j.id = a.job_id
                AND j.recruiter_id = auth.uid()
            ))
        )
    );

-- Backend service role can insert email logs (bypasses RLS with service key)
CREATE POLICY "email_logs_insert_service"
    ON public.email_logs FOR INSERT
    TO service_role
    WITH CHECK (true);
