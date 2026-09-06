import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { usePageTitle } from '../hooks/usePageTitle'
import logo from '../assets/logo-iapa.png'

interface EventDetail {
  conference_id: string
  conference_name: string
  conference_date: string
  conference_end_date: string | null
  conference_sub_theme: { sub_theme: string | null }[]
  papers_conference_best_paperTopapers: {
    paper_title: string
    paper_writers: { first_name: string; last_name: string }[]
  } | null
  paper_writers: { first_name: string; last_name: string } | null
}

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['conferences', 'history', id],
    queryFn: async () => (await api.get<EventDetail>(`/conferences/history/${id}`)).data,
    enabled: !!id,
  })
  usePageTitle(data?.conference_name ?? 'Riwayat Event')

  const bestPresenterName = data?.papers_conference_best_paperTopapers?.paper_writers[0]
  const bestPresenterOnlyName = data?.paper_writers

  return (
    <div className="min-h-screen bg-[#f6f3ee] dark:bg-brand-dark">
      <header className="flex items-center justify-between border-b border-[#ddd6c8] px-6 py-6 dark:border-white/10 sm:px-16">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="IAPA" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle className="text-[#1c1917] dark:text-gray-200" />
          <Link
            to="/event-history"
            className="font-sans text-sm font-semibold text-brand-navy hover:text-brand-navy-dark dark:text-brand-orange dark:hover:text-brand-orange-dark"
          >
            ← Riwayat Event
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:px-16">
        {isLoading && <p className="font-sans text-sm text-[#78716c] dark:text-gray-400">Memuat...</p>}

        {data && (
          <>
            <div className="mb-2 font-sans text-xs font-semibold tracking-[0.14em] text-brand-navy uppercase dark:text-brand-orange">
              Event Selesai
            </div>
            <h1 className="mb-3 text-3xl font-normal text-[#1c1917] dark:text-gray-50 sm:text-4xl">
              {data.conference_name}
            </h1>
            <p className="mb-10 font-sans text-base text-[#57534e] dark:text-gray-400">
              {fmt(data.conference_date)}
              {data.conference_end_date ? ` – ${fmt(data.conference_end_date)}` : ''}
            </p>

            {data.conference_sub_theme.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-3 font-sans text-sm font-semibold text-[#1c1917] uppercase tracking-wide dark:text-gray-100">
                  Sub Tema
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.conference_sub_theme.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-sm border border-[#ddd6c8] bg-white px-3 py-1 font-sans text-sm text-[#57534e] dark:border-white/10 dark:bg-brand-dark-surface dark:text-gray-300"
                    >
                      {s.sub_theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-[#ddd6c8] bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface">
                <h2 className="mb-2 font-sans text-xs font-semibold tracking-wide text-brand-orange uppercase">
                  Best Paper
                </h2>
                {data.papers_conference_best_paperTopapers ? (
                  <>
                    <p className="mb-1 text-lg text-[#1c1917] dark:text-gray-50">
                      {data.papers_conference_best_paperTopapers.paper_title}
                    </p>
                    {bestPresenterName && (
                      <p className="font-sans text-sm text-[#78716c] dark:text-gray-400">
                        {bestPresenterName.first_name} {bestPresenterName.last_name}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="font-sans text-sm text-[#a8a29e] dark:text-gray-500">Belum ditentukan.</p>
                )}
              </div>

              <div className="border border-[#ddd6c8] bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface">
                <h2 className="mb-2 font-sans text-xs font-semibold tracking-wide text-brand-orange uppercase">
                  Best Presenter
                </h2>
                {bestPresenterOnlyName ? (
                  <p className="text-lg text-[#1c1917] dark:text-gray-50">
                    {bestPresenterOnlyName.first_name} {bestPresenterOnlyName.last_name}
                  </p>
                ) : (
                  <p className="font-sans text-sm text-[#a8a29e] dark:text-gray-500">Belum ditentukan.</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
