'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { inviteTeamMember } from '@/actions/auth';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ open, onClose }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<'OWNER' | 'TEAM'>('TEAM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setFullName('');
    setEmail('');
    setWhatsappNumber('');
    setTitle('');
    setRole('TEAM');
    setError(null);
    setCreated(null);
    setCopied(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await inviteTeamMember({ fullName, email, whatsappNumber, title, role });
    setSaving(false);
    if (res.success) setCreated({ email: email.trim(), password: res.tempPassword });
    else setError(res.error);
  }

  async function copy() {
    if (!created) return;
    await navigator.clipboard.writeText(`Email: ${created.email}\nPassword: ${created.password}`);
    setCopied(true);
  }

  const input =
    'w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#171717] outline-none transition-colors focus:border-[#171717]';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 sm:items-center sm:p-4"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-xl border border-[#E5E5E5] bg-white p-5 sm:rounded-xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#171717]">Undang anggota</p>
                <p className="text-xs text-[#737373]">Akun langsung aktif, tanpa verifikasi email.</p>
              </div>
              <button onClick={close} className="text-[#A3A3A3] hover:text-[#171717]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {created ? (
              <div className="space-y-4">
                <div className="space-y-1 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4 font-mono text-xs text-[#171717]">
                  <p>Email: {created.email}</p>
                  <p>Password: {created.password}</p>
                </div>
                <p className="text-xs text-[#737373]">
                  Bagikan kredensial ini ke anggota terkait. Mereka bisa langsung masuk.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 rounded-md border border-[#E5E5E5] px-3 py-2 text-xs text-[#171717] hover:bg-[#FAFAFA]"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                  <button
                    onClick={close}
                    className="rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-[#262626]"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                {error && <p className="rounded-md bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]">{error}</p>}
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap" className={input} />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={input} />
                <input required type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="Nomor WhatsApp, mis. +62 812…" className={input} />
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Jabatan / jobdesk utama" className={input} />
                <div className="flex rounded-md border border-[#E5E5E5] p-0.5">
                  {(['TEAM', 'OWNER'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 rounded py-1.5 text-xs transition-colors ${
                        role === r ? 'bg-[#171717] text-white' : 'text-[#737373] hover:text-[#171717]'
                      }`}
                    >
                      {r === 'TEAM' ? 'Anggota tim' : 'Owner'}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={close} className="px-3 py-2 text-xs text-[#737373] hover:text-[#171717]">
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-[#262626] disabled:opacity-60"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Buat akun
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
