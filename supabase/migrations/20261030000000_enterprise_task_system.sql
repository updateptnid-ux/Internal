-- ==============================================================================
-- ENTERPRISE OUTPUT/KPI TASK MANAGEMENT SYSTEM (STRICT MULTI-LAYER SECURITY)
-- Stack: Supabase (PostgreSQL 15+)
-- Rules:
-- 1. kpi_weight HANYA boleh di-INSERT dan di-UPDATE oleh assigner_id atau OWNER.
-- 2. assignee_id (Staf) HANYA READ kpi_weight, DILARANG KERAS memodifikasi.
-- 3. Zero-Trust Data Isolation: Semua user HANYA melihat data mereka sendiri,
--    kecuali OWNER yang memiliki God-Mode akses menyeluruh.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'MANAGER', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attachment_file_type AS ENUM ('DOCUMENT', 'IMAGE', 'LINK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_action_type AS ENUM (
        'STATUS_CHANGE', 
        'COMMENT', 
        'EVIDENCE_UPLOAD', 
        'APPROVAL_ACC', 
        'REVISION_REJECT',
        'PROGRESS_UPDATE',
        'REASSIGN',
        'KPI_WEIGHT_CHANGE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. DIVISIONS TABLE
CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4. PROFILES TABLE (Supabase auth.users extension)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    whatsapp_number VARCHAR(20) NOT NULL,
    role user_role NOT NULL DEFAULT 'STAFF',
    division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 5. TASKS TABLE (Output-based, KPI Weighted)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    status task_status NOT NULL DEFAULT 'TODO',
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    kpi_weight SMALLINT NOT NULL DEFAULT 1 CHECK (kpi_weight BETWEEN 1 AND 10),
    progress_percentage SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 6. TASK ATTACHMENTS TABLE (Proof of Work / Deliverables)
CREATE TABLE IF NOT EXISTS public.task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    file_url TEXT NOT NULL,
    file_type attachment_file_type NOT NULL DEFAULT 'DOCUMENT',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 7. TASK ACTIVITIES TABLE (Immutable Audit Trail / Black Box)
CREATE TABLE IF NOT EXISTS public.task_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action_type activity_action_type NOT NULL,
    old_value TEXT,
    new_value TEXT,
    comment_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 8. USER KPI RECORDS TABLE (Raport Performa Bulanan)
CREATE TABLE IF NOT EXISTS public.user_kpi_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: 'MM-YYYY', cth: '10-2026'
    total_tasks_completed INTEGER NOT NULL DEFAULT 0,
    total_tasks_overdue INTEGER NOT NULL DEFAULT 0,
    total_kpi_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_user_month_year UNIQUE (user_id, month_year)
);

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON public.tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigner_status ON public.tasks(assigner_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_task_created ON public.task_activities(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_kpi_user_month ON public.user_kpi_records(user_id, month_year);

-- 10. AUTOMATED TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_timestamp ON public.profiles;
CREATE TRIGGER trigger_update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_tasks_timestamp ON public.tasks;
CREATE TRIGGER trigger_update_tasks_timestamp
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_kpi_timestamp ON public.user_kpi_records;
CREATE TRIGGER trigger_update_kpi_timestamp
    BEFORE UPDATE ON public.user_kpi_records
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. AUTOMATIC PROFILE CREATION TRIGGER (auth.users sync)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, whatsapp_number, role, division_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Enterprise Staff'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'STAFF'::user_role),
        (NEW.raw_user_meta_data->>'division_id')::UUID
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- PART 2: ENTERPRISE RBAC & APPROVAL WORKFLOW GUARDS
-- ==============================================================================

-- Security Helper Functions (SECURITY DEFINER stops infinite recursion in RLS subqueries)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_division()
RETURNS UUID AS $$
    SELECT division_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- GUARD 1: KPI WEIGHT & TASK CREATION PRIVILEGE (ON INSERT)
-- ------------------------------------------------------------------------------
-- Memastikan HANYA Assigner atau OWNER yang dapat membuat tugas & menentukan bobot kpi_weight
CREATE OR REPLACE FUNCTION public.enforce_task_insert_security()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_role user_role;
    v_actor_id UUID;
BEGIN
    v_actor_id := auth.uid();
    v_actor_role := public.get_auth_role();

    -- Jika actor bukan OWNER, maka creator WAJIB menjadi assigner_id
    IF (v_actor_role != 'OWNER' AND v_actor_id != NEW.assigner_id) THEN
        RAISE EXCEPTION 'Security Violation: Anda tidak berhak membuat tugas atau menetapkan bobot KPI untuk penugasan orang lain.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_task_insert_security ON public.tasks;
CREATE TRIGGER trigger_task_insert_security
    BEFORE INSERT ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.enforce_task_insert_security();

-- ------------------------------------------------------------------------------
-- GUARD 2: STRICT KPI WEIGHT MUTATION & APPROVAL WORKFLOW (ON UPDATE)
-- ------------------------------------------------------------------------------
-- 1. kpi_weight HANYA BOLEH diubah oleh assigner_id atau OWNER.
-- 2. assignee_id (Staf pelaksana) DILARANG KERAS mengubah kpi_weight.
-- 3. Staff HANYA bisa menggeser status maksimal sampai 'IN_REVIEW'. DILARANG ubah ke 'DONE' atau 'REJECTED'.
-- 4. HANYA Owner atau Assigner yang dapat menyetujui 'DONE' (Approval ACC) atau 'REJECTED' (Revisi).
-- 5. Saat status menjadi 'DONE', bobot 'kpi_weight' diakumulasikan otomatis ke 'user_kpi_records'.
CREATE OR REPLACE FUNCTION public.enforce_approval_and_kpi_security()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_role user_role;
    v_actor_id UUID;
    v_month_year VARCHAR(7);
    v_is_overdue BOOLEAN;
BEGIN
    v_actor_id := auth.uid();
    v_actor_role := public.get_auth_role();

    -- Rule 1: KPI WEIGHT INTEGRITY PROTECTION
    -- Jika kpi_weight berubah, HANYA boleh dilakukan oleh assigner_id atau OWNER
    IF (OLD.kpi_weight IS DISTINCT FROM NEW.kpi_weight) THEN
        IF (v_actor_role != 'OWNER' AND v_actor_id != OLD.assigner_id) THEN
            RAISE EXCEPTION 'Security Violation: Bobot KPI (kpi_weight) HANYA BOLEH diubah oleh Pemberi Tugas (Assigner) atau Owner. Penerima tugas (Assignee) DILARANG KERAS memodifikasi bobot ini.';
        END IF;
    END IF;

    -- Rule 2: WORKFLOW STATUS PROTECTION (STAFF / ASSIGNEE)
    IF (v_actor_role = 'STAFF' OR v_actor_id = OLD.assignee_id) THEN
        -- Staff tidak boleh langsung mengubah ke status DONE atau REJECTED
        IF (NEW.status IN ('DONE', 'REJECTED') AND OLD.status NOT IN ('DONE', 'REJECTED')) THEN
            IF (v_actor_role != 'OWNER' AND v_actor_id != OLD.assigner_id) THEN
                RAISE EXCEPTION 'RBAC Approval Violation: Staf penerima tugas (Assignee) hanya diizinkan menggeser status hingga IN_REVIEW. Status DONE (ACC) atau REJECTED hanya dapat diputuskan oleh Assigner atau Owner.';
            END IF;
        END IF;

        -- Staff tidak boleh mengubah relasi penugasan
        IF (OLD.assigner_id IS DISTINCT FROM NEW.assigner_id OR
            OLD.assignee_id IS DISTINCT FROM NEW.assignee_id OR
            OLD.division_id IS DISTINCT FROM NEW.division_id) THEN
            IF (v_actor_role != 'OWNER' AND v_actor_id != OLD.assigner_id) THEN
                RAISE EXCEPTION 'RBAC Violation: Anda dilarang memodifikasi relasi penugasan (assigner, assignee, divisi).';
            END IF;
        END IF;
    END IF;

    -- Rule 3: APPROVAL ACC & REJECTION PRIVILEGE
    IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('DONE', 'REJECTED')) THEN
        IF (v_actor_role != 'OWNER' AND v_actor_id != OLD.assigner_id) THEN
            RAISE EXCEPTION 'Approval Privilege Error: Hanya Pemberi Tugas (Assigner) atau Owner yang memiliki wewenang untuk meng-ACC (DONE) atau menolak revisi tugas ini.';
        END IF;
    END IF;

    -- Rule 4: AUTOMATED KPI SCORE ACCUMULATION (Saat status resmi menjadi DONE)
    IF (OLD.status IS DISTINCT FROM 'DONE' AND NEW.status = 'DONE') THEN
        NEW.progress_percentage := 100;
        v_month_year := TO_CHAR(TIMEZONE('utc', NOW()), 'MM-YYYY');
        v_is_overdue := (OLD.due_date IS NOT NULL AND TIMEZONE('utc', NOW()) > OLD.due_date);

        -- Upsert raport KPI bulanan untuk staf pelaksana (Assignee)
        INSERT INTO public.user_kpi_records (
            user_id, 
            month_year, 
            total_tasks_completed, 
            total_tasks_overdue, 
            total_kpi_score
        )
        VALUES (
            NEW.assignee_id,
            v_month_year,
            1,
            CASE WHEN v_is_overdue THEN 1 ELSE 0 END,
            NEW.kpi_weight
        )
        ON CONFLICT (user_id, month_year) DO UPDATE SET
            total_tasks_completed = public.user_kpi_records.total_tasks_completed + 1,
            total_tasks_overdue = public.user_kpi_records.total_tasks_overdue + CASE WHEN v_is_overdue THEN 1 ELSE 0 END,
            total_kpi_score = public.user_kpi_records.total_kpi_score + NEW.kpi_weight,
            updated_at = TIMEZONE('utc', NOW());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_enforce_approval_workflow ON public.tasks;
CREATE TRIGGER trigger_enforce_approval_workflow
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.enforce_approval_and_kpi_security();

-- AUTOMATED AUDIT TRAIL TRIGGER (Mencakup APPROVAL_ACC, REVISION_REJECT, & STATUS_CHANGE)
CREATE OR REPLACE FUNCTION public.track_task_activities()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_action activity_action_type;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        v_actor_id := NEW.assignee_id;
    END IF;

    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        IF (NEW.status = 'DONE') THEN
            v_action := 'APPROVAL_ACC';
        ELSIF (NEW.status = 'REJECTED') THEN
            v_action := 'REVISION_REJECT';
        ELSE
            v_action := 'STATUS_CHANGE';
        END IF;

        INSERT INTO public.task_activities (task_id, user_id, action_type, old_value, new_value)
        VALUES (NEW.id, v_actor_id, v_action, OLD.status::TEXT, NEW.status::TEXT);
    END IF;

    IF (OLD.progress_percentage IS DISTINCT FROM NEW.progress_percentage) THEN
        INSERT INTO public.task_activities (task_id, user_id, action_type, old_value, new_value)
        VALUES (NEW.id, v_actor_id, 'PROGRESS_UPDATE', OLD.progress_percentage::TEXT || '%', NEW.progress_percentage::TEXT || '%');
    END IF;

    IF (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
        INSERT INTO public.task_activities (task_id, user_id, action_type, old_value, new_value)
        VALUES (NEW.id, v_actor_id, 'REASSIGN', OLD.assignee_id::TEXT, NEW.assignee_id::TEXT);
    END IF;

    IF (OLD.kpi_weight IS DISTINCT FROM NEW.kpi_weight) THEN
        INSERT INTO public.task_activities (task_id, user_id, action_type, old_value, new_value)
        VALUES (NEW.id, v_actor_id, 'KPI_WEIGHT_CHANGE', OLD.kpi_weight::TEXT, NEW.kpi_weight::TEXT);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_audit_tasks ON public.tasks;
CREATE TRIGGER trigger_auto_audit_tasks
    AFTER UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.track_task_activities();

-- TRIGGER AUDIT TRAIL PENGUMPULAN BUKTI KERJA (EVIDENCE_UPLOAD)
CREATE OR REPLACE FUNCTION public.track_evidence_upload()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.task_activities (task_id, user_id, action_type, old_value, new_value, comment_text)
    VALUES (
        NEW.task_id, 
        NEW.uploaded_by, 
        'EVIDENCE_UPLOAD', 
        NULL, 
        NEW.file_type::TEXT, 
        NEW.notes
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_audit_evidence ON public.task_attachments;
CREATE TRIGGER trigger_auto_audit_evidence
    AFTER INSERT ON public.task_attachments
    FOR EACH ROW EXECUTE FUNCTION public.track_evidence_upload();

-- ==============================================================================
-- PART 3: ZERO-TRUST ROW LEVEL SECURITY (RLS) POLICIES
-- Aturan: Semua user HANYA melihat data mereka sendiri, kecuali role OWNER
-- ==============================================================================

ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_kpi_records ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. DIVISIONS
-- ------------------------------------------------------------------------------
CREATE POLICY "divisions_read_authenticated"
    ON public.divisions FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "divisions_owner_crud"
    ON public.divisions FOR ALL TO authenticated
    USING (public.get_auth_role() = 'OWNER')
    WITH CHECK (public.get_auth_role() = 'OWNER');

-- ------------------------------------------------------------------------------
-- B. PROFILES
-- User hanya bisa melihat profil mereka sendiri, profil Owner, atau pihak yang berkolaborasi dalam task
-- ------------------------------------------------------------------------------
CREATE POLICY "profiles_select_policy"
    ON public.profiles FOR SELECT TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR id = auth.uid()
        OR role = 'OWNER'
        OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE (t.assignee_id = profiles.id AND t.assigner_id = auth.uid())
               OR (t.assigner_id = profiles.id AND t.assignee_id = auth.uid())
        )
    );

CREATE POLICY "profiles_update_policy"
    ON public.profiles FOR UPDATE TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR id = auth.uid()
    )
    WITH CHECK (
        public.get_auth_role() = 'OWNER'
        OR (id = auth.uid() AND role = public.get_auth_role())
    );

