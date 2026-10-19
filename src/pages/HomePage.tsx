import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { ThemeToggle } from '../components/ThemeToggle'
import { PosterCarousel } from '../components/PosterCarousel'
import { CONFERENCE_STATUS_LABEL, type ConferenceStatus } from '../config/conferenceStatus'
import { usePageTitle } from '../hooks/usePageTitle'
import { useActiveConferences } from '../hooks/useActiveConferences'
import logo from '../assets/logo-iapa.png'

interface Conference {
  conference_id: string
  conference_name: string
  conference_date: string
  conference_end_date: string | null
  status: ConferenceStatus
  description: string | null
  conference_posters: { id: string; image_url: string }[]
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null

// Homepage dirancang ramah pengguna senior (banyak peserta akademisi
// senior): huruf besar, kontras tinggi (semua pasangan warna >= 4.5:1),
// tombol besar (>= 56px) dengan label jelas, satu kolom informasi yang
// gampang dipindai — tanggal, deskripsi, lalu dua aksi utama.
// Banner status: "Sedang Berlangsung" hijau (permintaan user), lainnya
// tetap pakai warna masing-masing.
const STATUS_BANNER: Record<ConferenceStatus, string> = {
  ongoing: 'bg-[#166534] text-white',
  coming_soon: 'bg-brand-orange text-[#0D2247]',
  ended: 'bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-gray-200',
}

const SECRETARIAT = {
  whatsappLabel: '+62 811-3552-686',
  whatsappUrl: 'https://wa.me/628113552686',
  email: 'sekretariat@iapa.or.id',
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 shrink-0" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function ConferenceBlock({ conference }: { conference: Conference }) {
  // Kalau udah login, CTA langsung ke aksinya (Join / Submit Paper),
  // bukan nyuruh registrasi/login ulang.
  const user = useAuthStore((s) => s.user)
  const dateRange = conference.conference_end_date
    ? `${fmt(conference.conference_date)} – ${fmt(conference.conference_end_date)}`
    : fmt(conference.conference_date)

  return (
    <section className="py-8 sm:py-10" aria-labelledby={`conf-${conference.conference_id}`}>
      <div
        className={`mb-8 flex items-center justify-center gap-3 rounded-xl px-5 py-4 text-center text-xl font-bold tracking-wide uppercase sm:text-2xl ${STATUS_BANNER[conference.status]}`}
        role="status"
      >
        {conference.status === 'ongoing' && (
          <span className="relative flex h-3.5 w-3.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 motion-reduce:animate-none" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-white" />
          </span>
        )}
        {conference.status === 'ongoing' ? 'Konferensi Sedang Berlangsung' : CONFERENCE_STATUS_LABEL[conference.status]}
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-14">
        <div className="flex flex-col gap-6">
          <p className="text-base font-bold tracking-[0.12em] text-[#0B3066] uppercase dark:text-brand-orange">
            Konferensi Tahunan
          </p>
          <h1
            id={`conf-${conference.conference_id}`}
            className="text-4xl leading-tight font-bold text-[#0B3066] sm:text-5xl dark:text-white"
          >
            {conference.conference_name}
          </h1>
          {dateRange && (
            <p className="flex items-center gap-3 text-xl font-semibold text-gray-800 dark:text-gray-100">
              <span className="text-brand-orange-dark">
                <CalendarIcon />
              </span>
              {dateRange}
            </p>
          )}
          {conference.description && (
            <p className="max-w-[65ch] text-lg leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300">
              {conference.description}
            </p>
          )}
          <div className="mt-2 flex flex-col gap-4 sm:flex-row">
            <Link
              to={user ? '/join' : '/register'}
              className="inline-flex min-h-14 items-center justify-center rounded-lg bg-brand-orange px-7 text-lg font-bold text-[#0D2247] shadow-sm transition-colors hover:bg-brand-orange-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0B3066] dark:focus-visible:outline-white"
            >
              Daftar Sebagai Peserta
            </Link>
            <Link
              to={user ? '/papers/submit' : '/login'}
              className="inline-flex min-h-14 items-center justify-center rounded-lg bg-[#0B3066] px-7 text-lg font-bold text-white shadow-sm transition-colors hover:bg-[#0D2247] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-orange dark:bg-[#1d4ed8] dark:hover:bg-[#1e40af]"
            >
              Submit Paper
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-xl shadow-md">
          <PosterCarousel posters={conference.conference_posters} />
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  usePageTitle()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  // /active = SEMUA conference yang statusnya belum "ended", yang
  // "ongoing" duluan (diurutkan backend). Tiap conference aktif dapat
  // blok lengkap yang sama (banner status, deskripsi, poster, tombol).
  const { data: activeConferences, isLoading } = useActiveConferences<Conference>()

  const navLink =
    'rounded-md px-3 py-2 text-base font-semibold text-[#0B3066] hover:bg-[#0B3066]/5 focus-visible:outline-2 focus-visible:outline-[#0B3066] dark:text-gray-100 dark:hover:bg-white/10'

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-gray-900 transition-colors duration-300 dark:bg-brand-dark dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white dark:border-white/10 dark:bg-brand-dark-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link to="/" aria-label="Beranda IAPA">
            <img src={logo} alt="IAPA — Indonesian Association for Public Administration" className="h-12 w-auto rounded-md sm:h-14 dark:bg-white dark:p-1" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            <a href="https://iapa.or.id" target="_blank" rel="noreferrer" className={navLink}>
              Tentang IAPA
            </a>
            <a href="#kontak" className={navLink}>
              Kontak
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle className="text-gray-700 dark:text-gray-200" />
            {user ? (
              <>
                <span className="hidden text-base text-gray-700 lg:inline dark:text-gray-300">
                  Hai, <span className="font-semibold text-gray-900 dark:text-gray-100">{user.firstName}</span>
                </span>
                <Link
                  to="/dashboard"
                  className="inline-flex min-h-11 items-center rounded-lg bg-[#0B3066] px-4 text-base font-semibold text-white hover:bg-[#0D2247] dark:bg-[#1d4ed8] dark:hover:bg-[#1e40af]"
                >
                  Ke Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex min-h-11 items-center rounded-lg border-2 border-[#0B3066] px-4 text-base font-semibold text-[#0B3066] hover:bg-[#0B3066]/5 dark:border-gray-300 dark:text-gray-100 dark:hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center rounded-lg bg-[#0B3066] px-5 text-base font-semibold text-white hover:bg-[#0D2247] dark:bg-[#1d4ed8] dark:hover:bg-[#1e40af]"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 divide-y divide-gray-200 px-4 sm:px-8 dark:divide-white/10">
        {isLoading && <p className="py-16 text-center text-lg text-gray-600 dark:text-gray-400">Memuat informasi konferensi...</p>}

        {!isLoading && (!activeConferences || activeConferences.length === 0) && (
          <p className="py-16 text-center text-xl text-gray-800 dark:text-gray-100">Belum ada event yang sedang berjalan</p>
        )}

        {activeConferences?.map((conference) => (
          <ConferenceBlock key={conference.conference_id} conference={conference} />
        ))}
      </main>

      <div className="flex justify-center px-4 py-8">
        <Link
          to="/event-history"
          className="inline-flex min-h-14 items-center rounded-lg border-2 border-[#0B3066] bg-white px-7 text-lg font-semibold text-[#0B3066] hover:bg-[#0B3066]/5 dark:border-gray-300 dark:bg-transparent dark:text-gray-100 dark:hover:bg-white/10"
        >
          Lihat Event Sebelumnya
        </Link>
      </div>

      <footer id="kontak" className="bg-[#0B3066] text-white dark:bg-[#0A1A33]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-lg font-bold">Butuh bantuan?</p>
            <p className="mt-1 text-base text-white/85">Hubungi Sekretariat IAPA — kami siap membantu pendaftaran dan pembayaran.</p>
          </div>
          <ul className="flex flex-col gap-3 text-base">
            <li>
              <a href={SECRETARIAT.whatsappUrl} target="_blank" rel="noreferrer" className="font-semibold underline-offset-4 hover:underline">
                WhatsApp: {SECRETARIAT.whatsappLabel}
              </a>
            </li>
            <li>
              <a href={`mailto:${SECRETARIAT.email}`} className="font-semibold underline-offset-4 hover:underline">
                Email: {SECRETARIAT.email}
              </a>
            </li>
            <li>
              <Link to="/terms" className="underline-offset-4 hover:underline">
                Syarat dan Ketentuan
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
