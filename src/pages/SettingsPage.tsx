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

interface EmailTemplate {
  templateKey: string
  label: string
  variables: string[]
  subject: string
  bodyHtml: string
}

const BANK_KEYS = ['payment.bank_name', 'payment.bank_holder', 'payment.bank_account_number', 'payment.deadline_text']

// /admin/settings sekarang murni System Settings (level infrastruktur
// aplikasi) — setting per-conference (tenggat pembayaran dst) pindah ke
// halaman Conference, lihat panel "Pengaturan Acara" di ConferencePage.
export function SettingsPage() {
  usePageTitle('Pengaturan Sistem')
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [testEmail, setTestEmail] = useState('')
  const [templateKey, setTemplateKey] = useState('')
  const [templateDraft, setTemplateDraft] = useState<{ subject: string; bodyHtml: string } | null>(null)

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

  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => (await api.get<EmailTemplate[]>('/email-templates')).data,
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
    mutationFn: () => api.post<{ sent: boolean; to: string }>('/settings/test-smtp', testEmail ? { to: testEmail } : {}),
    onSuccess: (res) => toastSuccess(`Email test terkirim ke ${res.data.to}.`),
    onError: (err) => toastError(err, 'Gagal mengirim email test.'),
  })

  const templateMutation = useMutation({
    mutationFn: ({ key, subject, bodyHtml }: { key: string; subject: string; bodyHtml: string }) =>
      api.put(`/email-templates/${key}`, { subject, bodyHtml }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toastSuccess('Template email berhasil diubah.')
    },
    onError: (err) => toastError(err, 'Gagal menyimpan template email.'),
  })

  const smtpKeys = ['smtp.host', 'smtp.port', 'smtp.user', 'smtp.password', 'smtp.from_name']
  const smtpSettings = data?.filter((s) => smtpKeys.includes(s.settingKey)) ?? []
  const bankSettings = data?.filter((s) => BANK_KEYS.includes(s.settingKey)) ?? []
  const manualTransferEnabled = (data?.find((s) => s.settingKey === 'payment.method.manual_transfer_enabled')?.settingValue ?? 'true') !== 'false'

  const activeTemplate = templates?.find((t) => t.templateKey === templateKey)
  const selectTemplate = (key: string) => {
    setTemplateKey(key)
    const t = templates?.find((t) => t.templateKey === key)
    setTemplateDraft(t ? { subject: t.subject, bodyHtml: t.bodyHtml } : null)
  }

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

  const inputClass = 'w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'

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
                  className={inputClass}
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
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="w-40 text-sm font-medium text-gray-700 dark:text-gray-300">Email Penerima Test</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Kosongkan = email akun kamu sendiri"
            className={inputClass}
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
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
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Metode Pembayaran</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
              <input
                type="checkbox"
                checked={manualTransferEnabled}
                onChange={(e) =>
                  updateMutation.mutate({ key: 'payment.method.manual_transfer_enabled', value: String(e.target.checked) })
                }
                className="h-4 w-4"
              />
              Transfer Manual
            </label>
            <div className="mt-3 ml-6 flex flex-col gap-3 border-l-2 border-gray-200 pl-4 dark:border-white/10">
              {bankSettings.map((s) => {
                const draft = drafts[s.settingKey] ?? s.settingValue
                const dirty = draft !== s.settingValue
                return (
                  <div key={s.settingKey} className="flex flex-wrap items-center gap-3">
                    <label className="w-40 text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</label>
                    <input
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [s.settingKey]: e.target.value }))}
                      className={inputClass}
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
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500">
            <input type="checkbox" checked={false} disabled className="h-4 w-4" />
            Xendit <span className="text-xs italic">(Coming Soon)</span>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500">
            <input type="checkbox" checked={false} disabled className="h-4 w-4" />
            BRI Virtual Account <span className="text-xs italic">(Coming Soon)</span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Template Email Notifikasi</h2>
        <div className="mb-3">
          <select
            value={templateKey}
            onChange={(e) => selectTemplate(e.target.value)}
            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          >
            <option value="">-- pilih template --</option>
            {templates?.map((t) => (
              <option key={t.templateKey} value={t.templateKey}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {activeTemplate && templateDraft && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Variabel tersedia: {activeTemplate.variables.map((v) => `{{${v}}}`).join(', ')}
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <input
                value={templateDraft.subject}
                onChange={(e) => setTemplateDraft({ ...templateDraft, subject: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Isi Email (HTML)</label>
              <textarea
                rows={5}
                value={templateDraft.bodyHtml}
                onChange={(e) => setTemplateDraft({ ...templateDraft, bodyHtml: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
              />
            </div>
            <button
              onClick={() => templateMutation.mutate({ key: templateKey, ...templateDraft })}
              disabled={
                templateMutation.isPending ||
                (templateDraft.subject === activeTemplate.subject && templateDraft.bodyHtml === activeTemplate.bodyHtml)
              }
              className="self-start rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-40 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
            >
              {templateMutation.isPending ? 'Menyimpan...' : 'Simpan Template'}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Activity Log</h2>
        <DataTable columns={auditColumns} data={auditLog ?? []} searchPlaceholder="Cari aksi/entitas..." />
      </div>
    </div>
  )
}
