import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { usePageTitle } from '../../hooks/usePageTitle'
import { MENU } from '../../config/menu'
import { PERMISSION_CATALOG, MODULE_LABEL } from '../../config/permissions'
import { toastSuccess, toastError } from '../../lib/toast'

interface RoleRow {
  id: string
  name: string
  is_system: boolean
}

interface PermissionEntry {
  module: string
  action: string
}

const permissionKey = (p: PermissionEntry) => `${p.module}:${p.action}`

export function RolePermissionsPage() {
  usePageTitle('Role & Permission')
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [newRoleName, setNewRoleName] = useState('')

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<RoleRow[]>('/roles')).data,
  })

  const { data: menuKeys } = useQuery({
    queryKey: ['role-menu-items', selectedRoleId],
    queryFn: async () => (await api.get<string[]>(`/roles/${selectedRoleId}/menu-items`)).data,
    enabled: !!selectedRoleId,
  })

  const createRole = useMutation({
    mutationFn: (name: string) => api.post('/roles', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toastSuccess('Role berhasil dibuat.')
      setNewRoleName('')
    },
    onError: (err) => toastError(err, 'Gagal membuat role.'),
  })

  const deleteRole = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toastSuccess('Role berhasil dihapus.')
      if (selectedRoleId) setSelectedRoleId('')
    },
    onError: (err) => toastError(err, 'Gagal menghapus role.'),
  })

  const saveMenuItems = useMutation({
    mutationFn: (keys: string[]) => api.put(`/roles/${selectedRoleId}/menu-items`, { menuKeys: keys }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role-menu-items', selectedRoleId] }),
    onError: (err) => toastError(err, 'Gagal menyimpan menu role.'),
  })

  const { data: permissions } = useQuery({
    queryKey: ['role-permissions', selectedRoleId],
    queryFn: async () => (await api.get<PermissionEntry[]>(`/roles/${selectedRoleId}/permissions`)).data,
    enabled: !!selectedRoleId,
  })

  const savePermissions = useMutation({
    mutationFn: (perms: PermissionEntry[]) => api.put(`/roles/${selectedRoleId}/permissions`, { permissions: perms }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRoleId] }),
    onError: (err) => toastError(err, 'Gagal menyimpan permission role.'),
  })

  const selectedRole = roles?.find((r) => r.id === selectedRoleId)
  const checked = new Set(menuKeys ?? [])
  const checkedPermissions = new Set((permissions ?? []).map(permissionKey))

  const toggle = (path: string) => {
    const next = new Set(checked)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    saveMenuItems.mutate([...next])
  }

  const togglePermission = (entry: PermissionEntry) => {
    const key = permissionKey(entry)
    const next = checkedPermissions.has(key)
      ? (permissions ?? []).filter((p) => permissionKey(p) !== key)
      : [...(permissions ?? []), entry]
    savePermissions.mutate(next)
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Role & Permission</h1>

      <div className="grid gap-6 md:grid-cols-[16rem_1fr_1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-brand-dark-surface">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (newRoleName.trim()) createRole.mutate(newRoleName.trim())
            }}
            className="mb-4 flex gap-2"
          >
            <input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Nama role baru"
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={createRole.isPending}
              className="rounded-md bg-brand-navy px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
            >
              +
            </button>
          </form>

          <ul className="flex flex-col gap-1">
            {roles?.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-left text-sm ${
                    r.id === selectedRoleId
                      ? 'bg-brand-navy/10 text-brand-navy dark:bg-brand-orange/10 dark:text-brand-orange'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                  }`}
                >
                  {r.name}
                  {r.is_system && <span className="ml-1 text-xs text-gray-400">(sistem)</span>}
                </button>
                {!r.is_system && (
                  <button
                    onClick={() => confirm(`Hapus role "${r.name}"?`) && deleteRole.mutate(r.id)}
                    className="px-1 text-xs text-red-500 hover:text-red-700"
                  >
                    Hapus
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
          {!selectedRole ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Pilih role di sebelah kiri.</p>
          ) : (
            <>
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Menu yang bisa diakses role "{selectedRole.name}"
              </h2>
              <div className="flex flex-col gap-3">
                {MENU.map((group) => (
                  <div key={group.group}>
                    <p className="mb-1 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">
                      {group.group}
                    </p>
                    <div className="flex flex-col gap-1">
                      {group.items.map((item) => (
                        <label key={item.path} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={checked.has(item.path)}
                            disabled={saveMenuItems.isPending}
                            onChange={() => toggle(item.path)}
                            className="h-4 w-4"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
          {!selectedRole ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Pilih role di sebelah kiri.</p>
          ) : (
            <>
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Aksi API yang boleh dilakukan role "{selectedRole.name}"
              </h2>
              <div className="flex flex-col gap-3">
                {Object.entries(PERMISSION_CATALOG).map(([module, actions]) => (
                  <div key={module}>
                    <p className="mb-1 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">
                      {MODULE_LABEL[module] ?? module}
                    </p>
                    <div className="flex flex-col gap-1">
                      {actions.map((action) => (
                        <label key={action} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={checkedPermissions.has(`${module}:${action}`)}
                            disabled={savePermissions.isPending}
                            onChange={() => togglePermission({ module, action })}
                            className="h-4 w-4"
                          />
                          {action}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
