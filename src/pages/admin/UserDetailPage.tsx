import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/axios'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAuthStore } from '../../stores/authStore'
import { toastError } from '../../lib/toast'
import type { Role } from '../../types/role'

interface PaperInfo {
  paperId: string
  title: string
  paperStatus: string
  conferenceStatus: string | null
  conferenceName: string | null
}

interface CoAuthoredPaper {
  paperId: string
  title: string
  conferenceStatus: string | null
  conferenceName: string | null
  writerRole: string | null
}

interface ParticipantInfo {
  conferenceName: string | null
  isMember: boolean | null
  paymentStatus: string | null
  totalAmount: number | null
}

interface PaymentInfo {
  paymentId: string
  paperTitle: string | null
  amount: number | null
  status: string | null
}

interface UserDetail {
  userId: string
  username: string
  firstName: string
  lastName: string
  email: string
  phone: string
  affiliation: string
  country: string | null
  gender: string
  role: string
  createdAt: string | null
  photoUrl: string | null
  papers: PaperInfo[]
  coAuthoredPapers: CoAuthoredPaper[]
  participant: ParticipantInfo | null
  payments: PaymentInfo[]
}

const rupiah = (n: number | null) => (n == null ? '-' : `Rp${n.toLocaleString('id-ID')}`)

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
      <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  )
}

// Detail user buat admin (tombol "Lihat Profil" di Kelola Role) — read-only, agregat dari 3 domain (papers,
// participant, payments) sekaligus, biar admin nggak perlu buka 3
// halaman terpisah cuma buat ngecek 1 orang.
export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  usePageTitle('Detail User')

  const { data, isLoading } = useQuery({
    queryKey: ['user-detail', id],
    queryFn: async () => (await api.get<UserDetail>(`/users/${id}`)).data,
    enabled: !!id,
  })

  const startImpersonation = useAuthStore((s) => s.startImpersonation)
  const impersonate = useMutation({
    mutationFn: async () =>
      (
        await api.post<{
          accessToken: string
          user: { userId: string; username: string; firstName: string; lastName: string; email: string; role: Role }
        }>(`/users/${id}/impersonate`)
      ).data,
    onSuccess: ({ accessToken, user }) => {
      startImpersonation(accessToken, user)
      // Reload penuh — cache data admin nggak boleh kebawa ke sesi peserta.
      window.location.assign('/dashboard')
    },
    onError: (err) => toastError(err, 'Gagal login sebagai pengguna ini.'),
  })

  if (isLoading || !data) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/admin/roles" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
          ← Kembali ke Kelola Role
        </Link>
        <div className="mt-2 flex items-center gap-4">
          {data.photoUrl?.startsWith('https://') && (
            <img src={data.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {data.firstName} {data.lastName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{data.username} · {data.role}
            </p>
          </div>
          {data.role === 'Peserta' && (
            <button
              onClick={() => {
                if (confirm(`Login sebagai ${data.firstName} ${data.lastName}? Sesi berlaku 1 jam, dan tercatat di log.`)) {
                  impersonate.mutate()
                }
              }}
              disabled={impersonate.isPending}
              className="btn btn-outline btn-sm ml-auto"
            >
              {impersonate.isPending ? 'Memproses...' : 'Login sebagai Peserta Ini'}
            </button>
          )}
        </div>
      </div>

      <Card title="Info Akun">
        <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
          <p>Email: {data.email}</p>
          <p>Telepon: {data.phone}</p>
          <p>Afiliasi: {data.affiliation}</p>
          <p>Negara: {data.country ?? '-'}</p>
          <p>Gender: {data.gender}</p>
          <p>Terdaftar: {data.createdAt ? new Date(data.createdAt).toLocaleDateString('id-ID') : '-'}</p>
        </div>
      </Card>

      <Card title="Paper yang Disubmit">
        {data.papers.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Belum pernah submit paper.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.papers.map((p) => (
              <li key={p.paperId} className="rounded-md border border-gray-200 p-3 text-sm dark:border-white/10">
                <p className="font-medium text-gray-800 dark:text-gray-100">{p.title}</p>
                <p className="text-gray-500 dark:text-gray-400">
                  {p.conferenceName ?? '-'} · Status: {p.conferenceStatus ?? '-'} / {p.paperStatus}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Tercantum sebagai Penulis di Paper Lain">
        {data.coAuthoredPapers.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Tidak tercantum di paper orang lain.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.coAuthoredPapers.map((p) => (
              <li key={p.paperId} className="rounded-md border border-gray-200 p-3 text-sm dark:border-white/10">
                <p className="font-medium text-gray-800 dark:text-gray-100">{p.title}</p>
                <p className="text-gray-500 dark:text-gray-400">
                  {p.conferenceName ?? '-'} · {p.writerRole ?? 'Penulis'} · Status: {p.conferenceStatus ?? '-'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Data Peserta (Join Conference)">
        {!data.participant ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Belum pernah join sebagai peserta.</p>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p>Conference: {data.participant.conferenceName ?? '-'}</p>
            <p>Status keanggotaan: {data.participant.isMember ? 'Member IAPA' : 'Non-Member'}</p>
            <p>Biaya partisipasi: {rupiah(data.participant.totalAmount)}</p>
            <p>Status pembayaran: {data.participant.paymentStatus ?? '-'}</p>
            <Link to={`/payment/manage/participant/${data.userId}`} className="btn btn-outline btn-sm mt-3">
              Detail Pembayaran
            </Link>
          </div>
        )}
      </Card>

      <Card title="Pembayaran (Presenter/Tim)">
        {data.payments.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Tidak ada tagihan presenter.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.payments.map((p) => (
              <li key={p.paymentId}>
                <Link
                  to={`/payment/manage/${p.paymentId}`}
                  className="block rounded-md border border-gray-200 p-3 text-sm hover:border-blue-400 dark:border-white/10 dark:hover:border-blue-400"
                >
                  {p.paperTitle && <p className="font-medium text-gray-800 dark:text-gray-100">{p.paperTitle}</p>}
                  <p className="text-gray-800 dark:text-gray-100">{rupiah(p.amount)}</p>
                  <p className="text-gray-500 dark:text-gray-400">Status: {p.status ?? '-'}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
