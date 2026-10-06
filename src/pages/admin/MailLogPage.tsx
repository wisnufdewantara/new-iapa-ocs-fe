import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { usePageTitle } from '../../hooks/usePageTitle'

interface EmailLogRow {
  id: string
  recipient: string
  subject: string
  type: string
  status: string
  error: string | null
  relatedId: string | null
  openedAt: string | null
  openCount: number
  createdAt: string
}

interface EmailLogStats {
  total: number
  sent: number
  failed: number
  opened: number
  retentionDays: number
}

// Label jenis email yang manusiawi (nilai `type` dari MailerService).
const TYPE_LABEL: Record<string, string> = {
  loa: 'LoA',
  invoice: 'Invoice',
  certificate: 'Sertifikat',
  certificate_award: 'Sertifikat Award',
  password_reset: 'Reset Password',
  test: 'Test SMTP',
  other: 'Lainnya',
}

function fmtDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'bad' | 'muted' }) {
  const toneCls =
    tone === 'good'
      ? 'text-green-600 dark:text-green-400'
      : tone === 'bad'
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-800 dark:text-gray-100'
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-brand-dark-surface">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneCls}`}>{value}</p>
    </div>
  )
}

// /admin/mail-log — Mail Log Monitoring (admin-only, permission
// 'developer:view'). Mantau tiap email keluar: terkirim / gagal, karena
// SMTP nggak nyimpen salinan ke folder Sent webmail. Log otomatis dihapus
// setelah 30 hari.
export function MailLogPage() {
  usePageTitle('Mail Log Monitoring')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['email-log-stats'],
    queryFn: async () => (await api.get<EmailLogStats>('/developer/email-log/stats')).data,
    refetchInterval: 30000,
  })

  const { data: rows, isLoading } = useQuery({
    queryKey: ['email-log', type, status, q],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      if (status) params.set('status', status)
      if (q) params.set('q', q)
      return (await api.get<EmailLogRow[]>(`/developer/email-log?${params.toString()}`)).data
    },
    refetchInterval: 30000,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Mail Log Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Riwayat tiap email yang dikirim sistem (LoA, invoice, sertifikat, reset password). Dipakai untuk memastikan
          email benar-benar terkirim — karena email yang dikirim lewat SMTP tidak tersimpan di folder <em>Sent</em>{' '}
          webmail. Log otomatis dihapus setelah {stats?.retentionDays ?? 30} hari.
        </p>
      </div>

      {/* Peringatan reliabilitas "read" — penting biar nggak disalahartikan. */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
        <strong>Catatan soal status "Dibaca":</strong> deteksi dibaca pakai pixel pelacak dan sifatnya{' '}
        <em>perkiraan</em>. Banyak aplikasi email memblokir atau me-<em>preload</em> gambar (Gmail, Apple Mail), jadi
        angka ini bisa meleset. Patokan utama tetap kolom <strong>Status</strong> (Terkirim / Gagal).
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total" value={stats?.total ?? 0} />
        <StatCard label="Terkirim" value={stats?.sent ?? 0} tone="good" />
        <StatCard label="Gagal" value={stats?.failed ?? 0} tone="bad" />
        <StatCard label="Terdeteksi Dibaca" value={stats?.opened ?? 0} tone="muted" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari email / subjek..."
          className="input input-bordered input-sm w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-brand-dark-surface dark:text-gray-100"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-brand-dark-surface dark:text-gray-100"
        >
          <option value="">Semua Jenis</option>
          {Object.entries(TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-brand-dark-surface dark:text-gray-100"
        >
          <option value="">Semua Status</option>
          <option value="sent">Terkirim</option>
          <option value="failed">Gagal</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-semibold">Waktu</th>
              <th className="px-4 py-2 font-semibold">Penerima</th>
              <th className="px-4 py-2 font-semibold">Jenis</th>
              <th className="px-4 py-2 font-semibold">Subjek</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Dibaca</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!isLoading && (rows?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  Belum ada log email.
                </td>
              </tr>
            )}
            {rows?.map((r) => (
              <tr key={r.id} className={r.status === 'failed' ? 'bg-red-50 dark:bg-red-500/10' : ''}>
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">{fmtDate(r.createdAt)}</td>
                <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{r.recipient}</td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                  {TYPE_LABEL[r.type] ?? r.type}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                  <span title={r.error ?? undefined}>{r.subject}</span>
                  {r.status === 'failed' && r.error && (
                    <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{r.error}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  {r.status === 'sent' ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                      Terkirim
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400">
                      Gagal
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                  {r.openedAt ? (
                    <span title={`${r.openCount}x, pertama ${fmtDate(r.openedAt)}`}>✓ {fmtDate(r.openedAt)}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
