-- ==============================================================================
-- MIGRATION: ACCOUNT APPROVAL FLOW & ZERO-TRUST ONBOARDING
-- 1. Menambahkan enum account_status ('PENDING', 'ACTIVE', 'REJECTED')
-- 2. Menambahkan kolom account_status ke tabel profiles (default 'PENDING')
-- 3. Mengamankan mutasi account_status: HANYA role OWNER yang berhak mengubahnya
-- ==============================================================================

-- 1. ENUM TYPE
DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ALTER TABLE PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status account_status NOT NULL DEFAULT 'PENDING';

-- Set semua akun OWNER yang ada menjadi ACTIVE secara default
UPDATE public.profiles 
SET account_status = 'ACTIVE' 
WHERE role = 'OWNER';

-- 3. PERBARUI TRIGGER handle_new_user AGAR STATUS DEFAULT ADALAH PENDING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        full_name, 
        email, 
        whatsapp_number, 
        role, 
        division_id, 
        account_status
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anggota Tim Baru'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'STAFF'::user_role),
        (NEW.raw_user_meta_data->>'division_id')::UUID,
        'PENDING'::account_status
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        division_id = COALESCE(EXCLUDED.division_id, public.profiles.division_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER KEAMANAN: HANYA OWNER YANG BOLEH ACC ACCOUNT_STATUS ATAU UBAH ROLE
CREATE OR REPLACE FUNCTION public.enforce_profile_update_security()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_role user_role;
    v_actor_id UUID;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_actor_id := auth.uid();
        v_actor_role := public.get_auth_role();

        -- Jika account_status berubah, HANYA boleh dilakukan oleh role OWNER
        IF (OLD.account_status IS DISTINCT FROM NEW.account_status) THEN
            IF (v_actor_role != 'OWNER') THEN
                RAISE EXCEPTION 'Security Violation: Hanya jajaran Owner yang berhak menyetujui (ACC) status akun pendaftaran staf.';
            END IF;
        END IF;

        -- Jika role berubah, HANYA boleh dilakukan oleh role OWNER
        IF (OLD.role IS DISTINCT FROM NEW.role) THEN
            IF (v_actor_role != 'OWNER') THEN
                RAISE EXCEPTION 'Security Violation: Hanya jajaran Owner yang berhak menetapkan role jabatan pengguna.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_profile_update_security ON public.profiles;
CREATE TRIGGER trigger_profile_update_security
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_update_security();

-- 5. RLS POLICY UPDATE UNTUK PROFILES
-- OWNER berhak meng-update seluruh profil, non-owner hanya profil sendiri (keamanan role & status dijaga trigger)
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
    ON public.profiles FOR UPDATE TO authenticated
    USING (
        public.get_auth_role() = 'OWNER'
        OR id = auth.uid()
    )
    WITH CHECK (
        public.get_auth_role() = 'OWNER'
        OR id = auth.uid()
    );
