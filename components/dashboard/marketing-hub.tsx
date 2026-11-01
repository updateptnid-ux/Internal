'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  INITIAL_B2B_PROSPECTS,
  INITIAL_AFFILIATES,
  INITIAL_TIKTOK_SCHEDULE,
  INITIAL_SEO_KEYWORDS,
  INITIAL_MEDIA_PARTNERS,
  B2BProspect,
} from '@/lib/operational-data';
import {
  Building2,
  Users,
  Video,
  Search,
  Share2,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Calendar,
  CheckCircle2,
  Plus,
  ExternalLink,
  Award,
} from 'lucide-react';

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const STAGE_BADGE_MAP: Record<B2BProspect['stage'], string> = {
  'Deal Terkonfirmasi': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Negosiasi MoU': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Proposal & Demo': 'bg-amber-50 text-amber-700 border-amber-200',
  'Pendekatan BK': 'bg-slate-100 text-slate-700 border-slate-200',
};

export function MarketingHub() {
  const [b2bList, setB2bList] = useState<B2BProspect[]>(INITIAL_B2B_PROSPECTS);
  const [selectedStage, setSelectedStage] = useState<string>('Semua');
  const [newSchool, setNewSchool] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newQuota, setNewQuota] = useState('350');
  const [showAddB2B, setShowAddB2B] = useState(false);

  const filteredB2B = b2bList.filter(
    (item) => selectedStage === 'Semua' || item.stage === selectedStage
  );

  const handleAddProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.trim()) return;
    const quotaNum = parseInt(newQuota) || 300;
    const added: B2BProspect = {
      id: `b2b-${Date.now()}`,
      schoolName: newSchool.trim(),
      city: newCity.trim() || 'Jawa Barat',
      picContact: 'Koordinator Guru BK',
      studentQuota: quotaNum,
      programType: 'Try Out Akbar UTBK',
      stage: 'Proposal & Demo',
      contractValue: quotaNum * 75000,
      picInternal: 'Zidan',
      updatedAt: 'Baru saja',
    };
    setB2bList((prev) => [added, ...prev]);
    setNewSchool('');
    setNewCity('');
    setShowAddB2B(false);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 font-sans"
    >
      {/* 1. HEADER MARKETING HUB PTN */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              <Sparkles className="w-3 h-3" />
              PJ Marketing: Arya
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">
              B2B & Affiliate (Zidan) • TikTok Live (Abdur) • Medpart (Zaki) • SEO (Rendi)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Marketing Hub (EdTech Acquisition Center)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pusat komando akuisisi sekolah B2B, kreator Affiliate kampus, jadwal TikTok Live, keyword SEO, dan Media Partnership.
          </p>
        </div>

        <Button
          onClick={() => setShowAddB2B(!showAddB2B)}
          className="h-9 px-4 text-xs font-semibold gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Tambah Prospek B2B
        </Button>
      </motion.div>

      {/* FORM CEPAT TAMBAH PROSPEK SEKOLAH B2B */}
      {showAddB2B && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleAddProspect}
          className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Nama Sekolah SMA/MA/SMK
            </label>
            <input
              type="text"
              required
              value={newSchool}
              onChange={(e) => setNewSchool(e.target.value)}
              placeholder="Contoh: SMAN 2 Malang"
              className="w-full text-xs p-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Kota / Provinsi
            </label>
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="Contoh: Malang"
              className="w-full text-xs p-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Estimasi Kuota Siswa Kelas 12
            </label>
            <input
              type="number"
              value={newQuota}
              onChange={(e) => setNewQuota(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl h-9">
              Simpan Prospek
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddB2B(false)}
              className="text-xs rounded-xl h-9"
            >
              Batal
            </Button>
          </div>
        </motion.form>
      )}

      {/* 2. 4 KARTU METRIK UTAMA KANAL MARKETING */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl p-5">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pipeline B2B Sekolah
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            31 <span className="text-xs font-normal text-slate-400">/ 35 Sekolah</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-emerald-600 font-semibold flex items-center">
              Rp 211,9 Jt Kontrak <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] text-slate-400">PIC: Zidan</span>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl p-5">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Affiliate Kampus Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            40 <span className="text-xs font-normal text-slate-400">Duta PTN</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-emerald-600 font-semibold">1.085 Paket Terjual</span>
            <span className="text-[11px] text-slate-400">PIC: Zidan</span>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl p-5">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Performa TikTok Live
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            43.800 <span className="text-xs font-normal text-slate-400">Views</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-rose-600 font-semibold">522 Leads Bimbel</span>
            <span className="text-[11px] text-slate-400">PIC: Abdur</span>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl p-5">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Trafik Organik SEO
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            54.900 <span className="text-xs font-normal text-slate-400">Klik/Bln</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-purple-600 font-semibold">18 Keyword Top 3</span>
            <span className="text-[11px] text-slate-400">PIC: Rendi</span>
          </div>
        </Card>
      </motion.div>

      {/* 3. BENTO GRID ROW 2: TRACKING PROSPEK B2B SEKOLAH (7 COL) + AFFILIATE AKTIF (5 COL) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* TRACKING PROSPEK B2B SEKOLAH (PIC: ZIDAN) */}
        <Card className="lg:col-span-7 border border-slate-200/70 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                  Tracking Prospek B2B Sekolah (Try Out & Bimbel)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Penanggung Jawab: <strong>Zidan</strong> (Marketing B2B & Affiliate)
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-1">
                {['Semua', 'Deal Terkonfirmasi', 'Negosiasi MoU', 'Proposal & Demo'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStage(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      selectedStage === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Sekolah & Kontak BK</th>
                    <th className="py-3 px-4">Program</th>
                    <th className="py-3 px-4 text-center">Kuota Siswa</th>
                    <th className="py-3 px-4 text-right">Nilai Kontrak</th>
                    <th className="py-3 px-4 text-center">Status Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredB2B.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.schoolName}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.city} • {item.picContact}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {item.programType}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {item.studentQuota} Siswa
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        Rp {(item.contractValue / 1000000).toFixed(1)} Jt
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            STAGE_BADGE_MAP[item.stage]
                          }`}
                        >
                          {item.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* LEADERBOARD AFFILIATE AKTIF (PIC: ZIDAN) */}
        <Card className="lg:col-span-5 border border-slate-200/70 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Award className="w-4 h-4" />
                  </div>
                  Affiliate & Duta Kampus Aktif
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Penanggung Jawab: <strong>Zidan</strong> • Komisi 15% per transaksi
                </CardDescription>
              </div>
              <Badge variant="default" className="text-[10px]">
                Top 5 Creator
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {INITIAL_AFFILIATES.map((aff, idx) => (
              <div
                key={aff.id}
                className="p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-slate-50/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{aff.name}</p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {aff.referralCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {aff.campusOrigin} • CVR {aff.conversionRate}%
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-extrabold text-emerald-700">
                    {aff.totalConversions} Paket
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Komisi Rp {(aff.commissionEarned / 1000000).toFixed(2)} Jt
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. BENTO GRID ROW 3: KALENDER TIKTOK LIVE (6 COL) + STATUS KEYWORD SEO (6 COL) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* KALENDER TIKTOK LIVE (PIC: ABDUR) */}
        <Card className="lg:col-span-6 border border-slate-200/70 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  Kalender & Performa TikTok Live
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Penanggung Jawab: <strong>Abdur</strong> (Marketing TikTok Live)
                </CardDescription>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Live Setiap 19:30 WIB
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {INITIAL_TIKTOK_SCHEDULE.map((live) => {
              const pct = Math.min(100, Math.round((live.actualViewers / live.targetViewers) * 100));
              return (
                <div
                  key={live.id}
                  className="p-3.5 rounded-xl border border-slate-200/70 bg-white hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          live.status === 'Sedang Live'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : live.status === 'Selesai'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {live.status}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700">
                        {live.dateLabel} • {live.timeSlot}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600">
                      +{live.leadsCaptured} Leads
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{live.topic}</h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Host: <strong>{live.hostTutor}</strong></span>
                    <span>
                      Viewers: <strong>{live.actualViewers.toLocaleString('id-ID')}</strong> /{' '}
                      {live.targetViewers.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* STATUS KEYWORD SEO (PIC: RENDI) */}
        <Card className="lg:col-span-6 border border-slate-200/70 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                    <Search className="w-4 h-4" />
                  </div>
                  Status Keyword SEO & Peringkat SERP Google
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Penanggung Jawab: <strong>Rendi</strong> (PJ IT & Marketing SEO)
                </CardDescription>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                CTR Rata-rata 11.4%
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Kata Kunci (Keyword)</th>
                    <th className="py-3 px-4 text-center">Posisi SERP</th>
                    <th className="py-3 px-4 text-right">Volume/Bln</th>
                    <th className="py-3 px-4 text-right">Klik Organik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {INITIAL_SEO_KEYWORDS.map((kw) => {
                    const rankDelta = kw.previousRank - kw.currentRank;
                    return (
                      <tr key={kw.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{kw.keyword}</div>
                          <div className="text-[10px] text-slate-400">
                            Cluster: {kw.cluster} • <code className="text-indigo-600">{kw.targetUrl}</code>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                            #{kw.currentRank}
                            {rankDelta > 0 && (
                              <span className="text-[10px] text-emerald-600">▲{rankDelta}</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 font-medium">
                          {kw.searchVolume.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {kw.monthlyClicks.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 5. BENTO GRID ROW 4: MEDIA PARTNERSHIP TRACKER (PIC: ZAKI) */}
      <motion.div variants={itemVariants}>
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <Share2 className="w-4 h-4" />
                  </div>
                  Media Partnership & Kolaborasi Komunitas Kampus
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Penanggung Jawab: <strong>Zaki</strong> (PJ Cek Skor, PJ Admin & Marketing Media Partnership)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-semibold text-amber-700 border-amber-200 bg-amber-50">
                39 / 45 Partner Terpublikasi
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {INITIAL_MEDIA_PARTNERS.map((mp) => (
                <div
                  key={mp.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {mp.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">{mp.followers} Followers</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{mp.partnerName}</h4>
                    <p className="text-[11px] text-indigo-600 font-medium">{mp.handle}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{mp.deliverable}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                    <span className="text-slate-400">Tayang: {mp.publishDate}</span>
                    <span className="font-semibold text-emerald-700">{mp.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

