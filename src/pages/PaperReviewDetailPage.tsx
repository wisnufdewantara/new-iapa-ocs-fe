import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { useMenu } from '../hooks/useMenu'
import { toastError, toastSuccess } from '../lib/toast'
import { FeedbackThread, type FeedbackMessage } from '../components/FeedbackThread'

interface PaperDetail {
  paperId: string
  paperTitle: string
  abstract: string | null
  keywords: string | null
  type: string | null
  subTheme: string | null
  conferenceStatus: 'Waiting' | 'Accepted' | 'Rejected' | null
  conferenceId: string | null
  conferenceName: string | null
  documentUrl: string | null
  paymentId: string | null
  submitter: { name: string; email: string } | null
  writers: { name: string; email: string; affiliation: string; role: string | null }[]
  messages: FeedbackMessage[]
}

const STATUS_BADGE: Record<string, string> = {
  Waiting: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  Accepted: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30',
  Rejected: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
}

// Halaman detail paper buat reviewer/admin (dari Review Paper) — info
// paper + keputusan Accept/Reject + thread feedback dengan penulis.
export function PaperReviewDetailPage() {
  const { paperId } = useParams<{ paperId: string }>()
  usePageTitle('Detail Paper')
  const queryClient = useQueryClient()
  const { data: menu } = useMenu()
  const canManagePayment = menu?.includes('/payment/manage') ?? false

  const { data, isLoading } = useQuery({
    queryKey: ['paper-review-detail', paperId],
    queryFn: async () => (await api.get<PaperDetail>(`/paper-feedback/reviewer/${paperId}`)).data,
    enabled: !!paperId,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['paper-review-detail', paperId] })
    if (data?.conferenceId) queryClient.invalidateQueries({ queryKey: ['papers', data.conferenceId] })
  }

  const statusMutation = useMutation({
    mutationFn: (status: 'Accepted' | 'Rejected' | 'Waiting') =>
      api.patch(`/papers/${paperId}/status`, { conferenceStatus: status }),
    onSuccess: (_res, status) => {
      toastSuccess(status === 'Waiting' ? 'Keputusan dibatalkan.' : `Paper di-${status === 'Accepted' ? 'accept' : 'reject'}.`)
      refresh()
    },
    onError: (err) => toastError(err, 'Gagal mengubah status paper.'),
  })

  if (isLoading || !data) return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>

  const status = data.conferenceStatus ?? 'Waiting'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/papers/review" className="btn btn-ghost btn-sm mb-2">
          &larr; Kembali ke Review Paper
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{data.paperTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {data.conferenceName ?? '-'}
          {data.submitter && ` · Submitter: ${data.submitter.name} (${data.submitter.email})`}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[status] ?? ''}`}>{status}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {data.documentUrl && (
              <a href={data.documentUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                Lihat Dokumen Paper
              </a>
            )}
            {canManagePayment && data.paymentId && (
              <Link to={`/payment/manage/${data.paymentId}`} className="btn btn-outline btn-sm">
                Lihat Pembayaran
              </Link>
            )}
            <button
              disabled={status === 'Accepted' || statusMutation.isPending}
              onClick={() => statusMutation.mutate('Accepted')}
              className="btn btn-success-ghost btn-sm"
            >
              Accept
            </button>
            <button
              disabled={status === 'Rejected' || statusMutation.isPending}
              onClick={() => statusMutation.mutate('Rejected')}
              className="btn btn-danger-ghost btn-sm"
            >
              Reject
            </button>
            {status !== 'Waiting' && (
              <button
                disabled={statusMutation.isPending}
                onClick={() => {
                  if (confirm('Batalkan keputusan? Status kembali ke Waiting.')) statusMutation.mutate('Waiting')
                }}
                className="btn btn-outline btn-sm"
              >
                Batalkan Keputusan
              </button>
            )}
          </div>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-400 dark:text-gray-500">Sub Tema</dt>
            <dd className="text-gray-800 dark:text-gray-100">{data.subTheme ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 dark:text-gray-500">Keywords</dt>
            <dd className="text-gray-800 dark:text-gray-100">{data.keywords ?? '-'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-400 dark:text-gray-500">Penulis</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {data.writers.length === 0
                ? '-'
                : data.writers.map((w) => `${w.name}${w.affiliation ? ` (${w.affiliation})` : ''}`).join(', ')}
            </dd>
          </div>
          {data.abstract && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-400 dark:text-gray-500">Abstrak</dt>
              <dd className="whitespace-pre-wrap text-gray-800 dark:text-gray-100">{data.abstract}</dd>
            </div>
          )}
        </dl>
      </div>

      <FeedbackThread
        messages={data.messages}
        viewer="reviewer"
        postEndpoint={`/paper-feedback/reviewer/${data.paperId}/messages`}
        onPosted={refresh}
      />
    </div>
  )
}
