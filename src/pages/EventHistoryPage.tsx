import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { usePageTitle } from '../hooks/usePageTitle'
import logo from '../assets/logo-iapa.png'

interface Conference {
  conference_id: string
  conference_name: string
  conference_date: string
  conference_end_date: string | null
}

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export function EventHistoryPage() {
  usePageTitle('Riwayat Event')
  const { data, isLoading } = useQuery({
    queryKey: ['conferences', 'history'],
    queryFn: async () => (await api.get<Conference[]>('/conferences/history')).data,
  })

  return (
    <div className="min-h-screen bg-[#f6f3ee] dark:bg-brand-dark">
      <header className="flex items-center justify-between border-b border-[#ddd6c8] px-6 py-6 dark:border-white/10 sm:px-16">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="IAPA" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle className="text-[#1c1917] dark:text-gray-200" />
          <Link
            to="/"
            className="font-sans text-sm font-semibold text-brand-navy hover:text-brand-navy-dark dark:text-brand-orange dark:hover:text-brand-orange-dark"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:px-16">
        <div className="mb-2 font-sans text-xs font-semibold tracking-[0.14em] text-brand-navy uppercase dark:text-brand-orange">
          Arsip
        </div>
        <h1 className="mb-8 text-3xl font-normal text-[#1c1917] dark:text-gray-50 sm:text-4xl">
          Riwayat Event Sebelumnya
        </h1>

        {isLoading && <p className="font-sans text-sm text-[#78716c] dark:text-gray-400">Memuat...</p>}
        {data?.length === 0 && !isLoading && (
          <p className="font-sans text-sm text-[#78716c] dark:text-gray-400">Belum ada event yang berakhir.</p>
        )}

        <div className="flex flex-col divide-y divide-[#ddd6c8] border-t border-b border-[#ddd6c8] dark:divide-white/10 dark:border-white/10">
          {data?.map((c) => (
            <Link
              key={c.conference_id}
              to={`/event-history/${c.conference_id}`}
              className="flex flex-col gap-1 py-6 hover:bg-[#efeae0] dark:hover:bg-white/5"
            >
              <span className="text-xl text-[#1c1917] dark:text-gray-50">{c.conference_name}</span>
              <span className="font-sans text-sm text-[#78716c] dark:text-gray-400">
                {fmt(c.conference_date)}
                {c.conference_end_date ? ` – ${fmt(c.conference_end_date)}` : ''}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
