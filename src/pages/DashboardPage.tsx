import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import type { SummaryStats } from '../types/stats'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAuthStore } from '../stores/authStore'
import { PesertaProgressDashboard } from './PesertaProgressDashboard'
import { MyPaymentCards } from '../components/MyPaymentCards'

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
      {role === 'Peserta' ? (
        <div className="flex flex-col gap-6">
          {/* Muncul cuma kalau ada tagihan yang masih nunggu bukti transfer */}
          <MyPaymentCards onlyNeedingProof title="Upload Bukti Transfer" />
          <PesertaProgressDashboard />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ActionSummaryCards />
          <ConferenceListDashboard />
        </div>
      )}
    </div>
  )
}

// Kartu "yang perlu ditindaklanjuti" buat role non-Peserta. Item yang
// muncul sudah difilter backend sesuai permission role (bukan hardcode
// nama role di sini — role custom juga kebagian). Isinya cuma hitungan,
// nggak ada nama/data pribadi. Gagal muat / kosong = nggak tampil apa-apa,
// daftar conference di bawahnya tetap jalan.
function ActionSummaryCards() {
  // Kartunya beda per role & cache React Query nggak dibersihin pas
  // logout/impersonate — key harus ikut user, kalau nggak login ulang
  // sebagai role lain masih lihat kartu role sebelumnya (pola useMenu).
  const userId = useAuthStore((s) => s.user?.userId)
  const role = useAuthStore((s) => s.user?.role)
  const { data } = useQuery({
    queryKey: ['stats-summary', userId, role],
    queryFn: async () => (await api.get<SummaryStats>('/stats/summary')).data,
    enabled: !!role,
    staleTime: 60_000,
  })
  if (!data || data.items.length === 0) return null

  return (
    <section aria-labelledby="action-summary-title">
      <h2
        id="action-summary-title"
        className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500"
      >
        Perlu ditindaklanjuti · conference aktif
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.items.map((item) => {
          // Yang nol tetap tampil tapi diredam — biar kelihatan "beres",
          // bukan hilang dan bikin bingung kartunya ke mana.
          const done = item.count === 0
          return (
            <Link
              key={item.key}
              to={item.path}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-navy/40 dark:border-white/10 dark:bg-brand-dark-surface dark:hover:border-brand-orange/40"
            >
              <span
                className={`min-w-[2.5ch] text-3xl font-semibold ${
                  done ? 'text-gray-300 dark:text-gray-600' : 'text-gray-800 dark:text-gray-100'
                }`}
              >
                {item.count.toLocaleString('id-ID')}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm ${done ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs text-brand-navy dark:text-brand-orange">
                  {done ? 'Beres' : 'Buka →'}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
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
