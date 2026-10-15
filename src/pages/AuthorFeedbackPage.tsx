import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { FeedbackThread, type FeedbackMessage } from '../components/FeedbackThread'

interface AuthorThread {
  paperId: string
  paperTitle: string
  conferenceStatus: string | null
  conferenceName: string | null
  messages: FeedbackMessage[]
}

// Sisi penulis: lihat & balas feedback. Semua pesan reviewer tampil
// sebagai "Tim Reviewer" (disamarkan backend, bukan di sini).
export function AuthorFeedbackPage() {
  const { paperId } = useParams<{ paperId: string }>()
  usePageTitle('Feedback Paper')
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['author-feedback', paperId],
    queryFn: async () => (await api.get<AuthorThread>(`/paper-feedback/mine/${paperId}`)).data,
    enabled: !!paperId,
  })

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  if (isError || !data) return <p className="text-sm text-gray-500 dark:text-gray-400">Paper tidak ditemukan.</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/dashboard" className="btn btn-ghost btn-sm mb-2">
          &larr; Kembali ke Dashboard
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{data.paperTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {data.conferenceName ?? '-'} · Status: {data.conferenceStatus ?? 'Waiting'}
        </p>
      </div>

      <FeedbackThread
        messages={data.messages}
        viewer="author"
        postEndpoint={`/paper-feedback/mine/${data.paperId}/messages`}
        onPosted={() => {
          queryClient.invalidateQueries({ queryKey: ['author-feedback', paperId] })
          queryClient.invalidateQueries({ queryKey: ['my-paper'] })
        }}
      />
    </div>
  )
}
