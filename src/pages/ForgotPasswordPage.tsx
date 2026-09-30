import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastError } from '../lib/toast'
import logo from '../assets/logo-iapa.png'

export function ForgotPasswordPage() {
  usePageTitle('Lupa Password')
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { usernameOrEmail })
      // Respons backend SENGAJA selalu generik (nggak bocorin akun ada
      // atau nggak) — FE ikutin, selalu tampilin pesan sukses yang sama.
      setSent(true)
    } catch (err) {
      toastError(err, 'Gagal mengirim link reset password. Coba lagi.')
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
          <h1 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">Lupa Password</h1>

          {sent ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Kalau username/email itu terdaftar, link buat atur ulang password sudah dikirim ke email yang
              bersangkutan. Cek inbox (atau folder spam), link berlaku 1 jam.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Masukkan username atau email akun kamu — nanti dikirim link buat atur ulang password.
              </p>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Username / Email</label>
              <input
                className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Ingat password kamu?{' '}
            <Link to="/login" className="font-semibold text-brand-navy dark:text-brand-orange">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
