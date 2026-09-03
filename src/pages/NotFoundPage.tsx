import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-gray-50">
      <p className="text-2xl font-bold text-gray-800">404</p>
      <p className="text-sm text-gray-500">Halaman tidak ditemukan.</p>
      <Link to="/" className="mt-4 text-sm font-medium text-blue-700 hover:underline">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
