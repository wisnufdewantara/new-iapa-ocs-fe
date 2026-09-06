import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '../lib/axios'
import { DataTable } from '../components/DataTable'
import { usePageTitle } from '../hooks/usePageTitle'

const ROLES = ['Admin', 'Peserta', 'Reviewer', 'Admin_Keuangan', 'Manager', 'Moderator'] as const

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

export function UserManagementPage() {
  usePageTitle('Kelola Role')
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<UserRow[]>('/users')).data,
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setError('')
    },
    onError: () => setError('Gagal mengubah role user.'),
  })

  const columns = useMemo<ColumnDef<UserRow, any>[]>(
    () => [
      { accessorKey: 'username', header: 'Username' },
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
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ),
      },
    ],
    [updateRoleMutation],
  )

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Kelola Role</h1>
      {error && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
      ) : (
        <DataTable columns={columns} data={users ?? []} searchPlaceholder="Cari username/nama/email..." />
      )}
    </div>
  )
}
