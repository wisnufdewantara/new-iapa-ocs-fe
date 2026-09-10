import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { useAuthStore } from '../stores/authStore'

// Menu yang boleh diakses role user yang lagi login, sumbernya
// role_menu_items di database (lihat RolesModule backend) — bukan lagi
// filter statis roles: Role[] di config/menu.ts.
export function useMenu() {
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: ['menu-mine', role],
    queryFn: async () => (await api.get<string[]>('/menu/mine')).data,
    enabled: !!role,
  })
}
