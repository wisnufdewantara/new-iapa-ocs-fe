import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'
import { useAuthStore } from '../stores/authStore'
import markMask from '../assets/iapa-mark-mask.png'

// Watermark peta+huruf IAPA di belakang konten. Pakai mask-image (siluet
// hitam iapa-mark-mask.png) + background-color, bukan <img> logo — jadi
// warnanya bisa diatur per tema (navy 5% di terang, putih 3% di gelap)
// tanpa nyiapin dua file gambar.
const WATERMARK_MASK = {
  maskImage: `url(${markMask})`,
  WebkitMaskImage: `url(${markMask})`,
  maskSize: 'contain',
  WebkitMaskSize: 'contain',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: 'right bottom',
  WebkitMaskPosition: 'right bottom',
} as const

export function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const impersonator = useAuthStore((s) => s.impersonator)
  const stopImpersonation = useAuthStore((s) => s.stopImpersonation)

  // Reload penuh biar cache data (react-query) peserta nggak kebawa ke
  // sesi admin.
  const backToAdmin = () => {
    stopImpersonation()
    window.location.assign('/admin/roles')
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-iapa-page dark:bg-brand-dark">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {/* Backdrop, cuma muncul di mobile pas sidebar dibuka */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {impersonator && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-orange px-4 py-2 text-sm text-white sm:px-6">
            <span>
              Kamu sedang login sebagai{' '}
              <strong>
                {user?.firstName} {user?.lastName}
              </strong>{' '}
              (dibuka oleh {impersonator.user.firstName} {impersonator.user.lastName})
            </span>
            <button
              onClick={backToAdmin}
              className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-brand-orange-dark hover:bg-orange-50"
            >
              Kembali ke akun admin
            </button>
          </div>
        )}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-brand-dark-surface sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="btn btn-ghost md:hidden"
              aria-label="Buka menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link
              to="/"
              className="hidden shrink-0 text-sm font-medium text-gray-500 hover:text-brand-navy dark:text-gray-400 dark:hover:text-brand-orange sm:inline"
            >
              ← Beranda
            </Link>
            <span className="truncate text-sm text-gray-500 dark:text-gray-400">
              {user?.firstName} {user?.lastName} ·{' '}
              <span className="font-medium text-gray-700 dark:text-gray-200">{user?.role}</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggle />
            <button onClick={impersonator ? backToAdmin : logout} className="btn btn-danger-ghost btn-sm">
              {impersonator ? 'Keluar' : 'Logout'}
            </button>
          </div>
        </header>
        {/* isolate = stacking context sendiri, jadi watermark (-z-10) duduk
            di atas latar halaman tapi DI BAWAH kartu-kartu konten, dan
            pointer-events-none biar nggak pernah nyolong klik. Fixed di
            pojok kanan bawah viewport; lebarnya ~60% area konten (di md+
            dikurangi lebar sidebar 16rem), jadi nggak bikin scroll samping. */}
        <main className="relative isolate min-w-0 flex-1 p-4 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed right-4 bottom-4 -z-10 aspect-[824/293] w-[60vw] bg-iapa-navy/5 md:right-8 md:bottom-8 md:w-[calc((100vw-16rem)*0.6)] dark:bg-white/[0.03]"
            style={WATERMARK_MASK}
          />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
