import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '../lib/axios'
import { DataTable } from '../components/DataTable'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'

interface Setting {
  settingKey: string
  label: string
  settingValue: string
}

interface SystemInfo {
  version: string
  dbConnected: boolean
}

interface AuditLogRow {
  id: string
  action: string
  entity: string
  entity_id: string | null
  detail: string | null
  created_at: string
}

// /admin/settings sekarang murni System Settings (level infrastruktur
// aplikasi) — setting per-conference (tenggat pembayaran dst) pindah ke
// halaman Conference, lihat panel "Pengaturan Acara" di ConferencePage.
export function SettingsPage() {
  usePageTitle('Pengaturan Sistem')
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Setting[]>('/settings')).data,
  })

  const { data: systemInfo } = useQuery({
    queryKey: ['settings-system-info'],
    queryFn: async () => (await api.get<SystemInfo>('/settings/system-info')).data,
  })

  const { data: auditLog } = useQuery({
    queryKey: ['settings-audit-log'],
    queryFn: async () => (await api.get<AuditLogRow[]>('/settings/audit-log')).data,
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => api.put(`/settings/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toastSuccess('Pengaturan berhasil diubah.')
    },
    onError: (err) => toastError(err, 'Gagal menyimpan pengaturan.'),
  })

  const testSmtpMutation = useMutation({
    mutationFn: () => api.post<{ sent: boolean; to: string }>('/settings/test-smtp'),
    onSuccess: (res) => toastSuccess(`Email test terkirim ke ${res.data.to}.`),
    onError: (err) => toastError(err, 'Gagal mengirim email test.'),
  })

  const smtpKeys = ['smtp.host', 'smtp.port', 'smtp.user', 'smtp.password', 'smtp.from_name']
  const smtpSettings = data?.filter((s) => smtpKeys.includes(s.settingKey)) ?? []
  const otherSettings = data?.filter((s) => !smtpKeys.includes(s.settingKey)) ?? []

  const auditColumns = useMemo<ColumnDef<AuditLogRow, any>[]>(
    () => [
      { accessorKey: 'created_at', header: 'Waktu', cell: (c) => new Date(c.getValue() as string).toLocaleString('id-ID') },
      { accessorKey: 'action', header: 'Aksi' },
      { accessorKey: 'entity', header: 'Entitas' },
      { accessorKey: 'entity_id', header: 'ID', cell: (c) => c.getValue() ?? '-' },
      { accessorKey: 'detail', header: 'Detail', cell: (c) => c.getValue() ?? '-' },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Pengaturan Sistem</h1>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>}

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <h2 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">Info Sistem</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Versi aplikasi: {systemInfo?.version ?? '-'}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Koneksi database:{' '}
          {systemInfo ? (
            systemInfo.dbConnected ? (
              <span className="text-green-600 dark:text-green-400">Terhubung</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">Terputus</span>
            )
          ) : (
            '-'
          )}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Konfigurasi SMTP</h2>
        <div className="flex flex-col gap-3">
          {smtpSettings.map((s) => {
            const draft = drafts[s.settingKey] ?? s.settingValue
            const dirty = draft !== s.settingValue
            return (
              <div key={s.settingKey} className="flex flex-wrap items-center gap-3">
                <label className="w-40 text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</label>
                <input
                  type={s.settingKey === 'smtp.password' ? 'password' : 'text'}
                  value={draft}
                  onChange={(e) => setDrafts((d) => ({ ...d, [s.settingKey]: e.target.value }))}
                  className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                />
                <button
                  disabled={!dirty || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ key: s.settingKey, value: draft })}
                  className="rounded-md bg-brand-navy px-3 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-40 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
                >
                  Simpan
                </button>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => testSmtpMutation.mutate()}
            disabled={testSmtpMutation.isPending}
            className="rounded-md border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-navy/5 disabled:opacity-50 dark:border-brand-orange dark:text-brand-orange"
          >
            {testSmtpMutation.isPending ? 'Mengirim...' : 'Test SMTP'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Payment Gateway</h2>
        {otherSettings.map((s) => {
          const draft = drafts[s.settingKey] ?? s.settingValue
          const dirty = draft !== s.settingValue
          return (
            <div key={s.settingKey} className="flex flex-wrap items-center gap-3">
              <label className="w-40 text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</label>
              <input
                value={draft}
                onChange={(e) => setDrafts((d) => ({ ...d, [s.settingKey]: e.target.value }))}
                className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
              />
              <button
                disabled={!dirty || updateMutation.isPending}
                onClick={() => updateMutation.mutate({ key: s.settingKey, value: draft })}
                className="rounded-md bg-brand-navy px-3 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-40 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
              >
                Simpan
              </button>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Activity Log</h2>
        <DataTable columns={auditColumns} data={auditLog ?? []} searchPlaceholder="Cari aksi/entitas..." />
      </div>
    </div>
  )
}
