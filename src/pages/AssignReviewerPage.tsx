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

interface Reviewer {
  reviewerId: string
  name: string
  email: string
}

interface AssignedReviewer {
  reviewId: string
  name: string
  deadline: string
  accepted: boolean | null
}

interface Paper {
  paperId: string
  paperTitle: string
  paperStatus: string
  presenterName: string | null
  reviewers: AssignedReviewer[]
}

export function AssignReviewerPage() {
  usePageTitle('Assign Reviewer')
  const queryClient = useQueryClient()
  const [conferenceId, setConferenceId] = useState('')
  const [assigningPaper, setAssigningPaper] = useState<Paper | null>(null)
  const [reviewerId, setReviewerId] = useState('')
  const [deadline, setDeadline] = useState('')

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const { data: reviewers } = useQuery({
    queryKey: ['assign-reviewer', 'reviewers'],
    queryFn: async () => (await api.get<Reviewer[]>('/assign-reviewer/reviewers')).data,
  })

  const { data: papers, isLoading } = useQuery({
    queryKey: ['assign-reviewer', conferenceId],
    queryFn: async () => (await api.get<Paper[]>(`/assign-reviewer/${conferenceId}`)).data,
    enabled: !!conferenceId,
  })

  const assignMutation = useMutation({
    mutationFn: () =>
      api.post('/assign-reviewer', { paperId: assigningPaper?.paperId, reviewerId, deadline }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assign-reviewer', conferenceId] })
      toastSuccess('Reviewer berhasil ditugaskan.')
      setAssigningPaper(null)
      setReviewerId('')
      setDeadline('')
    },
    onError: (err) => toastError(err, 'Gagal assign — mungkin reviewer ini sudah ditugaskan ke paper ini.'),
  })

  const columns = useMemo<ColumnDef<Paper, any>[]>(
    () => [
      { accessorKey: 'paperTitle', header: 'Judul Paper' },
      { accessorKey: 'presenterName', header: 'Presenter', cell: (c) => c.getValue() ?? '-' },
      { accessorKey: 'paperStatus', header: 'Status' },
      {
        id: 'reviewers',
        header: 'Reviewer Ditugaskan',
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.reviewers.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500">Belum ada</span>
          ) : (
            <ul className="list-inside list-disc">
              {row.original.reviewers.map((r) => (
                <li key={r.reviewId}>
                  {r.name} —{' '}
                  {r.accepted === true ? 'Diterima' : r.accepted === false ? 'Ditolak' : 'Menunggu'}
                </li>
              ))}
            </ul>
          ),
      },
      {
        id: 'actions',
        header: 'Aksi',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <button
            onClick={() => setAssigningPaper(row.original)}
            className="rounded-md border border-brand-navy px-2 py-1 text-xs font-medium text-brand-navy hover:bg-brand-navy hover:text-white dark:border-brand-orange dark:text-brand-orange dark:hover:bg-brand-orange dark:hover:text-brand-dark"
          >
            + Assign Reviewer
          </button>
        ),
      },
    ],
    [],
  )

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Assign Reviewer</h1>

      <div className="mb-4">
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

      {assigningPaper && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            assignMutation.mutate()
          }}
          className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface"
        >
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            Assign reviewer untuk: <span className="font-semibold">{assigningPaper.paperTitle}</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reviewer</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                required
              >
                <option value="">-- pilih reviewer --</option>
                {reviewers?.map((r) => (
                  <option key={r.reviewerId} value={r.reviewerId}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={assignMutation.isPending}
              className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
            >
              {assignMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => setAssigningPaper(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-white/15 dark:text-gray-300"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {conferenceId &&
        (isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
        ) : (
          <DataTable columns={columns} data={papers ?? []} searchPlaceholder="Cari judul/presenter..." />
        ))}
    </div>
  )
}
