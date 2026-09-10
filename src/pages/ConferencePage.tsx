import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '../lib/axios'
import { CONFERENCE_STATUS_LABEL, type ConferenceStatus } from '../config/conferenceStatus'
import { DataTable } from '../components/DataTable'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'

interface Conference {
  conference_id: string
  conference_name: string
  conference_date: string
  conference_end_date: string | null
  status: ConferenceStatus
}

interface ConferenceSetting {
  conference_id: string
  setting_key: string
  setting_value: string | null
}

interface ConferencePoster {
  id: string
  image_url: string
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

export function ConferencePage() {
  usePageTitle('Daftar Conference')
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [subThemes, setSubThemes] = useState('')
  const [status, setStatus] = useState<ConferenceStatus>('coming_soon')
  const [settingsConferenceId, setSettingsConferenceId] = useState('')
  const [deadlineDraft, setDeadlineDraft] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/conferences', {
        conferenceName: name,
        conferenceDate: date,
        conferenceEndDate: endDate || undefined,
        subThemes: subThemes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferences'] })
      toastSuccess('Conference berhasil dibuat.')
      setShowForm(false)
      setName('')
      setDate('')
      setEndDate('')
      setSubThemes('')
      setStatus('coming_soon')
    },
    onError: (err) => toastError(err, 'Gagal membuat conference. Cek kembali data yang diisi.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ conferenceId, status }: { conferenceId: string; status: ConferenceStatus }) =>
      api.patch(`/conferences/${conferenceId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferences'] })
      toastSuccess('Status conference berhasil diubah.')
    },
    onError: (err) => toastError(err, 'Gagal mengubah status conference.'),
  })

  const { data: conferenceSettings } = useQuery({
    queryKey: ['conference-settings', settingsConferenceId],
    queryFn: async () =>
      (await api.get<ConferenceSetting[]>(`/conferences/${settingsConferenceId}/settings`)).data,
    enabled: !!settingsConferenceId,
  })

  const saveDeadlineMutation = useMutation({
    mutationFn: (value: string) =>
      api.put(`/conferences/${settingsConferenceId}/settings/payment_deadline_text`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conference-settings', settingsConferenceId] })
      toastSuccess('Tenggat pembayaran berhasil diubah.')
    },
    onError: (err) => toastError(err, 'Gagal menyimpan tenggat pembayaran.'),
  })

  const deadlineSetting = conferenceSettings?.find((s) => s.setting_key === 'payment_deadline_text')

  useEffect(() => {
    setDeadlineDraft(deadlineSetting?.setting_value ?? '')
  }, [deadlineSetting?.setting_value, settingsConferenceId])

  const { data: posters } = useQuery({
    queryKey: ['conference-posters', settingsConferenceId],
    queryFn: async () => (await api.get<ConferencePoster[]>(`/conferences/${settingsConferenceId}/posters`)).data,
    enabled: !!settingsConferenceId,
  })

  const uploadPosterMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('image', file)
      return api.post(`/conferences/${settingsConferenceId}/posters`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conference-posters', settingsConferenceId] })
      toastSuccess('Poster berhasil diupload.')
    },
    onError: (err) => toastError(err, 'Gagal upload poster.'),
  })

  const deletePosterMutation = useMutation({
    mutationFn: (posterId: string) => api.delete(`/conferences/${settingsConferenceId}/posters/${posterId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conference-posters', settingsConferenceId] })
      toastSuccess('Poster berhasil dihapus.')
    },
    onError: (err) => toastError(err, 'Gagal menghapus poster.'),
  })