-- ------------------------------------------------------------------------------
-- C. TASKS POLICIES (STRICT DATA ISOLATION)
-- Non-Owner HANYA bisa melihat tugas di mana mereka adalah Assignee atau Assigner
-- ------------------------------------------------------------------------------
-- SELECT:
-- 1. OWNER: Melihat semua tugas perusahaan.
-- 2. Non-Owner: HANYA tugas miliknya (sebagai assignee_id atau assigner_id).
CREATE POLICY "tasks_select_policy"
    ON public.tasks FOR SELECT TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR assignee_id = auth.uid()
        OR assigner_id = auth.uid()
    );

-- INSERT:
-- HANYA OWNER atau Assigner (pembuat tugas mandiri).
CREATE POLICY "tasks_insert_policy"
    ON public.tasks FOR INSERT TO authenticated
    WITH CHECK (
        public.get_auth_role() = 'OWNER'
        OR assigner_id = auth.uid()
    );

-- UPDATE:
-- 1. OWNER: Full Update.
-- 2. Non-Owner: HANYA tugas yang melibatkan mereka (Assignee atau Assigner).
-- (Integritas kpi_weight dan status dikawal oleh trigger 'trigger_enforce_approval_workflow')
CREATE POLICY "tasks_update_policy"
    ON public.tasks FOR UPDATE TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR assignee_id = auth.uid()
        OR assigner_id = auth.uid()
    )
    WITH CHECK (
        public.get_auth_role() = 'OWNER'
        OR assignee_id = auth.uid()
        OR assigner_id = auth.uid()
    );

