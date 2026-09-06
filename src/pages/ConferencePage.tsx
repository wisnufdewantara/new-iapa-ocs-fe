import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '../lib/axios'
import { CONFERENCE_STATUS_LABEL, type ConferenceStatus } from '../config/conferenceStatus'
import { DataTable } from '../components/DataTable'

interface Conference {
  conference_id: string
  conference_name: string
  conference_date: string
  conference_end_date: string | null
  status: ConferenceStatus
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

export function ConferencePage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [subThemes, setSubThemes] = useState('')
  const [status, setStatus] = useState<ConferenceStatus>('coming_soon')
  const [error, setError] = useState('')

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
      setShowForm(false)
      setName('')
      setDate('')
      setEndDate('')
      setSubThemes('')
      setStatus('coming_soon')
      setError('')
    },
    onError: () => setError('Gagal membuat conference. Cek kembali data yang diisi.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ conferenceId, status }: { conferenceId: string; status: ConferenceStatus }) =>
      api.patch(`/conferences/${conferenceId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conferences'] }),
  })

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
    ],
    [statusMutation],
  )

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
          {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
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
    </div>
  )
}
