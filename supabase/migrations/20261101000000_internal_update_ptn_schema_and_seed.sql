-- ==============================================================================
-- ENTERPRISE TASK MANAGEMENT SYSTEM - INTERNAL UPDATE PTN (EDTECH)
-- Stack: Supabase (PostgreSQL 15+)
-- Mencakup:
-- 1. 9 Divisi Operasional (Project Management, Marketing, Try Out, Bimbel,
--    Keuangan, SDM, Cek Skor, Admin, IT)
-- 2. Multi-Role / Peran Ganda pada tabel `profiles` (job_titles, secondary_divisions)
-- 3. Kategori Tugas (`B2B`, `Affiliate`, `Media Partnership`, `SEO`, `TikTok Live`, `Operasional`)
--    & Prioritas (`Tinggi`, `Sedang`, `Rendah`) pada tabel `tasks`
-- 4. Tabel `kpi_metrics` untuk pelacakan Target vs Aktual spesifik per divisi & PIC
-- 5. Tabel `performance_evaluations` dengan bobot:
--    Pencapaian KPI (60%) + Kolaborasi (25%) + Profesionalisme (15%)
-- 6. SEED DATA AWAL (Hardcoded) untuk 5 Anggota Tim Inti:
--    Arya, Zidan, Abdur, Zaki, dan Rendi beserta tugas & KPI EdTech PTN
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES UNTUK KATEGORI TUGAS & PRIORITAS INDONESIA
DO $$ BEGIN
    CREATE TYPE task_category AS ENUM (
        'B2B',
        'Affiliate',
        'Media Partnership',
        'SEO',
        'TikTok Live',
        'Operasional'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_indonesia AS ENUM (
        'Tinggi',
        'Sedang',
        'Rendah'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PEMBARUAN TABEL `divisions` (9 DIVISI OPERASIONAL PTN)
ALTER TABLE public.divisions
ADD COLUMN IF NOT EXISTS code VARCHAR(30),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS head_name VARCHAR(100);

-- 4. PEMBARUAN TABEL `profiles` UNTUK MENDUKUNG PERAN GANDA (MULTI-JOB)
-- Lepaskan constraint FK ketat ke auth.users bila perlu agar seed data 5 tim inti
-- dapat langsung dijalankan di SQL Editor sebelum/tanpa login manual.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_title VARCHAR(150),
ADD COLUMN IF NOT EXISTS job_titles TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS handled_divisions TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS kpi_score NUMERIC(5,2) NOT NULL DEFAULT 85.00,
ADD COLUMN IF NOT EXISTS collaboration_score NUMERIC(5,2) NOT NULL DEFAULT 85.00,
ADD COLUMN IF NOT EXISTS professionalism_score NUMERIC(5,2) NOT NULL DEFAULT 85.00,
ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(50) DEFAULT 'bg-slate-900';

-- 5. PEMBARUAN TABEL `tasks` UNTUK KATEGORI MARKETING/EDTECH & PRIORITAS INDONESIA
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS category task_category NOT NULL DEFAULT 'Operasional',
ADD COLUMN IF NOT EXISTS priority_label priority_indonesia NOT NULL DEFAULT 'Tinggi',
ADD COLUMN IF NOT EXISTS target_metric VARCHAR(150);

-- 6. TABEL `kpi_metrics` (PELACAKAN KPI SPESIFIK PER DIVISI & ANGGOTA TIM)
CREATE TABLE IF NOT EXISTS public.kpi_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    pic_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metric_name VARCHAR(200) NOT NULL,
    category task_category DEFAULT 'Operasional',
    target_value NUMERIC(12,2) NOT NULL,
    actual_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'Unit',
    weight_percentage SMALLINT NOT NULL DEFAULT 20 CHECK (weight_percentage BETWEEN 1 AND 100),
    period_month VARCHAR(7) NOT NULL DEFAULT '11-2026', -- Format: MM-YYYY
    status VARCHAR(30) NOT NULL DEFAULT 'ON_TRACK' CHECK (status IN ('ACHIEVED', 'ON_TRACK', 'AT_RISK')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 7. TABEL `performance_evaluations` (BOBOT: KPI 60%, KOLABORASI 25%, PROFESIONALISME 15%)
CREATE TABLE IF NOT EXISTS public.performance_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period_month VARCHAR(7) NOT NULL DEFAULT '11-2026',
    kpi_achievement_score NUMERIC(5,2) NOT NULL CHECK (kpi_achievement_score BETWEEN 0 AND 100),
    collaboration_score NUMERIC(5,2) NOT NULL CHECK (collaboration_score BETWEEN 0 AND 100),
    professionalism_score NUMERIC(5,2) NOT NULL CHECK (professionalism_score BETWEEN 0 AND 100),
    final_weighted_score NUMERIC(5,2) GENERATED ALWAYS AS (
        ROUND((kpi_achievement_score * 0.60) + (collaboration_score * 0.25) + (professionalism_score * 0.15), 2)
    ) STORED,
    evaluator_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_evaluation_profile_period UNIQUE (profile_id, period_month)
);

-- Index performa untuk kpi_metrics & tasks baru
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_label ON public.tasks(priority_label);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_division ON public.kpi_metrics(division_id);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_pic ON public.kpi_metrics(pic_id);

-- Enable RLS untuk tabel baru
ALTER TABLE public.kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kpi_metrics_read_all" ON public.kpi_metrics;
CREATE POLICY "kpi_metrics_read_all"
    ON public.kpi_metrics FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "kpi_metrics_write_owner" ON public.kpi_metrics;
CREATE POLICY "kpi_metrics_write_owner"
    ON public.kpi_metrics FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('OWNER', 'MANAGER'))
    WITH CHECK (public.get_auth_role() IN ('OWNER', 'MANAGER'));

DROP POLICY IF EXISTS "performance_evaluations_read_all" ON public.performance_evaluations;
CREATE POLICY "performance_evaluations_read_all"
    ON public.performance_evaluations FOR SELECT TO authenticated
    USING (true);

-- ==============================================================================
-- PART 2: SEED DATA AWAL (WAJIB UNTUK TESTING OPERASIONAL INTERNAL UPDATE PTN)
-- ==============================================================================

-- A. INSERT 9 DIVISI OPERASIONAL
INSERT INTO public.divisions (id, name, code, description, head_name)
VALUES
    ('11111111-1111-4111-8111-111111111101', 'Project Management', 'PM', 'Koordinasi timeline produk UTBK SNBT, sprint mingguan, dan sinkronisasi lintas divisi.', 'Arya'),
    ('11111111-1111-4111-8111-111111111102', 'Marketing', 'MKT', 'Strategi akuisisi peserta PTN (B2B Sekolah, Affiliate, Media Partnership, TikTok Live, SEO).', 'Arya'),
    ('11111111-1111-4111-8111-111111111103', 'Try Out', 'TO', 'Penyusunan soal IRT UTBK-SNBT, pelaksanaan Try Out Nasional, dan validasi bank soal.', 'Arya'),
    ('11111111-1111-4111-8111-111111111104', 'Bimbel', 'BMB', 'Manajemen kelas intensif SNBT/Mandiri, kurikulum tentor, dan retensi siswa bimbel.', 'Zidan'),
    ('11111111-1111-4111-8111-111111111105', 'Keuangan', 'FIN', 'Arus kas, rekonsiliasi payment gateway TO/Bimbel, pencairan komisi affiliate, dan budgeting.', 'Abdur'),
    ('11111111-1111-4111-8111-111111111106', 'SDM', 'HR', 'Rekrutmen tentor PTN, pengelolaan KPI internal, kolaborasi tim, dan evaluasi kedisiplinan.', 'Abdur'),
    ('11111111-1111-4111-8111-111111111107', 'Cek Skor', 'CSK', 'Layanan rasionalisasi nilai SNBP & simulasi peluang lolos prodi PTN berbasis data.', 'Zaki'),
    ('11111111-1111-4111-8111-111111111108', 'Admin', 'ADM', 'Customer support peserta, verifikasi grup WA peserta Try Out, dan administrasi mitra.', 'Zaki'),
    ('11111111-1111-4111-8111-111111111109', 'IT', 'IT', 'Infrastruktur server CBT Try Out, optimasi kecepatan web, sistem IRT, dan teknis SEO.', 'Rendi')
ON CONFLICT (name) DO UPDATE SET
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    head_name = EXCLUDED.head_name;

-- B. INSERT 5 ANGGOTA TIM INTI BESERTA JABATAN MULTI-ROLE (HARDCODED)
-- 1. Arya: Project Manager, PJ Marketing, PJ Try Out
-- 2. Zidan: PJ Bimbel, Marketing B2B & Affiliate
-- 3. Abdur: PJ Keuangan, PJ SDM, Marketing TikTok Live
-- 4. Zaki: PJ Cek Skor, PJ Admin, Marketing Media Partnership
-- 5. Rendi: PJ IT, Marketing SEO
INSERT INTO public.profiles (
    id,
    full_name,
    email,
    whatsapp_number,
    role,
    division_id,
    account_status,
    primary_title,
    job_titles,
    handled_divisions,
    kpi_score,
    collaboration_score,
    professionalism_score,
    avatar_color
)
VALUES
    (
        '22222222-2222-4222-8222-222222222201',
        'Arya',
        'arya@internalptn.id',
        '6281230001001',
        'OWNER',
        '11111111-1111-4111-8111-111111111101',
        'ACTIVE',
        'Project Manager',
        ARRAY['Project Manager', 'PJ Marketing', 'PJ Try Out'],
        ARRAY['Project Management', 'Marketing', 'Try Out'],
        94.00,
        92.00,
        95.00,
        'bg-slate-900'
    ),
    (
        '22222222-2222-4222-8222-222222222202',
        'Zidan',
        'zidan@internalptn.id',
        '6281230001002',
        'MANAGER',
        '11111111-1111-4111-8111-111111111104',
        'ACTIVE',
        'PJ Bimbel & B2B Lead',
        ARRAY['PJ Bimbel', 'Marketing B2B & Affiliate'],
        ARRAY['Bimbel', 'Marketing'],
        89.00,
        90.00,
        88.00,
        'bg-indigo-600'
    ),
    (
        '22222222-2222-4222-8222-222222222203',
        'Abdur',
        'abdur@internalptn.id',
        '6281230001003',
        'MANAGER',
        '11111111-1111-4111-8111-111111111105',
        'ACTIVE',
        'PJ Keuangan & SDM',
        ARRAY['PJ Keuangan', 'PJ SDM', 'Marketing TikTok Live'],
        ARRAY['Keuangan', 'SDM', 'Marketing'],
        87.00,
        89.00,
        92.00,
        'bg-emerald-600'
    ),
    (
        '22222222-2222-4222-8222-222222222204',
        'Zaki',
        'zaki@internalptn.id',
        '6281230001004',
        'MANAGER',
        '11111111-1111-4111-8111-111111111107',
        'ACTIVE',
        'PJ Cek Skor & Admin',
        ARRAY['PJ Cek Skor', 'PJ Admin', 'Marketing Media Partnership'],
        ARRAY['Cek Skor', 'Admin', 'Marketing'],
        86.00,
        88.00,
        90.00,
        'bg-amber-600'
    ),
    (
        '22222222-2222-4222-8222-222222222205',
        'Rendi',
        'rendi@internalptn.id',
        '6281230001005',
        'MANAGER',
        '11111111-1111-4111-8111-111111111109',
        'ACTIVE',
        'PJ IT & SEO Specialist',
        ARRAY['PJ IT', 'Marketing SEO'],
        ARRAY['IT', 'Marketing'],
        91.00,
        87.00,
        93.00,
        'bg-purple-600'
    )
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    primary_title = EXCLUDED.primary_title,
    job_titles = EXCLUDED.job_titles,
    handled_divisions = EXCLUDED.handled_divisions,
    kpi_score = EXCLUDED.kpi_score,
    collaboration_score = EXCLUDED.collaboration_score,
    professionalism_score = EXCLUDED.professionalism_score,
    account_status = 'ACTIVE';

-- C. INSERT KPI METRICS SPESIFIK PER DIVISI & PIC (EDTECH PTN)
DELETE FROM public.kpi_metrics WHERE period_month = '11-2026';

INSERT INTO public.kpi_metrics (
    division_id,
    pic_id,
    metric_name,
    category,
    target_value,
    actual_value,
    unit,
    weight_percentage,
    period_month,
    status,
    notes
)
VALUES
    -- Arya (Project Management, Marketing, Try Out)
    ('11111111-1111-4111-8111-111111111101', '22222222-2222-4222-8222-222222222201', 'Penyelesaian Milestone Sprint Produk PTN Tepat Waktu', 'Operasional', 100, 95, '%', 25, '11-2026', 'ON_TRACK', 'Rilis Batch 4 Try Out Akbar UTBK sesuai jadwal'),
    ('11111111-1111-4111-8111-111111111103', '22222222-2222-4222-8222-222222222201', 'Total Peserta Aktif Try Out Akbar UTBK-SNBT', 'Operasional', 10000, 9450, 'Peserta', 35, '11-2026', 'ON_TRACK', 'Pertumbuhan pendaftar organik & sekolah mitra naik 22%'),
    -- Zidan (Bimbel, Marketing B2B & Affiliate)
    ('11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222202', 'Siswa Terdaftar Kelas Intensif Bimbel UTBK', 'Operasional', 500, 445, 'Siswa', 30, '11-2026', 'ON_TRACK', '8 Kelas Reguler & 4 Kelas Platinum berjalan penuh'),
    ('11111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222202', 'Kerjasama B2B Sekolah SMA/MA & Konversi Affiliate', 'B2B', 35, 31, 'Sekolah', 30, '11-2026', 'ON_TRACK', '31 SMA Negeri/Swasta telah menandatangani MoU Try Out'),
    -- Abdur (Keuangan, SDM, Marketing TikTok Live)
    ('11111111-1111-4111-8111-111111111105', '22222222-2222-4222-8222-222222222203', 'Akurasi Rekonsiliasi Payment Gateway & Cashflow', 'Operasional', 100, 99, '%', 25, '11-2026', 'ACHIEVED', 'Settlement QRIS & Virtual Account H+1 tanpa selisih'),
    ('11111111-1111-4111-8111-111111111106', '22222222-2222-4222-8222-222222222203', 'Pemenuhan SLA Tentor & Retensi Tim Inti', 'Operasional', 95, 92, '%', 20, '11-2026', 'ON_TRACK', 'Seluruh jadwal pengajar Bimbel terisi 100%'),
    ('11111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222203', 'Total Viewers & Leads Sesi TikTok Live Pembahasan Soal', 'TikTok Live', 50000, 43800, 'Views', 25, '11-2026', 'ON_TRACK', 'Rata-rata 2.100 penonton per sesi live malam'),
    -- Zaki (Cek Skor, Admin, Marketing Media Partnership)
    ('11111111-1111-4111-8111-111111111107', '22222222-2222-4222-8222-222222222204', 'Pengguna Fitur Cek Skor & Rasionalisasi SNBP/SNBT', 'Operasional', 8000, 7120, 'Pengguna', 25, '11-2026', 'ON_TRACK', 'Database daya tampung 85 PTN telah diperbarui'),
    ('11111111-1111-4111-8111-111111111108', '22222222-2222-4222-8222-222222222204', 'SLA Respon Admin CS (< 5 Menit) & Aktivasi Paket', 'Operasional', 98, 95, '%', 20, '11-2026', 'ON_TRACK', 'Rata-rata waktu respon tiket kendala akun 3.2 menit'),
    ('11111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222204', 'Kolaborasi Media Partnership Info Kampus & OSIS', 'Media Partnership', 45, 39, 'Partner', 20, '11-2026', 'ON_TRACK', '39 Akun media edukasi & OSIS mempublikasikan poster TO'),
    -- Rendi (IT, Marketing SEO)
    ('11111111-1111-4111-8111-111111111109', '22222222-2222-4222-8222-222222222205', 'Uptime Server CBT Try Out Serentak & Kecepatan Load', 'Operasional', 99.9, 99.95, '%', 35, '11-2026', 'ACHIEVED', 'Zero downtime saat peak 4.500 concurrent user'),
    ('11111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222205', 'Trafik Organik SEO & Keyword Page-1 Google', 'SEO', 60000, 54900, 'Klik/Bulan', 30, '11-2026', 'ON_TRACK', '18 Keyword utama UTBK & Cek Skor masuk Top 3 Google');

-- D. INSERT EVALUASI KINERJA BULANAN (BOBOT: KPI 60%, KOLABORASI 25%, PROFESIONALISME 15%)
INSERT INTO public.performance_evaluations (
    profile_id,
    period_month,
    kpi_achievement_score,
    collaboration_score,
    professionalism_score,
    evaluator_notes
)
VALUES
    ('22222222-2222-4222-8222-222222222201', '11-2026', 94.00, 92.00, 95.00, 'Koordinasi lintas 9 divisi sangat solid; peluncuran Try Out Nasional Batch 4 tepat waktu.'),
    ('22222222-2222-4222-8222-222222222202', '11-2026', 89.00, 90.00, 88.00, 'Akuisisi sekolah B2B melampaui ekspektasi mingguan dan konversi affiliate ke kelas Bimbel tinggi.'),
    ('22222222-2222-4222-8222-222222222203', '11-2026', 87.00, 89.00, 92.00, 'Laporan keuangan selalu tepat waktu, evaluasi SDM tertib, dan jadwal TikTok Live konsisten.'),
    ('22222222-2222-4222-8222-222222222204', '11-2026', 86.00, 88.00, 90.00, 'Algoritma Cek Skor banyak menarik trafik organik dan antrean komplain peserta terselesaikan cepat.'),
    ('22222222-2222-4222-8222-222222222205', '11-2026', 91.00, 87.00, 93.00, 'Stabilitas engine CBT sangat prima dan peringkat SEO keyword prioritas naik signifikan.')
ON CONFLICT (profile_id, period_month) DO UPDATE SET
    kpi_achievement_score = EXCLUDED.kpi_achievement_score,
    collaboration_score = EXCLUDED.collaboration_score,
    professionalism_score = EXCLUDED.professionalism_score,
    evaluator_notes = EXCLUDED.evaluator_notes;

-- E. INSERT DAFTAR TUGAS OPERASIONAL & MARKETING (LINTAS 9 DIVISI & 5 KATEGORI)
-- Nonaktifkan sementara trigger insert security agar seed SQL berjalan tanpa sesi auth.uid()
ALTER TABLE public.tasks DISABLE TRIGGER trigger_task_insert_security;

INSERT INTO public.tasks (
    id,
    title,
    description,
    assigner_id,
    assignee_id,
    division_id,
    status,
    priority,
    priority_label,
    category,
    kpi_weight,
    progress_percentage,
    target_metric,
    due_date
)
VALUES
    (
        '33333333-3333-4333-8333-333333333301',
        'Finalisasi MoU B2B Try Out Akbar UTBK dengan 15 SMA Negeri Jawa Barat & Jawa Timur',
        'Menyelesaikan penandatanganan kerja sama paket Try Out kolektif untuk siswa kelas 12 melalui BK Sekolah.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111102',
        'IN_PROGRESS',
        'HIGH',
        'Tinggi',
        'B2B',
        9,
        80,
        '15 Sekolah (4.500 Siswa)',
        TIMEZONE('utc', NOW()) + INTERVAL '3 days'
    ),
    (
        '33333333-3333-4333-8333-333333333302',
        'Optimasi Load Balancing Server CBT & Pembobotan Skor IRT Try Out Batch 5',
        'Melakukan stress-test 10.000 concurrent users dan kalibrasi engine penilaian Item Response Theory (IRT).',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222205',
        '11111111-1111-4111-8111-111111111109',
        'IN_REVIEW',
        'URGENT',
        'Tinggi',
        'Operasional',
        10,
        100,
        'Uptime 99.95% & Latency < 120ms',
        TIMEZONE('utc', NOW()) + INTERVAL '2 days'
    ),
    (
        '33333333-3333-4333-8333-333333333303',
        'Eksekusi Marathon TikTok Live: Bedah Soal Penalaran Matematika & Rasionalisasi SNBT',
        'Menjalankan 7 sesi TikTok Live interaktif pukul 19.30 WIB bersama tentor utama untuk konversi paket Bimbel.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222203',
        '11111111-1111-4111-8111-111111111102',
        'IN_PROGRESS',
        'HIGH',
        'Tinggi',
        'TikTok Live',
        8,
        75,
        '50.000 Views & 350 Leads Baru',
        TIMEZONE('utc', NOW()) + INTERVAL '4 days'
    ),
    (
        '33333333-3333-4333-8333-333333333304',
        'Kalibrasi Database Daya Tampung & Keketatan Prodi PTN di Fitur Cek Skor',
        'Memperbarui indeks keketatan prodi UI, ITB, UGM, Unpad, ITS, dan Unair untuk akurasi rasionalisasi.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222204',
        '11111111-1111-4111-8111-111111111107',
        'DONE',
        'HIGH',
        'Tinggi',
        'Operasional',
        9,
        100,
        '85 PTN & 3.200 Program Studi',
        TIMEZONE('utc', NOW()) - INTERVAL '1 day'
    ),
    (
        '33333333-3333-4333-8333-333333333305',
        'Riset & Optimasi On-Page 25 Artikel SEO Cluster "Cek Skor UTBK & Try Out SNBT 2026"',
        'Optimasi struktur H1-H3, schema FAQ, dan internal linking ke halaman pendaftaran Try Out Gratis.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222205',
        '11111111-1111-4111-8111-111111111102',
        'IN_PROGRESS',
        'HIGH',
        'Tinggi',
        'SEO',
        8,
        85,
        'Top 3 SERP untuk 18 Keyword Utama',
        TIMEZONE('utc', NOW()) + INTERVAL '5 days'
    ),
    (
        '33333333-3333-4333-8333-333333333306',
        'Onboarding 40 Student Ambassador & Kreator Affiliate Kampus Batch November',
        'Distribusi kode voucher unik dan starter kit konten promosi untuk afiliator mahasiswa PTN.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111102',
        'DONE',
        'MEDIUM',
        'Sedang',
        'Affiliate',
        7,
        100,
        '40 Affiliate Aktif (1.200 Transaksi)',
        TIMEZONE('utc', NOW()) - INTERVAL '2 days'
    ),
    (
        '33333333-3333-4333-8333-333333333307',
        'Barter Publikasi Media Partnership dengan 25 Akun Info Lomba, Olimpiade & Kampus',
        'Negosiasi jadwal unggah feeds & story Instagram untuk dongkrak pendaftar Try Out Nasional.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222204',
        '11111111-1111-4111-8111-111111111102',
        'IN_PROGRESS',
        'MEDIUM',
        'Sedang',
        'Media Partnership',
        7,
        70,
        '25 Media Partner Terpublikasi',
        TIMEZONE('utc', NOW()) + INTERVAL '4 days'
    ),
    (
        '33333333-3333-4333-8333-333333333308',
        'Validasi Paket Soal & Pembahasan Video 7 Subtes Try Out Nasional Batch 5',
        'Review kualitas soal bersama tim akademik agar sesuai kerangka SNPMB terbaru.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111103',
        'IN_PROGRESS',
        'HIGH',
        'Tinggi',
        'Operasional',
        9,
        90,
        '155 Butir Soal Tervalidasi',
        TIMEZONE('utc', NOW()) + INTERVAL '2 days'
    ),
    (
        '33333333-3333-4333-8333-333333333309',
        'Rekonsiliasi Komisi Affiliate, Honor Tentor Bimbel & Laporan Cashflow Bulanan',
        'Verifikasi mutasi pembayaran paket bundel Try Out + Bimbel serta pembayaran bagi hasil mitra.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222203',
        '11111111-1111-4111-8111-111111111105',
        'TODO',
        'MEDIUM',
        'Sedang',
        'Operasional',
        8,
        35,
        'Laporan Keuangan Close H+2',
        TIMEZONE('utc', NOW()) + INTERVAL '6 days'
    ),
    (
        '33333333-3333-4333-8333-333333333310',
        'Penyusunan Kurikulum & Jadwal Kelas Bimbel Intensif UTBK Gelombang 2',
        'Penjadwalan 12 sesi live class per minggu dan distribusi modul PDF latihan mandiri siswa.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111104',
        'IN_REVIEW',
        'HIGH',
        'Tinggi',
        'Operasional',
        8,
        100,
        '12 Kelas & 24 Modul Siap Pakai',
        TIMEZONE('utc', NOW()) + INTERVAL '1 day'
    ),
    (
        '33333333-3333-4333-8333-333333333311',
        'Audit SLA Respon Admin CS & Otomasi Broadcast Grup WhatsApp Peserta Try Out',
        'Merapikan template SOP jawaban cepat untuk kendala reset password dan klaim sertifikat skor.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222204',
        '11111111-1111-4111-8111-111111111108',
        'TODO',
        'LOW',
        'Rendah',
        'Operasional',
        6,
        40,
        'Respon Rata-rata < 3 Menit',
        TIMEZONE('utc', NOW()) + INTERVAL '7 days'
    ),
    (
        '33333333-3333-4333-8333-333333333312',
        'Evaluasi Kinerja Bulanan SDM (KPI 60%, Kolaborasi 25%, Profesionalisme 15%)',
        'Rekapitulasi nilai performa 5 anggota tim inti dan feedback 360 derajat untuk periode berjalan.',
        '22222222-2222-4222-8222-222222222201',
        '22222222-2222-4222-8222-222222222203',
        '11111111-1111-4111-8111-111111111106',
        'IN_PROGRESS',
        'MEDIUM',
        'Sedang',
        'Operasional',
        7,
        85,
        '5 Rapor Tim Inti Tervalidasi',
        TIMEZONE('utc', NOW()) + INTERVAL '3 days'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    priority_label = EXCLUDED.priority_label,
    category = EXCLUDED.category,
    progress_percentage = EXCLUDED.progress_percentage,
    target_metric = EXCLUDED.target_metric;

ALTER TABLE public.tasks ENABLE TRIGGER trigger_task_insert_security;