-- DELETE:
-- HANYA OWNER atau Assigner asli dari tugas tersebut
CREATE POLICY "tasks_delete_policy"
    ON public.tasks FOR DELETE TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR assigner_id = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- D. TASK ATTACHMENTS (Bukti Kerja / Proof of Work)
-- ------------------------------------------------------------------------------
-- READ: Hanya mereka yang berhak melihat task (Owner, Assignee, Assigner)
CREATE POLICY "task_attachments_select_policy"
    ON public.task_attachments FOR SELECT TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_attachments.task_id
            AND (t.assignee_id = auth.uid() OR t.assigner_id = auth.uid())
        )
    );

-- INSERT: Assignee atau Assigner dari tugas tersebut, atau Owner
CREATE POLICY "task_attachments_insert_policy"
    ON public.task_attachments FOR INSERT TO authenticated
    WITH CHECK (
        public.get_auth_role() = 'OWNER'
        OR (
            uploaded_by = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.tasks t
                WHERE t.id = task_id
                AND (t.assignee_id = auth.uid() OR t.assigner_id = auth.uid())
            )
        )
    );

CREATE POLICY "task_attachments_delete_policy"
    ON public.task_attachments FOR DELETE TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR uploaded_by = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- E. TASK ACTIVITIES (Audit Trail Kotak Hitam)
