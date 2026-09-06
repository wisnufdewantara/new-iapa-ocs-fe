import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('404')
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-brand-dark">
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">404</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">Halaman tidak ditemukan.</p>
      <Link
        to="/"
        className="mt-4 text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}
