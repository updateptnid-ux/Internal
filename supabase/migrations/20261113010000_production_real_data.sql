-- ==============================================================================
-- PRODUCTION SCHEMA: INTERNAL UPDATE PTN (100% REAL DATA)
-- - Tanpa seed / mock data
-- - profiles terhubung langsung ke auth.users (dibuat otomatis via trigger)
-- - Metrik kinerja dihitung murni dari status & tenggat tugas
-- - Realtime aktif untuk calendar_tasks, kpi_jobdesks, task_pings, profiles
-- Jalankan sekali di Supabase SQL Editor.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BERSIHKAN SKEMA LAMA (termasuk seluruh data dummy)
DROP TABLE IF EXISTS public.task_pings CASCADE;
DROP TABLE IF EXISTS public.calendar_tasks CASCADE;
DROP TABLE IF EXISTS public.kpi_jobdesks CASCADE;
DROP TABLE IF EXISTS public.performance_evaluations CASCADE;
DROP TABLE IF EXISTS public.kpi_metrics CASCADE;
DROP TABLE IF EXISTS public.task_activities CASCADE;
DROP TABLE IF EXISTS public.task_attachments CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.divisions CASCADE;

-- 2. PROFILES (1:1 dengan auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    whatsapp_number TEXT,
    role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'TEAM')),
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. KPI JOBDESKS (poin jobdesk dinamis berbobot)
CREATE TABLE public.kpi_jobdesks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
    weight SMALLINT NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    period_month TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CALENDAR TASKS (to-do list kalender)
CREATE TABLE public.calendar_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
    description TEXT,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    completed_at TIMESTAMPTZ,
    ping_count INTEGER NOT NULL DEFAULT 0,
    last_pinged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (due_date >= start_time)
);

-- 5. TASK PINGS (notifikasi "Ingatkan")
CREATE TABLE public.task_pings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.calendar_tasks(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INDEXES
CREATE INDEX idx_kpi_jobdesks_owner_period ON public.kpi_jobdesks(owner_id, period_month);
CREATE INDEX idx_calendar_tasks_assignee ON public.calendar_tasks(assignee_id);
CREATE INDEX idx_calendar_tasks_start ON public.calendar_tasks(start_time);
CREATE INDEX idx_calendar_tasks_due ON public.calendar_tasks(due_date);
CREATE INDEX idx_task_pings_recipient ON public.task_pings(recipient_id, is_read);

-- 7. TRIGGERS: updated_at & completed_at otomatis
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_task_completed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'COMPLETED') THEN
        NEW.completed_at := NOW();
    ELSIF NEW.status <> 'COMPLETED' THEN
        NEW.completed_at := NULL;
    END IF;
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_jobdesk_completed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_completed AND (TG_OP = 'INSERT' OR NOT OLD.is_completed) THEN
        NEW.completed_at := NOW();
    ELSIF NOT NEW.is_completed THEN
        NEW.completed_at := NULL;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_jobdesks_updated BEFORE UPDATE ON public.kpi_jobdesks
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_jobdesks_completed BEFORE INSERT OR UPDATE ON public.kpi_jobdesks
    FOR EACH ROW EXECUTE FUNCTION public.sync_jobdesk_completed_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.calendar_tasks
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_tasks_completed BEFORE INSERT OR UPDATE ON public.calendar_tasks
    FOR EACH ROW EXECUTE FUNCTION public.sync_task_completed_at();

-- 8. AUTO-CREATE PROFILE SAAT USER AUTH DIBUAT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, whatsapp_number, role, title)
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'whatsapp_number', ''),
        CASE WHEN NEW.raw_user_meta_data->>'role' = 'TEAM' THEN 'TEAM' ELSE 'OWNER' END,
        NULLIF(NEW.raw_user_meta_data->>'title', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. BACKFILL: akun auth yang sudah ada langsung punya profil
INSERT INTO public.profiles (id, full_name, email, whatsapp_number, role, title)
SELECT
    u.id,
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
    u.email,
    NULLIF(u.raw_user_meta_data->>'whatsapp_number', ''),
    CASE WHEN u.raw_user_meta_data->>'role' = 'TEAM' THEN 'TEAM' ELSE 'OWNER' END,
    NULLIF(u.raw_user_meta_data->>'title', '')
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 10. KONFIRMASI akun yang masih "Waiting for verification" (frictionless auth)
UPDATE auth.users SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 11. ROW LEVEL SECURITY (hanya user yang login)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_jobdesks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY jobdesks_all ON public.kpi_jobdesks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY tasks_all ON public.calendar_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY pings_select ON public.task_pings FOR SELECT TO authenticated
    USING (auth.uid() = recipient_id OR auth.uid() = sender_id);
CREATE POLICY pings_insert ON public.task_pings FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);
CREATE POLICY pings_mark_read ON public.task_pings FOR UPDATE TO authenticated
    USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

-- 12. REALTIME
ALTER TABLE public.calendar_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.kpi_jobdesks REPLICA IDENTITY FULL;
ALTER TABLE public.task_pings REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['calendar_tasks', 'kpi_jobdesks', 'task_pings', 'profiles'] LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END LOOP;
END $$;

