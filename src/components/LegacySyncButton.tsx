import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/axios'

interface TableSyncResult {
  table: string
  rows: number
  skipped: { pk: string; reason: string }[]
  error?: string
}

interface LegacySyncResult {
  startedAt: string
  finishedAt: string
  totalRows: number
  totalSkipped: number
  tables: TableSyncResult[]
}

// Tombol sync manual ke DB OCS lawas (Supabase/Kila) — sebelumnya cuma
// bisa dijalankan lewat script di laptop (perlu SSH tunnel + kredensial
// manual). Endpoint di baliknya jalan LANGSUNG di server (connect ke
// Postgres lokal + REST API Supabase yang udah kebukti reachable dari
// jaringan Dewaweb), jadi admin bisa trigger kapan aja tanpa laptop.
export function LegacySyncButton() {
  const [open, setOpen] = useState(false)

  const sync = useMutation({
    mutationFn: async () => (await api.post<LegacySyncResult>('/legacy-sync/run')).data,
  })

  const close = () => {
    setOpen(false)
    sync.reset()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full shrink-0 border-t border-gray-200 px-4 py-2.5 text-left text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
      >
        &#x21bb; Sync dengan DB OCS Lawas
      </button>

      {open &&
        // Portal ke document.body — WAJIB, karena <aside> sidebar pakai
        // transition-transform (Tailwind translate-x-*), dan ancestor
        // dengan CSS transform jadi containing-block buat descendant
        // position:fixed. Tanpa portal, modal ini ke-"jebak" di dalam
        // area sidebar (ketutup/kepotong), bukan nutupin seluruh layar.
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-brand-dark-surface">
              <h2 className="mb-1 text-lg font-bold text-gray-800 dark:text-gray-100">Sync dengan DB OCS Lawas</h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Tarik data terbaru (user, paper, pembayaran, bukti transfer, dll) dari database ocs2/Supabase ke
                newocs. Cuma nambah/update data — nggak pernah menghapus.
              </p>

              {sync.isPending && (
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Sedang sync, mohon tunggu...</p>
              )}

              {sync.isError && (
                <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  Sync gagal: {(sync.error as any)?.response?.data?.message ?? (sync.error as Error).message}
                </p>
              )}

              {sync.isSuccess && (
                <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">
                  <p className="mb-2 font-semibold">
                    &#x2713; Sync berhasil — {sync.data.totalRows} baris tersinkron
                    {sync.data.totalSkipped > 0 && `, ${sync.data.totalSkipped} di-skip`}.
                  </p>
                  <ul className="space-y-0.5 text-xs">
                    {sync.data.tables.map((t) => (
                      <li key={t.table}>
                        <span className="font-mono">{t.table}</span>:{' '}
                        {t.error ? `GAGAL (${t.error})` : `${t.rows} baris`}
                        {!t.error && t.skipped.length > 0 && ` (${t.skipped.length} di-skip)`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={close} className="btn btn-ghost btn-sm">
                  Tutup
                </button>
                <button onClick={() => sync.mutate()} disabled={sync.isPending} className="btn btn-primary btn-sm">
                  {sync.isPending ? 'Menyinkronkan...' : 'Sync'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
