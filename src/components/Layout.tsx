import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'
import { useAuthStore } from '../stores/authStore'

export function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-brand-dark">
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
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-brand-dark-surface sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 md:hidden"
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
            <button
              onClick={logout}
              className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
