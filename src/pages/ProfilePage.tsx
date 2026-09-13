import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { useAuthStore } from '../stores/authStore'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'

interface Profile {
  firstName: string
  lastName: string
  email: string
  gender: 'Male' | 'Female'
  affiliation: string
  phone: string
  country: string
}

const onlyNumbers = (v: string) => v.replace(/\D/g, '')

export function ProfilePage() {
  usePageTitle('Profil Saya')
  const queryClient = useQueryClient()
  const username = useAuthStore((s) => s.user?.username)
  const role = useAuthStore((s) => s.user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await api.get<Profile>('/auth/me')).data,
  })

  const [form, setForm] = useState<Profile | null>(null)
  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (body: Partial<Profile>) => api.patch('/auth/me', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toastSuccess('Profil berhasil diubah.')
    },
    onError: (err) => toastError(err, 'Gagal menyimpan profil.'),
  })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const passwordMutation = useMutation({
    mutationFn: () => api.patch('/auth/me/password', { currentPassword, newPassword }),
    onSuccess: () => {
      toastSuccess('Password berhasil diubah.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err) => toastError(err, 'Gagal mengubah password.'),
  })

  if (isLoading || !form) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  }

  const inputClass =
    'w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Profil Saya</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Info Akun</h2>
        <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-300">
          <p>
            Username: <span className="font-medium text-gray-800 dark:text-gray-100">{username}</span>
          </p>
          <p>
            Email: <span className="font-medium text-gray-800 dark:text-gray-100">{form.email}</span>
          </p>
          <p>
            Role: <span className="font-medium text-gray-800 dark:text-gray-100">{role}</span>
          </p>
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Username, email, dan role tidak bisa diubah sendiri — hubungi Admin kalau perlu diganti.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          saveMutation.mutate(form)
        }}
        className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface"
      >
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Data Diri</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Depan</label>
            <input
              className={inputClass}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Belakang</label>
            <input
              className={inputClass}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
            <select
              className={inputClass}
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as 'Male' | 'Female' })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Afiliasi</label>
            <input
              className={inputClass}
              value={form.affiliation}
              onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">No. Telepon</label>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: onlyNumbers(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Negara</label>
            <input
              className={inputClass}
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="mt-4 rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
        >
          {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (newPassword !== confirmPassword) {
            toastError(null, 'Konfirmasi password baru tidak cocok.')
            return
          }
          passwordMutation.mutate()
        }}
        className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface"
      >
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Ganti Password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password Saat Ini</label>
            <input
              type="password"
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password Baru</label>
            <input
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Password Baru</label>
            <input
              type="password"
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={passwordMutation.isPending}
          className="mt-4 rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
        >
          {passwordMutation.isPending ? 'Menyimpan...' : 'Ganti Password'}
        </button>
      </form>
    </div>
  )
}
