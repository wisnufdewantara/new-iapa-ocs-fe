import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { api } from '../lib/axios'
import { DataTable } from '../components/DataTable'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'

interface RoleRow {
  id: string
  name: string
}

interface UserRow {
  userId: string
  username: string
  firstName: string
  lastName: string
  email: string
  role: string
  affiliation: string
  createdAt: string | null
}

interface NewUserForm {
  username: string
  firstName: string
  lastName: string
  password: string
  gender: 'Male' | 'Female'
  affiliation: string
  email: string
  phone: string
  country: string
  role: string
}

const EMPTY_FORM: NewUserForm = {
  username: '',
  firstName: '',
  lastName: '',
  password: '',
  gender: 'Male',
  affiliation: '',
  email: '',
  phone: '',
  country: '',
  role: 'Peserta',
}

const onlyNumbers = (v: string) => v.replace(/\D/g, '')

export function UserManagementPage() {
  usePageTitle('Kelola Role')
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<UserRow[]>('/users')).data,
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<RoleRow[]>('/roles')).data,
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toastSuccess('Role user berhasil diubah.')
    },
    onError: (err) => toastError(err, 'Gagal mengubah role user.'),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/users', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toastSuccess('User baru berhasil dibuat.')
      setForm(EMPTY_FORM)
      setShowForm(false)
    },
    onError: (err) => toastError(err, 'Gagal membuat user.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toastSuccess('User berhasil dihapus.')
    },
    onError: (err) => toastError(err, 'Gagal menghapus user.'),
  })

  const confirmDelete = (u: UserRow) => {
    const ok = confirm(
      `Hapus user "${u.username}"?\n\nPaper, pembayaran, dan data kehadiran milik user ini AKAN IKUT TERHAPUS. Aksi ini tidak bisa dibatalkan.`,
    )
    if (ok) deleteMutation.mutate(u.userId)
  }

  const columns = useMemo<ColumnDef<UserRow, any>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => (
          <Link to={`/admin/users/${row.original.userId}`} className="font-medium text-brand-navy hover:underline dark:text-brand-orange">
            {row.original.username}
          </Link>
        ),
      },
      {
        id: 'name',
        header: 'Nama',
        accessorFn: (u) => `${u.firstName} ${u.lastName}`,
      },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'affiliation', header: 'Afiliasi', cell: (c) => c.getValue() ?? '-' },
      {
        id: 'role',
        header: 'Role',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <select
            className="rounded-md border border-gray-300 px-2 py-1 text-xs"
            value={row.original.role}
            disabled={updateRoleMutation.isPending}
            onChange={(e) =>
              updateRoleMutation.mutate({ userId: row.original.userId, role: e.target.value })
            }
          >
            {roles?.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <button
            onClick={() => confirmDelete(row.original)}
            disabled={deleteMutation.isPending}
            className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
          >
            Hapus
          </button>
        ),
      },
    ],
    [updateRoleMutation, deleteMutation, roles],
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Kelola Role</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
        >
          {showForm ? 'Batal' : '+ Buat User'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate()
          }}
          className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Username">
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className={fieldClass} />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
                className={fieldClass}
              />
            </Field>
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={fieldClass}>
                {roles?.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nama Depan">
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className={fieldClass} />
            </Field>
            <Field label="Nama Belakang">
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className={fieldClass} />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'Male' | 'Female' })} className={fieldClass}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={fieldClass} />
            </Field>
            <Field label="No. Telepon">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: onlyNumbers(e.target.value) })} required className={fieldClass} />
            </Field>
            <Field label="Afiliasi">
              <input value={form.affiliation} onChange={(e) => setForm({ ...form, affiliation: e.target.value })} required className={fieldClass} />
            </Field>
            <Field label="Negara">
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required className={fieldClass} />
            </Field>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="mt-4 rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
          >
            {createMutation.isPending ? 'Menyimpan...' : 'Buat User'}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
      ) : (
        <DataTable columns={columns} data={users ?? []} searchPlaceholder="Cari username/nama/email..." />
      )}
    </div>
  )
}

const fieldClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  )
}
