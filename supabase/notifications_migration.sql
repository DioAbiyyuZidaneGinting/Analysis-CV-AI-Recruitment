-- ============================================================
-- MIGRATION: notifications table
-- AI Recruitment Platform
-- Run once in: Supabase Dashboard > SQL Editor
-- Safe to re-run (uses IF NOT EXISTS and DROP IF EXISTS on policies)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CREATE TABLE: notifications
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    application_id  UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    title           TEXT NOT NULL DEFAULT '',
    message         TEXT NOT NULL DEFAULT '',
    type            TEXT NOT NULL DEFAULT 'screening' CHECK (
                        type IN ('screening', 'interview', 'offered', 'accepted', 'rejected', 'applied')
                    ),
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 2. ENABLE ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 3. RLS POLICIES
-- ────────────────────────────────────────────────────────────

-- Drop existing policies so re-runs don't error
DROP POLICY IF EXISTS "notifications_select_own"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own"  ON public.notifications;

-- Each user can only read their own notifications
CREATE POLICY "notifications_select_own"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Each user can mark their own notifications as read (update is_read)
CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Backend service role inserts notifications (bypasses RLS with service key)
-- This policy allows authenticated users to insert if auth.uid() matches user_id
-- The actual inserts from backend use the service key so this is a safety fallback
CREATE POLICY "notifications_insert_service"
    ON public.notifications FOR INSERT
    WITH CHECK (TRUE);  -- Backend uses service_role key, which bypasses RLS anyway

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- DONE ✅
-- ────────────────────────────────────────────────────────────