-- ------------------------------------------------------------------------------
CREATE POLICY "task_activities_select_policy"
    ON public.task_activities FOR SELECT TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_activities.task_id
            AND (t.assignee_id = auth.uid() OR t.assigner_id = auth.uid())
        )
    );

CREATE POLICY "task_activities_insert_policy"
    ON public.task_activities FOR INSERT TO authenticated
    WITH CHECK (
        public.get_auth_role() = 'OWNER'
        OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id 
            AND (t.assignee_id = auth.uid() OR t.assigner_id = auth.uid())
        )
    );

CREATE POLICY "task_activities_delete_policy"
    ON public.task_activities FOR DELETE TO authenticated
    USING (public.get_auth_role() = 'OWNER');

-- ------------------------------------------------------------------------------
-- F. USER KPI RECORDS (Raport Performa Bulanan)
-- ------------------------------------------------------------------------------
-- Non-Owner HANYA bisa melihat raport KPI mereka sendiri
CREATE POLICY "user_kpi_records_select_policy"
    ON public.user_kpi_records FOR SELECT TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR user_id = auth.uid()
    );

CREATE POLICY "user_kpi_records_owner_mutation"
    ON public.user_kpi_records FOR ALL TO authenticated
    USING (public.get_auth_role() = 'OWNER')
    WITH CHECK (public.get_auth_role() = 'OWNER');

-- Realtime Configuration
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_kpi_records;
