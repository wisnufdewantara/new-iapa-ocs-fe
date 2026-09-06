import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAdminGateStore } from '../stores/adminGateStore'
import { api } from '../lib/axios'

// Password kedua khusus buat area /admin, HANYA berlaku buat role Admin
// (superuser). Role lain (Manager, Admin_Keuangan, dst) yang kebetulan
// juga punya akses ke sebagian halaman /admin (lihat config/menu.ts)
// nggak kena gate ini sama sekali.
export function AdminGate() {
  const role = useAuthStore((s) => s.user?.role)
  const verified = useAdminGateStore((s) => s.verified)
  const setVerified = useAdminGateStore((s) => s.setVerified)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (role !== 'Admin' || verified) {
    return <Outlet />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/verify-admin-gate', { password })
      setVerified(true)
    } catch {
      setError('Password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-brand-dark-surface"
      >
        <h1 className="mb-1 text-lg font-bold text-gray-800 dark:text-gray-100">Area Admin</h1>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Masukkan password khusus superuser untuk melanjutkan.
        </p>
        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          placeholder="Password admin gate"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-navy py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
        >
          {loading ? 'Memeriksa...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}
