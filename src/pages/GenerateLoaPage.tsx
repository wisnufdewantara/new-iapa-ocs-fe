import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '../lib/axios'
import { DataTable } from '../components/DataTable'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'

interface Conference {
  conference_id: string
  conference_name: string
}

interface LoaRow {
  paperId: string
  paperTitle: string
  submitterName: string
  sentLoa: boolean
}

export function GenerateLoaPage() {
  usePageTitle('Generate LoA')
  const queryClient = useQueryClient()
  const [conferenceId, setConferenceId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const { data: rows, isLoading } = useQuery({
    queryKey: ['loa', conferenceId],
    queryFn: async () => (await api.get<LoaRow[]>('/loa', { params: { conferenceId } })).data,
    enabled: !!conferenceId,
  })

  const sendOne = useMutation({
    mutationFn: (paperId: string) => api.post(`/loa/${paperId}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loa', conferenceId] })
      toastSuccess('LoA berhasil dikirim.')
    },
    onError: (err) => toastError(err, 'Gagal mengirim LoA.'),
  })

  const sendBulk = useMutation({
    mutationFn: () => api.post('/loa/send-bulk', { paperIds: [...selected] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loa', conferenceId] })
      toastSuccess(`${selected.size} LoA berhasil dikirim.`)
      setSelected(new Set())
    },
    onError: (err) => toastError(err, 'Gagal mengirim LoA secara massal.'),
  })

  const toggleSelected = (paperId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(paperId)) next.delete(paperId)
      else next.add(paperId)
      return next
    })
  }

  const download = async (paperId: string) => {
    // Endpoint ini dijaga JwtAuthGuard, jadi nggak bisa langsung window.open
    // (nggak kebawa header Authorization) — ambil sebagai blob dulu lewat
    // axios (yang otomatis nempelin Bearer token), baru buka di tab baru.
    const res = await api.get(`/loa/${paperId}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    window.open(url, '_blank')
  }

  const columns = useMemo<ColumnDef<LoaRow, any>[]>(
    () => [
      {
        id: 'select',
        header: '',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selected.has(row.original.paperId)}
            onChange={() => toggleSelected(row.original.paperId)}
            className="h-4 w-4"
          />
        ),
      },
      { accessorKey: 'paperTitle', header: 'Judul Paper' },
      { accessorKey: 'submitterName', header: 'Submitter' },
      {
        id: 'status',
        accessorKey: 'sentLoa',
        header: 'Status',
        enableGlobalFilter: false,
        cell: (c) =>
          c.getValue() ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-500/10 dark:text-green-400">
              Terkirim
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300">
              Belum
            </span>
          ),
      },
      {
        id: 'actions',
        header: '',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex gap-3">
            <button
              onClick={() => download(row.original.paperId)}
              className="text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange"
            >
              Download
            </button>
            <button
              onClick={() => sendOne.mutate(row.original.paperId)}
              disabled={sendOne.isPending}
              className="text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange"
            >
              Kirim
            </button>
          </div>
        ),
      },
    ],
    [selected, sendOne],
  )

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Generate LoA</h1>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Conference</label>
        <select
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          value={conferenceId}
          onChange={(e) => {
            setConferenceId(e.target.value)
            setSelected(new Set())
          }}
        >
          <option value="">-- pilih conference --</option>
          {conferences?.map((c) => (
            <option key={c.conference_id} value={c.conference_id}>
              {c.conference_name}
            </option>
          ))}
        </select>
      </div>

      {conferenceId && (
        <>
          <div className="mb-3">
            <button
              onClick={() => sendBulk.mutate()}
              disabled={selected.size === 0 || sendBulk.isPending}
              className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-40 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
            >
              {sendBulk.isPending ? 'Mengirim...' : `Kirim LoA (${selected.size} terpilih)`}
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
          ) : (
            <DataTable columns={columns} data={rows ?? []} searchPlaceholder="Cari judul paper/submitter..." />
          )}
        </>
      )}
    </div>
  )
}