  const movePosterMutation = useMutation({
    mutationFn: ({ posterId, direction }: { posterId: string; direction: 'up' | 'down' }) =>
      api.patch(`/conferences/${settingsConferenceId}/posters/${posterId}`, { direction }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conference-posters', settingsConferenceId] }),
    onError: (err) => toastError(err, 'Gagal mengubah urutan poster.'),
  })

  const handlePosterFiles = (files: FileList | null) => {
    if (!files) return
    // Upload satu-satu ke endpoint yang sama (backend cuma terima 1 file
    // per request) — biar admin bisa pilih banyak gambar sekaligus dari
    // file picker.
    Array.from(files).forEach((file) => uploadPosterMutation.mutate(file))
  }

  const apiOrigin = (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '')

  const columns = useMemo<ColumnDef<Conference, any>[]>(
    () => [
      { accessorKey: 'conference_name', header: 'Nama' },
      { accessorKey: 'conference_date', header: 'Mulai', cell: (c) => fmt(c.getValue() as string) },
      { accessorKey: 'conference_end_date', header: 'Selesai', cell: (c) => fmt(c.getValue() as string | null) },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status di Homepage',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <select
            className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            value={row.original.status}
            disabled={statusMutation.isPending}
            onChange={(e) =>
              statusMutation.mutate({ conferenceId: row.original.conference_id, status: e.target.value as ConferenceStatus })
            }
          >
            {Object.entries(CONFERENCE_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <button
            onClick={() => setSettingsConferenceId(row.original.conference_id)}
            className="text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange"
          >
            Atur
          </button>
        ),
      },
    ],
    [statusMutation],
  )

  const settingsConference = data?.find((c) => c.conference_id === settingsConferenceId)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Conference</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark"
        >
          {showForm ? 'Batal' : '+ Buat Conference'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate()
          }}
          className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Conference</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sub Tema (pisah koma)</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={subThemes}
                onChange={(e) => setSubThemes(e.target.value)}
                placeholder="Governance, Digitalization"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Mulai</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Selesai</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status di Homepage</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={status}
                onChange={(e) => setStatus(e.target.value as ConferenceStatus)}
              >
                {Object.entries(CONFERENCE_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="mt-4 rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50"
          >
            {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
      ) : (
        <DataTable columns={columns} data={data ?? []} searchPlaceholder="Cari nama conference..." />
      )}

      {settingsConference && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Pengaturan Acara — {settingsConference.conference_name}
            </h2>
            <button
              onClick={() => setSettingsConferenceId('')}
              className="text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              Tutup
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="w-40 text-sm font-medium text-gray-700 dark:text-gray-300">Tenggat Pembayaran</label>
            <input
              value={deadlineDraft}
              onChange={(e) => setDeadlineDraft(e.target.value)}
              placeholder='mis. "October 10th, 2026"'
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            />
            <button
              disabled={deadlineDraft === (deadlineSetting?.setting_value ?? '') || saveDeadlineMutation.isPending}
              onClick={() => saveDeadlineMutation.mutate(deadlineDraft)}
              className="rounded-md bg-brand-navy px-3 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-40 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
            >
              Simpan
            </button>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Poster Acara (bisa lebih dari satu, ditampilkan slideshow di homepage)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handlePosterFiles(e.target.files)
                e.target.value = ''
              }}
              disabled={uploadPosterMutation.isPending}
              className="mb-4 text-sm text-gray-600 dark:text-gray-300"
            />
            {posters && posters.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada poster diupload.</p>
            )}
            <div className="flex flex-wrap gap-4">
              {posters?.map((p, i) => (
                <div key={p.id} className="w-32">
                  <img
                    src={`${apiOrigin}${p.image_url}`}
                    alt="Poster"
                    className="mb-1 aspect-[3/4] w-full rounded-md border border-gray-200 object-cover dark:border-white/10"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-1">
                      <button
                        disabled={i === 0 || movePosterMutation.isPending}
                        onClick={() => movePosterMutation.mutate({ posterId: p.id, direction: 'up' })}
                        className="text-gray-500 hover:text-gray-800 disabled:opacity-30 dark:text-gray-400 dark:hover:text-gray-100"
                      >
                        ↑
                      </button>
                      <button
                        disabled={i === posters.length - 1 || movePosterMutation.isPending}
                        onClick={() => movePosterMutation.mutate({ posterId: p.id, direction: 'down' })}
                        className="text-gray-500 hover:text-gray-800 disabled:opacity-30 dark:text-gray-400 dark:hover:text-gray-100"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      onClick={() => confirm('Hapus poster ini?') && deletePosterMutation.mutate(p.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
