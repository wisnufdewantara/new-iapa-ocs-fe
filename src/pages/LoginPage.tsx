import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/axios'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
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
      navigate('/')
    } catch {
      setError('Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-blue-700">newocs — Login</h1>
        {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
        <input
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          className="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-700 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
