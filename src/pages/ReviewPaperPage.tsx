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

interface Paper {
  paperId: string
  paperTitle: string
  documentUrl: string | null
  conferenceStatus: 'Waiting' | 'Accepted' | 'Rejected'
  type: string | null
  subTheme: string | null
  presenterName: string | null
  presenterEmail: string | null
}

const STATUS_BADGE: Record<Paper['conferenceStatus'], string> = {
  Waiting: 'bg-amber-100 text-amber-800 border-amber-300',
  Accepted: 'bg-green-100 text-green-800 border-green-300',
  Rejected: 'bg-red-100 text-red-800 border-red-300',
}

export function ReviewPaperPage() {
  usePageTitle('Review Paper')
  const queryClient = useQueryClient()
  const [conferenceId, setConferenceId] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Paper['conferenceStatus']>('all')

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const { data: papers, isLoading } = useQuery({
    queryKey: ['papers', conferenceId],
    queryFn: async () => (await api.get<Paper[]>(`/papers?conferenceId=${conferenceId}`)).data,
    enabled: !!conferenceId,
  })

  const statusMutation = useMutation({
    mutationFn: ({ paperId, status }: { paperId: string; status: Paper['conferenceStatus'] }) =>
      api.patch(`/papers/${paperId}/status`, { conferenceStatus: status }),
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['papers', conferenceId] })
      toastSuccess(`Paper berhasil di-${status === 'Accepted' ? 'accept' : 'reject'}.`)
    },
    onError: (err) => toastError(err, 'Gagal mengubah status paper.'),
  })

  const filteredPapers = papers?.filter((p) => statusFilter === 'all' || p.conferenceStatus === statusFilter) ?? []

  const columns = useMemo<ColumnDef<Paper, any>[]>(
    () => [
      {
        accessorKey: 'paperTitle',
        header: 'Judul Paper',
        cell: ({ row }) =>
          row.original.documentUrl ? (
            <a
              href={row.original.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-navy hover:underline"
            >
              {row.original.paperTitle}
            </a>
          ) : (
            <span className="font-medium">{row.original.paperTitle}</span>
          ),
      },
      { accessorKey: 'presenterName', header: 'Presenter', cell: (c) => c.getValue() ?? '-' },
      { accessorKey: 'subTheme', header: 'Sub Tema', cell: (c) => c.getValue() ?? '-' },
      {
        accessorKey: 'conferenceStatus',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as Paper['conferenceStatus']
          return (
            <span className={`rounded-full border px-2 py-1 text-xs font-medium ${STATUS_BADGE[status]}`}>
              {status}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Aksi',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              disabled={row.original.conferenceStatus === 'Accepted' || statusMutation.isPending}
              onClick={() => statusMutation.mutate({ paperId: row.original.paperId, status: 'Accepted' })}
              className="rounded-md border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-40"
            >
              Accept
            </button>
            <button
              disabled={row.original.conferenceStatus === 'Rejected' || statusMutation.isPending}
              onClick={() => statusMutation.mutate({ paperId: row.original.paperId, status: 'Rejected' })}
              className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              Reject
            </button>
          </div>
        ),
      },
    ],
    [statusMutation],
  )

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Review Paper</h1>

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Conference</label>
          <select
            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            value={conferenceId}
            onChange={(e) => setConferenceId(e.target.value)}
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Filter Status</label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | Paper['conferenceStatus'])}
            >
              <option value="all">Semua Status</option>
              <option value="Waiting">Waiting</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {conferenceId &&
        (isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
        ) : (
          <DataTable columns={columns} data={filteredPapers} searchPlaceholder="Cari judul/presenter..." />
        ))}
    </div>
  )
}
