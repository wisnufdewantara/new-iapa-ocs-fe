import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
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

export function UserManagementPage() {
  usePageTitle('Kelola Role')
  const queryClient = useQueryClient()

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
            {roles?.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        ),
      },
    ],
    [updateRoleMutation, roles],
  )

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Kelola Role</h1>
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
      ) : (
        <DataTable columns={columns} data={users ?? []} searchPlaceholder="Cari username/nama/email..." />
      )}
    </div>
  )
}
