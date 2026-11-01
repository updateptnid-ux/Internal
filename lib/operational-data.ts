import { Task, PriorityIndonesia, TaskCategory } from '@/types/database';

export interface CoreTeamMember {
  id: string;
  name: string;
  fullName: string;
  email: string;
  whatsapp: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  primaryTitle: string;
  jobTitles: string[];
  divisions: string[];
  avatarBg: string;
  badgeColor: string;
  // Evaluasi Kinerja (Bobot: KPI 60%, Kolaborasi 25%, Profesionalisme 15%)
  kpiScore: number; // 0 - 100
  collaborationScore: number; // 0 - 100
  professionalismScore: number; // 0 - 100
  monthlyTargetPoints: number;
  monthlyActualPoints: number;
  tasksCompleted: number;
  tasksActive: number;
  tasksOverdue: number;
  keyDeliverables: {
    division: string;
    metric: string;
    target: number;
    actual: number;
    unit: string;
  }[];
}

export interface OperationalDivision {
  id: string;
  name: string;
  code: string;
  head: string;
  description: string;
  targetKpi: number;
  actualKpi: number;
  activeTasksCount: number;
  completedTasksCount: number;
}

export interface B2BProspect {
  id: string;
  schoolName: string;
  city: string;
  picContact: string;
  studentQuota: number;
  programType: 'Try Out Akbar UTBK' | 'Bundling TO + Bimbel' | 'Simulasi CBT SNBT';
  stage: 'Pendekatan BK' | 'Proposal & Demo' | 'Negosiasi MoU' | 'Deal Terkonfirmasi';
  contractValue: number;
  picInternal: string;
  updatedAt: string;
}

export interface AffiliatePartner {
  id: string;
  name: string;
  campusOrigin: string;
  referralCode: string;
  tier: 'Gold Ambassador' | 'Silver Creator' | 'Rising Star';
  totalConversions: number;
  revenueGenerated: number;
  commissionEarned: number;
  conversionRate: number;
  status: 'Aktif' | 'Evaluasi';
}

export interface TikTokLiveSchedule {
  id: string;
  dateLabel: string;
  timeSlot: string;
  topic: string;
  subtestFocus: string;
  hostTutor: string;
  picModerator: string;
  targetViewers: number;
  actualViewers: number;
  leadsCaptured: number;
  status: 'Selesai' | 'Sedang Live' | 'Terjadwal';
}

export interface SeoKeywordItem {
  id: string;
  keyword: string;
  cluster: 'Cek Skor' | 'Try Out UTBK' | 'Bimbel PTN' | 'Info SNPMB';
  searchVolume: number;
  currentRank: number;
  previousRank: number;
  monthlyClicks: number;
  targetUrl: string;
  status: 'Page 1 (#1-#3)' | 'Page 1 (#4-#10)' | 'Optimasi On-Page';
}

export interface MediaPartnerItem {
  id: string;
  partnerName: string;
  handle: string;
  category: 'Info Kampus' | 'Olimpiade & Lomba' | 'OSIS SMA' | 'Komunitas Pejuang PTN';
  followers: string;
  deliverable: string;
  publishDate: string;
  status: 'Sudah Tayang' | 'Terjadwal' | 'Draft Materi';
}

// 1. 9 DIVISI OPERASIONAL RESMI
export const PTN_DIVISIONS: OperationalDivision[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Project Management',
    code: 'PM',
    head: 'Arya',
    description: 'Koordinasi roadmap produk UTBK-SNBT, sprint mingguan, dan sinkronisasi 9 divisi.',
    targetKpi: 100,
    actualKpi: 95,
    activeTasksCount: 4,
    completedTasksCount: 18,
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'Marketing',
    code: 'MKT',
    head: 'Arya',
    description: 'Akuisisi peserta via B2B Sekolah, Affiliate Kampus, Media Partnership, TikTok Live & SEO.',
    targetKpi: 100,
    actualKpi: 92,
    activeTasksCount: 8,
    completedTasksCount: 29,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'Try Out',
    code: 'TO',
    head: 'Arya',
    description: 'Pengembangan soal standar SNPMB, kalibrasi IRT, dan operasional Try Out Nasional.',
    targetKpi: 100,
    actualKpi: 94,
    activeTasksCount: 5,
    completedTasksCount: 22,
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    name: 'Bimbel',
    code: 'BMB',
    head: 'Zidan',
    description: 'Kurikulum kelas intensif UTBK & Ujian Mandiri, manajemen tentor, dan retensi siswa.',
    targetKpi: 100,
    actualKpi: 89,
    activeTasksCount: 4,
    completedTasksCount: 19,
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    name: 'Keuangan',
    code: 'FIN',
    head: 'Abdur',
    description: 'Rekonsiliasi payment gateway, cashflow bulanan, payroll tentor, dan komisi affiliate.',
    targetKpi: 100,
    actualKpi: 96,
    activeTasksCount: 3,
    completedTasksCount: 16,
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    name: 'SDM',
    code: 'HR',
    head: 'Abdur',
    description: 'Evaluasi KPI tim inti, rekrutmen pengajar PTN, serta monitoring kolaborasi & kedisiplinan.',
    targetKpi: 100,
    actualKpi: 90,
    activeTasksCount: 3,
    completedTasksCount: 14,
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    name: 'Cek Skor',
    code: 'CSK',
    head: 'Zaki',
    description: 'Rasionalisasi peluang lolos SNBP & SNBT berbasis daya tampung serta keketatan prodi PTN.',
    targetKpi: 100,
    actualKpi: 91,
    activeTasksCount: 3,
    completedTasksCount: 17,
  },
  {
    id: '11111111-1111-4111-8111-111111111108',
    name: 'Admin',
    code: 'ADM',
    head: 'Zaki',
    description: 'Layanan CS peserta, manajemen grup WhatsApp komunitas, dan verifikasi akses paket.',
    targetKpi: 100,
    actualKpi: 88,
    activeTasksCount: 4,
    completedTasksCount: 21,
  },
  {
    id: '11111111-1111-4111-8111-111111111109',
    name: 'IT',
    code: 'IT',
    head: 'Rendi',
    description: 'Reliabilitas server CBT Try Out serentak, engine IRT otomatis, dan performa teknis web.',
    targetKpi: 100,
    actualKpi: 95,
    activeTasksCount: 4,
    completedTasksCount: 24,
  },
];

