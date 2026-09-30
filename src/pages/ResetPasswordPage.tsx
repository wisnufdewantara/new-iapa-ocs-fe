import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'
import logo from '../assets/logo-iapa.png'

export function ResetPasswordPage() {
  usePageTitle('Atur Ulang Password')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toastError(null, 'Konfirmasi password tidak cocok.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, newPassword })
      toastSuccess('Password berhasil diatur ulang. Silakan login dengan password baru.')
      navigate('/login')
    } catch (err) {
      toastError(err, 'Link reset password tidak valid atau sudah kedaluwarsa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-brand-dark">
      <header className="flex items-center justify-between p-4">
        <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-brand-navy dark:text-gray-400 dark:hover:text-brand-orange">
          ← Kembali ke Login
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-brand-dark-surface sm:p-8">
          <Link to="/" className="mb-6 inline-block">
            <img src={logo} alt="IAPA" className="h-9 w-auto" />
          </Link>
          <h1 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">Atur Ulang Password</h1>

          {!token ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              Link nggak valid — nggak ada token reset. Minta link baru lewat halaman{' '}
              <Link to="/forgot-password" className="font-semibold underline">
                Lupa Password
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password Baru</label>
              <input
                type="password"
                className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Password Baru</label>
              <input
                type="password"
                className="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
