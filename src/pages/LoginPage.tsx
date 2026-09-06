import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/axios'
import { useAuthStore } from '../stores/authStore'
import { ThemeToggle } from '../components/ThemeToggle'
import { usePageTitle } from '../hooks/usePageTitle'
import logo from '../assets/logo-iapa.png'

export function LoginPage() {
  usePageTitle('Login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      setAuth(data.accessToken, data.user)
      navigate('/dashboard')
    } catch {
      setError('Username/email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-brand-dark">
      <header className="flex items-center justify-between p-4">
        <Link to="/" className="text-sm font-medium text-gray-500 hover:text-brand-navy dark:text-gray-400 dark:hover:text-brand-orange">
          ← Beranda
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-brand-dark-surface sm:p-8"
        >
          <Link to="/" className="mb-6 inline-block">
            <img src={logo} alt="IAPA" className="h-9 w-auto" />
          </Link>
          {error && (
            <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Username / Email</label>
          <input
            className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input
            type="password"
            className="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-navy py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-brand-navy dark:text-brand-orange">
              Daftar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