// 2. 5 ANGGOTA TIM INTI (HARDCODED MULTI-ROLE SESUAI SPESIFIKASI OPERASIONAL)
export const CORE_TEAM_MEMBERS: CoreTeamMember[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    name: 'Arya',
    fullName: 'Arya',
    email: 'arya@internalptn.id',
    whatsapp: '6281230001001',
    role: 'OWNER',
    primaryTitle: 'Project Manager',
    jobTitles: ['Project Manager', 'PJ Marketing', 'PJ Try Out'],
    divisions: ['Project Management', 'Marketing', 'Try Out'],
    avatarBg: 'bg-slate-900',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    kpiScore: 94,
    collaborationScore: 92,
    professionalismScore: 95,
    monthlyTargetPoints: 100,
    monthlyActualPoints: 94,
    tasksCompleted: 28,
    tasksActive: 5,
    tasksOverdue: 0,
    keyDeliverables: [
      { division: 'Project Management', metric: 'Ketepatan Sprint & Rilis Batch TO', target: 100, actual: 95, unit: '%' },
      { division: 'Try Out', metric: 'Peserta Aktif Try Out Akbar UTBK', target: 10000, actual: 9450, unit: 'Peserta' },
      { division: 'Marketing', metric: 'Total Akuisisi Leads Pejuang PTN', target: 25000, actual: 23800, unit: 'Leads' },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    name: 'Zidan',
    fullName: 'Zidan',
    email: 'zidan@internalptn.id',
    whatsapp: '6281230001002',
    role: 'MANAGER',
    primaryTitle: 'PJ Bimbel & B2B',
    jobTitles: ['PJ Bimbel', 'Marketing B2B & Affiliate'],
    divisions: ['Bimbel', 'Marketing'],
    avatarBg: 'bg-indigo-600',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    kpiScore: 89,
    collaborationScore: 90,
    professionalismScore: 88,
    monthlyTargetPoints: 100,
    monthlyActualPoints: 89,
    tasksCompleted: 24,
    tasksActive: 6,
    tasksOverdue: 0,
    keyDeliverables: [
      { division: 'Bimbel', metric: 'Siswa Aktif Kelas Intensif SNBT', target: 500, actual: 445, unit: 'Siswa' },
      { division: 'Marketing (B2B)', metric: 'Mitra Sekolah SMA/MA Terkonfirmasi', target: 35, actual: 31, unit: 'Sekolah' },
      { division: 'Marketing (Affiliate)', metric: 'Transaksi dari Kode Referral Duta PTN', target: 1200, actual: 1085, unit: 'Paket' },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    name: 'Abdur',
    fullName: 'Abdur',
    email: 'abdur@internalptn.id',
    whatsapp: '6281230001003',
    role: 'MANAGER',
    primaryTitle: 'PJ Keuangan & SDM',
    jobTitles: ['PJ Keuangan', 'PJ SDM', 'Marketing TikTok Live'],
    divisions: ['Keuangan', 'SDM', 'Marketing'],
    avatarBg: 'bg-emerald-600',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    kpiScore: 87,
    collaborationScore: 89,
    professionalismScore: 92,
    monthlyTargetPoints: 100,
    monthlyActualPoints: 87,
    tasksCompleted: 21,
    tasksActive: 5,
    tasksOverdue: 1,
    keyDeliverables: [
      { division: 'Keuangan', metric: 'Akurasi Rekonsiliasi & Cashflow', target: 100, actual: 99, unit: '%' },
      { division: 'SDM', metric: 'Kehadiran Tentor & Evaluasi Tim', target: 95, actual: 92, unit: '%' },
      { division: 'Marketing (TikTok Live)', metric: 'Viewers Live Bedah Soal UTBK', target: 50000, actual: 43800, unit: 'Views' },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    name: 'Zaki',
    fullName: 'Zaki',
    email: 'zaki@internalptn.id',
    whatsapp: '6281230001004',
    role: 'MANAGER',
    primaryTitle: 'PJ Cek Skor & Admin',
    jobTitles: ['PJ Cek Skor', 'PJ Admin', 'Marketing Media Partnership'],
    divisions: ['Cek Skor', 'Admin', 'Marketing'],
    avatarBg: 'bg-amber-600',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    kpiScore: 86,
    collaborationScore: 88,
    professionalismScore: 90,
    monthlyTargetPoints: 100,
    monthlyActualPoints: 86,
    tasksCompleted: 22,
    tasksActive: 5,
    tasksOverdue: 0,
    keyDeliverables: [
      { division: 'Cek Skor', metric: 'Submission Rasionalisasi Skor SNBP/SNBT', target: 8000, actual: 7120, unit: 'Siswa' },
      { division: 'Admin', metric: 'SLA Respon CS Peserta (< 5 Menit)', target: 98, actual: 95, unit: '%' },
      { division: 'Marketing (Medpart)', metric: 'Publikasi Akun Info Kampus & OSIS', target: 45, actual: 39, unit: 'Partner' },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222205',
    name: 'Rendi',
    fullName: 'Rendi',
    email: 'rendi@internalptn.id',
    whatsapp: '6281230001005',
    role: 'MANAGER',
    primaryTitle: 'PJ IT & SEO',
    jobTitles: ['PJ IT', 'Marketing SEO'],
    divisions: ['IT', 'Marketing'],
    avatarBg: 'bg-purple-600',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    kpiScore: 91,
    collaborationScore: 87,
    professionalismScore: 93,
    monthlyTargetPoints: 100,
    monthlyActualPoints: 91,
    tasksCompleted: 26,
    tasksActive: 4,
    tasksOverdue: 0,
    keyDeliverables: [
      { division: 'IT', metric: 'Uptime Server CBT Try Out Serentak', target: 99.9, actual: 99.95, unit: '%' },
      { division: 'Marketing (SEO)', metric: 'Trafik Organik Google Search PTN', target: 60000, actual: 54900, unit: 'Klik' },
      { division: 'Marketing (SEO)', metric: 'Keyword Utama di Top 3 SERP', target: 20, actual: 18, unit: 'Keyword' },
    ],
  },
];

// Helper untuk menghitung skor akhir tertimbang (KPI 60% + Kolaborasi 25% + Profesionalisme 15%)
export function calculateWeightedEvaluation(
  kpi: number,
  collaboration: number,
  professionalism: number
): number {
  return Number((kpi * 0.6 + collaboration * 0.25 + professionalism * 0.15).toFixed(1));
}

// 3. DATA BULANAN TARGET VS AKTUAL KPI (UNTUK RECHARTS)
export const MONTHLY_TARGET_VS_ACTUAL_KPI = [
  { month: 'Jun', fullName: 'Juni 2026', target: 75, aktual: 72, pesertaTO: 4200 },
  { month: 'Jul', fullName: 'Juli 2026', target: 80, aktual: 79, pesertaTO: 5400 },
  { month: 'Agu', fullName: 'Agustus 2026', target: 85, aktual: 84, pesertaTO: 6800 },
  { month: 'Sep', fullName: 'September 2026', target: 88, aktual: 86, pesertaTO: 7900 },
  { month: 'Okt', fullName: 'Oktober 2026', target: 90, aktual: 89, pesertaTO: 8750 },
  { month: 'Nov', fullName: 'November 2026', target: 92, aktual: 90, pesertaTO: 9450 },
];

// 4. DATA TARGET VS AKTUAL PER ANGGOTA TIM INTI (UNTUK RECHARTS OVERVIEW)
export const TEAM_KPI_COMPARISON_DATA = CORE_TEAM_MEMBERS.map((m) => ({
  name: m.name,
  roles: m.jobTitles.join(', '),
  target: m.monthlyTargetPoints,
  aktual: m.monthlyActualPoints,
  skorAkhir: calculateWeightedEvaluation(m.kpiScore, m.collaborationScore, m.professionalismScore),
}));

// 5. DAFTAR TUGAS LENGKAP (MOCK FALLBACK REALISTIS BISNIS EDTECH PTN)
export interface EnrichedTask extends Task {
  priority_label: PriorityIndonesia;
  category: TaskCategory;
  target_metric?: string | null;
  assignee_roles?: string[];
}

export const INITIAL_PTN_TASKS: EnrichedTask[] = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    title: 'Finalisasi MoU B2B Try Out Akbar UTBK dengan 15 SMA Negeri Jawa Barat & Jawa Timur',
    description: 'Menyelesaikan penandatanganan kerja sama paket Try Out kolektif untuk siswa kelas 12 melalui Koordinator BK Sekolah.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222202',
    division_id: '11111111-1111-4111-8111-111111111102',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    priority_label: 'Tinggi',
    category: 'B2B',
    target_metric: '15 Sekolah (4.500 Siswa)',
    kpi_weight: 9,
    progress_percentage: 80,
    due_date: '2026-11-05T17:00:00Z',
    created_at: '2026-10-28T08:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222202',
      full_name: 'Zidan',
      email: 'zidan@internalptn.id',
      whatsapp_number: '6281230001002',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111104',
      account_status: 'ACTIVE',
      job_titles: ['PJ Bimbel', 'Marketing B2B & Affiliate'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      job_titles: ['Project Manager', 'PJ Marketing', 'PJ Try Out'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111102',
      name: 'Marketing',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ Bimbel', 'Marketing B2B & Affiliate'],
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    title: 'Optimasi Load Balancing Server CBT & Pembobotan Skor IRT Try Out Batch 5',
    description: 'Melakukan stress-test 10.000 concurrent users dan kalibrasi engine penilaian Item Response Theory (IRT) sebelum pelaksanaan hari Sabtu.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222205',
    division_id: '11111111-1111-4111-8111-111111111109',
    status: 'IN_REVIEW',
    priority: 'URGENT',
    priority_label: 'Tinggi',
    category: 'Operasional',
    target_metric: 'Uptime 99.95% & Latency < 120ms',
    kpi_weight: 10,
    progress_percentage: 100,
    due_date: '2026-11-03T17:00:00Z',
    created_at: '2026-10-27T08:00:00Z',
    updated_at: '2026-11-01T11:30:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222205',
      full_name: 'Rendi',
      email: 'rendi@internalptn.id',
      whatsapp_number: '6281230001005',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111109',
      account_status: 'ACTIVE',
      job_titles: ['PJ IT', 'Marketing SEO'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111109',
      name: 'IT',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ IT', 'Marketing SEO'],
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    title: 'Eksekusi Marathon TikTok Live: Bedah Soal Penalaran Matematika & Rasionalisasi SNBT',
    description: 'Menjalankan 7 sesi TikTok Live interaktif pukul 19.30 WIB bersama tentor utama untuk konversi paket Bimbel Intensif.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222203',
    division_id: '11111111-1111-4111-8111-111111111102',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    priority_label: 'Tinggi',
    category: 'TikTok Live',
    target_metric: '50.000 Views & 350 Leads Baru',
    kpi_weight: 8,
    progress_percentage: 75,
    due_date: '2026-11-06T17:00:00Z',
    created_at: '2026-10-29T08:00:00Z',
    updated_at: '2026-11-01T09:15:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222203',
      full_name: 'Abdur',
      email: 'abdur@internalptn.id',
      whatsapp_number: '6281230001003',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111105',
      account_status: 'ACTIVE',
      job_titles: ['PJ Keuangan', 'PJ SDM', 'Marketing TikTok Live'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111102',
      name: 'Marketing',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ Keuangan', 'PJ SDM', 'Marketing TikTok Live'],
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
    title: 'Kalibrasi Database Daya Tampung & Keketatan Prodi PTN di Fitur Cek Skor',
    description: 'Memperbarui indeks keketatan prodi UI, ITB, UGM, Unpad, ITS, dan Unair untuk akurasi rasionalisasi nilai peserta.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222204',
    division_id: '11111111-1111-4111-8111-111111111107',
    status: 'DONE',
    priority: 'HIGH',
    priority_label: 'Tinggi',
    category: 'Operasional',
    target_metric: '85 PTN & 3.200 Program Studi',
    kpi_weight: 9,
    progress_percentage: 100,
    due_date: '2026-11-01T17:00:00Z',
    created_at: '2026-10-25T08:00:00Z',
    updated_at: '2026-11-01T08:00:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222204',
      full_name: 'Zaki',
      email: 'zaki@internalptn.id',
      whatsapp_number: '6281230001004',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111107',
      account_status: 'ACTIVE',
      job_titles: ['PJ Cek Skor', 'PJ Admin', 'Marketing Media Partnership'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111107',
      name: 'Cek Skor',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ Cek Skor', 'PJ Admin', 'Marketing Media Partnership'],
  },
  {
    id: '33333333-3333-4333-8333-333333333305',
    title: 'Riset & Optimasi On-Page 25 Artikel SEO Cluster "Cek Skor UTBK & Try Out SNBT 2026"',
    description: 'Optimasi struktur H1-H3, schema FAQ, dan internal linking ke landing page pendaftaran Try Out Gratis.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222205',
    division_id: '11111111-1111-4111-8111-111111111102',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    priority_label: 'Tinggi',
    category: 'SEO',
    target_metric: 'Top 3 SERP untuk 18 Keyword Utama',
    kpi_weight: 8,
    progress_percentage: 85,
    due_date: '2026-11-07T17:00:00Z',
    created_at: '2026-10-26T08:00:00Z',
    updated_at: '2026-11-01T12:00:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222205',
      full_name: 'Rendi',
      email: 'rendi@internalptn.id',
      whatsapp_number: '6281230001005',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111109',
      account_status: 'ACTIVE',
      job_titles: ['PJ IT', 'Marketing SEO'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111102',
      name: 'Marketing',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ IT', 'Marketing SEO'],
  },
  {
    id: '33333333-3333-4333-8333-333333333306',
    title: 'Onboarding 40 Student Ambassador & Kreator Affiliate Kampus Batch November',
    description: 'Distribusi kode referral unik dan starter kit konten promosi untuk afiliator mahasiswa PTN Top 10.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222202',
    division_id: '11111111-1111-4111-8111-111111111102',
    status: 'DONE',
    priority: 'MEDIUM',
    priority_label: 'Sedang',
    category: 'Affiliate',
    target_metric: '40 Affiliate Aktif (1.085 Transaksi)',
    kpi_weight: 7,
    progress_percentage: 100,
    due_date: '2026-10-30T17:00:00Z',
    created_at: '2026-10-20T08:00:00Z',
    updated_at: '2026-10-30T16:00:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222202',
      full_name: 'Zidan',
      email: 'zidan@internalptn.id',
      whatsapp_number: '6281230001002',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111104',
      account_status: 'ACTIVE',
      job_titles: ['PJ Bimbel', 'Marketing B2B & Affiliate'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111102',
      name: 'Marketing',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ Bimbel', 'Marketing B2B & Affiliate'],
  },
  {
    id: '33333333-3333-4333-8333-333333333307',
    title: 'Barter Publikasi Media Partnership dengan 25 Akun Info Lomba, Olimpiade & Kampus',
    description: 'Negosiasi jadwal unggah feeds & story Instagram untuk mendongkrak pendaftar Try Out Nasional Batch 5.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222204',
    division_id: '11111111-1111-4111-8111-111111111102',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    priority_label: 'Sedang',
    category: 'Media Partnership',
    target_metric: '25 Media Partner Terpublikasi',
    kpi_weight: 7,
    progress_percentage: 70,
    due_date: '2026-11-05T17:00:00Z',
    created_at: '2026-10-28T08:00:00Z',
    updated_at: '2026-11-01T14:00:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222204',
      full_name: 'Zaki',
      email: 'zaki@internalptn.id',
      whatsapp_number: '6281230001004',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111107',
      account_status: 'ACTIVE',
      job_titles: ['PJ Cek Skor', 'PJ Admin', 'Marketing Media Partnership'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111102',
      name: 'Marketing',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ Cek Skor', 'PJ Admin', 'Marketing Media Partnership'],
  },
  {
    id: '33333333-3333-4333-8333-333333333308',
    title: 'Validasi Paket Soal & Pembahasan Video 7 Subtes Try Out Nasional Batch 5',
    description: 'Review kualitas soal bersama tim akademik agar sesuai kerangka uji SNPMB terbaru.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222201',
    division_id: '11111111-1111-4111-8111-111111111103',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    priority_label: 'Tinggi',
    category: 'Operasional',
    target_metric: '155 Butir Soal Tervalidasi',
    kpi_weight: 9,
    progress_percentage: 90,
    due_date: '2026-11-04T17:00:00Z',
    created_at: '2026-10-27T08:00:00Z',
    updated_at: '2026-11-01T15:00:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      job_titles: ['Project Manager', 'PJ Marketing', 'PJ Try Out'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111103',
      name: 'Try Out',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['Project Manager', 'PJ Marketing', 'PJ Try Out'],
  },
  {
    id: '33333333-3333-4333-8333-333333333309',
    title: 'Rekonsiliasi Komisi Affiliate, Honor Tentor Bimbel & Laporan Cashflow Bulanan',
    description: 'Verifikasi mutasi pembayaran paket bundel Try Out + Bimbel serta pencairan bagi hasil mitra afiliasi.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222203',
    division_id: '11111111-1111-4111-8111-111111111105',
    status: 'TODO',
    priority: 'MEDIUM',
    priority_label: 'Sedang',
    category: 'Operasional',
    target_metric: 'Laporan Keuangan Close H+2',
    kpi_weight: 8,
    progress_percentage: 35,
    due_date: '2026-11-08T17:00:00Z',
    created_at: '2026-10-30T08:00:00Z',
    updated_at: '2026-11-01T09:00:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222203',
      full_name: 'Abdur',
      email: 'abdur@internalptn.id',
      whatsapp_number: '6281230001003',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111105',
      account_status: 'ACTIVE',
      job_titles: ['PJ Keuangan', 'PJ SDM', 'Marketing TikTok Live'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111105',
      name: 'Keuangan',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ Keuangan', 'PJ SDM', 'Marketing TikTok Live'],
  },
  {
    id: '33333333-3333-4333-8333-333333333310',
    title: 'Penyusunan Kurikulum & Jadwal Kelas Bimbel Intensif UTBK Gelombang 2',
    description: 'Penjadwalan 12 sesi live class per minggu dan distribusi modul PDF latihan mandiri siswa.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222202',
    division_id: '11111111-1111-4111-8111-111111111104',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    priority_label: 'Tinggi',
    category: 'Operasional',
    target_metric: '12 Kelas & 24 Modul Siap Pakai',
    kpi_weight: 8,
    progress_percentage: 100,
    due_date: '2026-11-02T17:00:00Z',
    created_at: '2026-10-26T08:00:00Z',
    updated_at: '2026-11-01T13:00:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222202',
      full_name: 'Zidan',
      email: 'zidan@internalptn.id',
      whatsapp_number: '6281230001002',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111104',
      account_status: 'ACTIVE',
      job_titles: ['PJ Bimbel', 'Marketing B2B & Affiliate'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111104',
      name: 'Bimbel',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ Bimbel', 'Marketing B2B & Affiliate'],
  },
  {
    id: '33333333-3333-4333-8333-333333333311',
    title: 'Audit SLA Respon Admin CS & Otomasi Broadcast Grup WhatsApp Peserta Try Out',
    description: 'Merapikan template SOP jawaban cepat untuk kendala reset password dan klaim sertifikat skor UTBK.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222204',
    division_id: '11111111-1111-4111-8111-111111111108',
    status: 'TODO',
    priority: 'LOW',
    priority_label: 'Rendah',
    category: 'Operasional',
    target_metric: 'Respon Rata-rata < 3 Menit',
    kpi_weight: 6,
    progress_percentage: 40,
    due_date: '2026-11-09T17:00:00Z',
    created_at: '2026-10-30T08:00:00Z',
    updated_at: '2026-11-01T10:30:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222204',
      full_name: 'Zaki',
      email: 'zaki@internalptn.id',
      whatsapp_number: '6281230001004',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111107',
      account_status: 'ACTIVE',
      job_titles: ['PJ Cek Skor', 'PJ Admin', 'Marketing Media Partnership'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111108',
      name: 'Admin',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ Cek Skor', 'PJ Admin', 'Marketing Media Partnership'],
  },
  {
    id: '33333333-3333-4333-8333-333333333312',
    title: 'Evaluasi Kinerja Bulanan SDM (KPI 60%, Kolaborasi 25%, Profesionalisme 15%)',
    description: 'Rekapitulasi nilai performa 5 anggota tim inti dan sinkronisasi target OKR bulan berikutnya.',
    assigner_id: '22222222-2222-4222-8222-222222222201',
    assignee_id: '22222222-2222-4222-8222-222222222203',
    division_id: '11111111-1111-4111-8111-111111111106',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    priority_label: 'Sedang',
    category: 'Operasional',
    target_metric: '5 Rapor Tim Inti Tervalidasi',
    kpi_weight: 7,
    progress_percentage: 85,
    due_date: '2026-11-05T17:00:00Z',
    created_at: '2026-10-29T08:00:00Z',
    updated_at: '2026-11-01T11:00:00Z',
    assignee: {
      id: '22222222-2222-4222-8222-222222222203',
      full_name: 'Abdur',
      email: 'abdur@internalptn.id',
      whatsapp_number: '6281230001003',
      role: 'MANAGER',
      division_id: '11111111-1111-4111-8111-111111111105',
      account_status: 'ACTIVE',
      job_titles: ['PJ Keuangan', 'PJ SDM', 'Marketing TikTok Live'],
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    assigner: {
      id: '22222222-2222-4222-8222-222222222201',
      full_name: 'Arya',
      email: 'arya@internalptn.id',
      whatsapp_number: '6281230001001',
      role: 'OWNER',
      division_id: '11111111-1111-4111-8111-111111111101',
      account_status: 'ACTIVE',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    division: {
      id: '11111111-1111-4111-8111-111111111106',
      name: 'SDM',
      created_at: '2026-10-01T00:00:00Z',
    },
    assignee_roles: ['PJ Keuangan', 'PJ SDM', 'Marketing TikTok Live'],
  },
];

// 6. MARKETING HUB DATA: B2B PROSPECTS (PIC: ZIDAN)
export const INITIAL_B2B_PROSPECTS: B2BProspect[] = [
  {
    id: 'b2b-1',
    schoolName: 'SMAN 3 Bandung',
    city: 'Bandung',
    picContact: 'Ibu Dra. Hj. Ratna (Koordinator BK)',
    studentQuota: 380,
    programType: 'Bundling TO + Bimbel',
    stage: 'Deal Terkonfirmasi',
    contractValue: 45600000,
    picInternal: 'Zidan',
    updatedAt: 'Hari ini, 10:20 WIB',
  },
  {
    id: 'b2b-2',
    schoolName: 'SMAN 5 Surabaya',
    city: 'Surabaya',
    picContact: 'Bpk. Hendra Kusuma, M.Pd (Wakasek Kurikulum)',
    studentQuota: 420,
    programType: 'Try Out Akbar UTBK',
    stage: 'Deal Terkonfirmasi',
    contractValue: 29400000,
    picInternal: 'Zidan',
    updatedAt: 'Kemarin, 16:40 WIB',
  },
  {
    id: 'b2b-3',
    schoolName: 'SMAN 8 Jakarta',
    city: 'Jakarta Selatan',
    picContact: 'Ibu Lestari Wulandari, S.Psi',
    studentQuota: 450,
    programType: 'Bundling TO + Bimbel',
    stage: 'Negosiasi MoU',
    contractValue: 54000000,
    picInternal: 'Zidan',
    updatedAt: 'Hari ini, 13:15 WIB',
  },
  {
    id: 'b2b-4',
    schoolName: 'MAN Insan Cendekia Serpong',
    city: 'Tangerang Selatan',
    picContact: 'Ust. Ahmad Fauzi, M.Ed',
    studentQuota: 260,
    programType: 'Simulasi CBT SNBT',
    stage: 'Deal Terkonfirmasi',
    contractValue: 23400000,
    picInternal: 'Zidan',
    updatedAt: '2 hari lalu',
  },
  {
    id: 'b2b-5',
    schoolName: 'SMAN 1 Yogyakarta (Teladan)',
    city: 'Yogyakarta',
    picContact: 'Bpk. Bambang Sudibyo, S.Pd',
    studentQuota: 340,
    programType: 'Try Out Akbar UTBK',
    stage: 'Proposal & Demo',
    contractValue: 23800000,
    picInternal: 'Zidan',
    updatedAt: 'Hari ini, 09:05 WIB',
  },
  {
    id: 'b2b-6',
    schoolName: 'SMAN 1 Medan',
    city: 'Medan',
    picContact: 'Ibu Rina Pasaribu, M.Psi',
    studentQuota: 510,
    programType: 'Try Out Akbar UTBK',
    stage: 'Negosiasi MoU',
    contractValue: 35700000,
    picInternal: 'Zidan',
    updatedAt: 'Kemarin, 14:10 WIB',
  },
];

// 7. MARKETING HUB DATA: AFFILIATE AKTIF (PIC: ZIDAN)
export const INITIAL_AFFILIATES: AffiliatePartner[] = [
  {
    id: 'aff-1',
    name: 'Nadia Putri (Maba FK UI)',
    campusOrigin: 'Universitas Indonesia',
    referralCode: 'NADIAFKUI',
    tier: 'Gold Ambassador',
    totalConversions: 312,
    revenueGenerated: 46800000,
    commissionEarned: 7020000,
    conversionRate: 14.8,
    status: 'Aktif',
  },
  {
    id: 'aff-2',
    name: 'Rizky STEI-K ITB',
    campusOrigin: 'Institut Teknologi Bandung',
    referralCode: 'RIZKYITB26',
    tier: 'Gold Ambassador',
    totalConversions: 284,
    revenueGenerated: 42600000,
    commissionEarned: 6390000,
    conversionRate: 13.5,
    status: 'Aktif',
  },
  {
    id: 'aff-3',
    name: 'Alya Psikologi UGM',
    campusOrigin: 'Universitas Gadjah Mada',
    referralCode: 'ALYAGADJAH',
    tier: 'Silver Creator',
    totalConversions: 195,
    revenueGenerated: 29250000,
    commissionEarned: 4387500,
    conversionRate: 11.2,
    status: 'Aktif',
  },
  {
    id: 'aff-4',
    name: 'Bagas Teknik Industri ITS',
    campusOrigin: 'Institut Teknologi Sepuluh Nopember',
    referralCode: 'BAGASITS',
    tier: 'Silver Creator',
    totalConversions: 164,
    revenueGenerated: 24600000,
    commissionEarned: 3690000,
    conversionRate: 10.4,
    status: 'Aktif',
  },
  {
    id: 'aff-5',
    name: 'Salma Hukum Unpad',
    campusOrigin: 'Universitas Padjadjaran',
    referralCode: 'SALMAUNPAD',
    tier: 'Rising Star',
    totalConversions: 130,
    revenueGenerated: 19500000,
    commissionEarned: 2925000,
    conversionRate: 9.6,
    status: 'Aktif',
  },
];

// 8. MARKETING HUB DATA: KALENDER TIKTOK LIVE (PIC: ABDUR)
export const INITIAL_TIKTOK_SCHEDULE: TikTokLiveSchedule[] = [
  {
    id: 'tt-1',
    dateLabel: 'Senin, 2 Nov 2026',
    timeSlot: '19:30 - 21:00 WIB',
    topic: 'Trik Cepat Penalaran Matematika UTBK Tanpa Rumus Panjang',
    subtestFocus: 'Penalaran Matematika (PM)',
    hostTutor: 'Kak Farhan (Aktuaria UI)',
    picModerator: 'Abdur',
    targetViewers: 7500,
    actualViewers: 8420,
    leadsCaptured: 94,
    status: 'Selesai',
  },
  {
    id: 'tt-2',
    dateLabel: 'Selasa, 3 Nov 2026',
    timeSlot: '19:30 - 21:00 WIB',
    topic: 'Live Rasionalisasi Skor Try Out & Strategi Pilih 4 Prodi SNBT',
    subtestFocus: 'Rasionalisasi Cek Skor',
    hostTutor: 'Kak Dinda & Zaki',
    picModerator: 'Abdur',
    targetViewers: 8000,
    actualViewers: 9150,
    leadsCaptured: 118,
    status: 'Sedang Live',
  },
  {
    id: 'tt-3',
    dateLabel: 'Rabu, 4 Nov 2026',
    timeSlot: '19:30 - 21:00 WIB',
    topic: 'Bedah Teks Panjang Literasi Bahasa Inggris SNBT 2026',
    subtestFocus: 'Literasi Bahasa Inggris (LBI)',
    hostTutor: 'Kak Kevin (HI UGM)',
    picModerator: 'Abdur',
    targetViewers: 7000,
    actualViewers: 6890,
    leadsCaptured: 76,
    status: 'Terjadwal',
  },
  {
    id: 'tt-4',
    dateLabel: 'Kamis, 5 Nov 2026',
    timeSlot: '19:30 - 21:00 WIB',
    topic: 'Simulasi Soal HOTS Penalaran Umum & Logika Kuantor',
    subtestFocus: 'Penalaran Umum (PU)',
    hostTutor: 'Kak Reza (STEI ITB)',
    picModerator: 'Abdur',
    targetViewers: 8500,
    actualViewers: 8100,
    leadsCaptured: 89,
    status: 'Terjadwal',
  },
  {
    id: 'tt-5',
    dateLabel: 'Jumat, 6 Nov 2026',
    timeSlot: '20:00 - 21:30 WIB',
    topic: 'Q&A Beasiswa, Biaya Hidup & Keketatan Kedokteran PTN Top 5',
    subtestFocus: 'Sharing & Promo Bimbel',
    hostTutor: 'Kak Nadia (FK UI) & Zidan',
    picModerator: 'Abdur',
    targetViewers: 10000,
    actualViewers: 11240,
    leadsCaptured: 145,
    status: 'Terjadwal',
  },
];

// 9. MARKETING HUB DATA: STATUS KEYWORD SEO (PIC: RENDI)
export const INITIAL_SEO_KEYWORDS: SeoKeywordItem[] = [
  {
    id: 'seo-1',
    keyword: 'try out utbk snbt 2026 gratis',
    cluster: 'Try Out UTBK',
    searchVolume: 22400,
    currentRank: 1,
    previousRank: 3,
    monthlyClicks: 14800,
    targetUrl: '/tryout-nasional-snbt',
    status: 'Page 1 (#1-#3)',
  },
  {
    id: 'seo-2',
    keyword: 'cek skor utbk dan rasionalisasi prodi ptn',
    cluster: 'Cek Skor',
    searchVolume: 18900,
    currentRank: 2,
    previousRank: 4,
    monthlyClicks: 11200,
    targetUrl: '/cek-skor-rasionalisasi',
    status: 'Page 1 (#1-#3)',
  },
  {
    id: 'seo-3',
    keyword: 'bimbel intensif utbk snbt garansi lolos',
    cluster: 'Bimbel PTN',
    searchVolume: 12100,
    currentRank: 2,
    previousRank: 5,
    monthlyClicks: 8450,
    targetUrl: '/bimbel-intensif-ptn',
    status: 'Page 1 (#1-#3)',
  },
  {
    id: 'seo-4',
    keyword: 'daya tampung dan keketatan snbp snbt ui itb ugm',
    cluster: 'Cek Skor',
    searchVolume: 16500,
    currentRank: 3,
    previousRank: 6,
    monthlyClicks: 9600,
    targetUrl: '/daya-tampung-ptn-2026',
    status: 'Page 1 (#1-#3)',
  },
  {
    id: 'seo-5',
    keyword: 'contoh soal penalaran matematika snbt pdf',
    cluster: 'Try Out UTBK',
    searchVolume: 14300,
    currentRank: 4,
    previousRank: 8,
    monthlyClicks: 6850,
    targetUrl: '/bank-soal-penalaran-matematika',
    status: 'Page 1 (#4-#10)',
  },
  {
    id: 'seo-6',
    keyword: 'cara menghitung nilai irt try out utbk',
    cluster: 'Info SNPMB',
    searchVolume: 9800,
    currentRank: 5,
    previousRank: 9,
    monthlyClicks: 4000,
    targetUrl: '/sistem-penilaian-irt-utbk',
    status: 'Page 1 (#4-#10)',
  },
];

// 10. MARKETING HUB DATA: MEDIA PARTNERSHIP (PIC: ZAKI)
export const INITIAL_MEDIA_PARTNERS: MediaPartnerItem[] = [
  {
    id: 'mp-1',
    partnerName: 'Info Masuk PTN & SNPMB Nasional',
    handle: '@infomasukptn.id',
    category: 'Info Kampus',
    followers: '485K',
    deliverable: '2x Feed Poster TO + 4x IG Story Link Pendaftaran',
    publishDate: '2 Nov 2026',
    status: 'Sudah Tayang',
  },
  {
    id: 'mp-2',
    partnerName: 'Olimpiade & Lomba SMA Indonesia',
    handle: '@olimpiadesma.official',
    category: 'Olimpiade & Lomba',
    followers: '310K',
    deliverable: '1x Carousel Try Out + 3x IG Story',
    publishDate: '3 Nov 2026',
    status: 'Sudah Tayang',
  },
  {
    id: 'mp-3',
    partnerName: 'Forum OSIS Jawa Barat',
    handle: '@forumosisjabar',
    category: 'OSIS SMA',
    followers: '142K',
    deliverable: 'Broadcast Grup WA Ketua OSIS + Feed IG',
    publishDate: '4 Nov 2026',
    status: 'Terjadwal',
  },
  {
    id: 'mp-4',
    partnerName: 'Pejuang UTBK Ambis 2026',
    handle: '@ambisptn2026',
    category: 'Komunitas Pejuang PTN',
    followers: '225K',
    deliverable: 'Thread X/Twitter + Bio Link Cek Skor',
    publishDate: '5 Nov 2026',
    status: 'Terjadwal',
  },
];

