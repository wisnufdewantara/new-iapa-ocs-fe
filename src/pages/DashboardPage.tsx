import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAuthStore } from '../stores/authStore'
import { PesertaProgressDashboard } from './PesertaProgressDashboard'

interface Conference {
  conference_id: string
  conference_name: string
  conference_date: string
  conference_end_date: string | null
}

// Peserta dapet progress tracker pribadi (lihat PesertaProgressDashboard)
// — daftar-semua-conference gak relevan buat mereka, termasuk yang udah
// lewat. Role lain (Admin/Manager/dst) tetap lihat daftar conference,
// itu emang kerjaan mereka ngelola/pantau semuanya.
export function DashboardPage() {
  usePageTitle('Dashboard')
  const role = useAuthStore((s) => s.user?.role)

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
      {role === 'Peserta' ? <PesertaProgressDashboard /> : <ConferenceListDashboard />}
    </div>
  )
}

function ConferenceListDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  return (
    <div>
      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data conference...</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">Gagal memuat data dari server.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((c) => (
          <div
            key={c.conference_id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-brand-dark-surface"
          >
            <p className="font-semibold text-gray-800 dark:text-gray-100">{c.conference_name}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {new Date(c.conference_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              {c.conference_end_date &&
                ` – ${new Date(c.conference_end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
