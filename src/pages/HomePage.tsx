import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { ThemeToggle } from '../components/ThemeToggle'
import { PosterCarousel } from '../components/PosterCarousel'
import { CONFERENCE_STATUS_BADGE_CLASS, CONFERENCE_STATUS_LABEL, type ConferenceStatus } from '../config/conferenceStatus'
import { usePageTitle } from '../hooks/usePageTitle'
import { useActiveConferences } from '../hooks/useActiveConferences'
import logo from '../assets/logo-iapa.png'

interface Conference {
  conference_id: string
  conference_name: string
  conference_date: string
  conference_end_date: string | null
  status: ConferenceStatus
  conference_posters: { id: string; image_url: string }[]
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null

function ConferenceBlock({ conference, delay }: { conference: Conference; delay: number }) {
  const dateRange = conference.conference_end_date
    ? `${fmt(conference.conference_date)} – ${fmt(conference.conference_end_date)}`
    : fmt(conference.conference_date)

  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:py-16 lg:flex-row lg:gap-20">
      <div className="flex max-w-xl flex-col gap-5">
        <div className="animate-fade-slide-up font-sans text-xs font-semibold tracking-[0.14em] text-brand-navy uppercase dark:text-brand-orange">
          Konferensi Tahunan
        </div>
        <h1
          className="animate-fade-slide-up text-4xl leading-tight font-normal text-[#1c1917] dark:text-gray-50 sm:text-5xl"
          style={{ animationDelay: `${delay + 80}ms` }}
        >
          {conference.conference_name}
        </h1>
        {dateRange && (
          <p
            className="animate-fade-slide-up font-sans text-base text-[#57534e] dark:text-gray-400"
            style={{ animationDelay: `${delay + 140}ms` }}
          >
            {dateRange}
          </p>
        )}
        <div className="animate-fade-slide-up mt-3 flex flex-wrap gap-3" style={{ animationDelay: `${delay + 200}ms` }}>
          <Link
            to="/register"
            className="rounded-sm bg-brand-orange px-7 py-3.5 text-center font-sans text-sm font-semibold text-white hover:bg-brand-orange-dark"
          >
            Daftar Sebagai Peserta
          </Link>
          <Link
            to="/login"
            className="rounded-sm border border-[#1c1917] px-7 py-3.5 text-center font-sans text-sm font-semibold text-[#1c1917] hover:bg-[#1c1917] hover:text-white dark:border-gray-300 dark:text-gray-100 dark:hover:bg-white dark:hover:text-brand-dark"
          >
            Submit Paper
          </Link>
        </div>
      </div>

      <div
        className="animate-fade-slide-up flex w-full max-w-[380px] flex-col items-center gap-3"
        style={{ animationDelay: `${delay + 120}ms` }}
      >
        <span
          className={`w-full rounded-sm border px-4 py-2 text-center font-sans text-xs font-semibold tracking-wide ${CONFERENCE_STATUS_BADGE_CLASS[conference.status]}`}
        >
          {CONFERENCE_STATUS_LABEL[conference.status]}
        </span>
        <PosterCarousel posters={conference.conference_posters} />
      </div>
    </div>
  )
}

export function HomePage() {
  usePageTitle()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  // /active = SEMUA conference yang statusnya belum "ended" (diatur manual
  // admin di /conferences), bukan cuma satu — bisa ada coming_soon DAN
  // ongoing bareng, urutannya sudah diprioritaskan backend (ongoing
  // duluan). Dulu cuma yang pertama dapat tampilan lengkap (hero) dan
  // sisanya jadi baris teks kecil tanpa tombol daftar — sekarang SEMUA
  // conference aktif dapat blok yang sama persis (poster, tanggal,
  // status, tombol daftar), disusun berurutan sesuai prioritas.
  const { data: activeConferences, isLoading } = useActiveConferences<Conference>()

  return (
    <div
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      className="flex min-h-screen flex-col bg-[#f6f3ee] transition-colors duration-300 dark:bg-brand-dark"
    >
      <header className="flex items-center justify-between border-b border-[#ddd6c8] px-6 py-6 dark:border-white/10 sm:px-16">
        <Link to="/">
          <img src={logo} alt="IAPA" className="h-10 w-auto sm:h-12" />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle className="text-[#1c1917] dark:text-gray-200" />
          {user ? (
            <div className="flex items-center gap-4 font-sans text-sm">
              <span className="hidden text-[#57534e] sm:inline dark:text-gray-400">
                Hai, <span className="font-semibold text-[#1c1917] dark:text-gray-100">{user.firstName}</span>
              </span>
              <Link
                to="/dashboard"
                className="font-semibold text-brand-navy hover:text-brand-navy-dark dark:text-brand-orange dark:hover:text-brand-orange-dark"
              >
                Ke Dashboard
              </Link>
              <button
                onClick={logout}
                className="font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="font-sans text-sm font-semibold text-[#1c1917] hover:text-brand-navy dark:text-gray-200 dark:hover:text-brand-orange"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 divide-y divide-[#ddd6c8] px-6 sm:px-16 dark:divide-white/10">
        {isLoading && (
          <p className="py-16 text-center font-sans text-sm text-[#78716c] dark:text-gray-400">
            Memuat informasi konferensi...
          </p>
        )}

        {!isLoading && (!activeConferences || activeConferences.length === 0) && (
          <p className="py-16 text-center font-sans text-lg text-[#1c1917] dark:text-gray-100">
            Belum ada event yang sedang berjalan
          </p>
        )}

        {activeConferences?.map((conference, i) => (
          <ConferenceBlock key={conference.conference_id} conference={conference} delay={i * 60} />
        ))}
      </main>

      <footer className="flex justify-center border-t border-[#ddd6c8] px-6 py-8 dark:border-white/10 sm:px-16">
        <Link
          to="/event-history"
          className="rounded-sm border border-brand-navy px-6 py-3 font-sans text-sm font-semibold text-brand-navy hover:bg-brand-navy hover:text-white dark:border-brand-orange dark:text-brand-orange dark:hover:bg-brand-orange dark:hover:text-brand-dark"
        >
          Lihat Event Sebelumnya
        </Link>
      </footer>
    </div>
  )
}
