import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '../types/role'

interface AuthUser {
  userId: string
  username: string
  firstName: string
  lastName: string
  email: string
  role: Role
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  // Sesi admin yang disimpan sementara selama "login sebagai" peserta —
  // null kalau lagi login biasa.
  impersonator: { token: string; user: AuthUser } | null
  setAuth: (token: string, user: AuthUser) => void
  startImpersonation: (token: string, user: AuthUser) => void
  stopImpersonation: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      impersonator: null,
      setAuth: (token, user) => set({ token, user, impersonator: null }),
      startImpersonation: (token, user) => {
        const { token: adminToken, user: adminUser } = get()
        if (!adminToken || !adminUser) return
        set({ token, user, impersonator: { token: adminToken, user: adminUser } })
      },
      stopImpersonation: () => {
        const imp = get().impersonator
        if (imp) set({ token: imp.token, user: imp.user, impersonator: null })
      },
      // Logout (atau token "login sebagai" yang kedaluwarsa → 401) saat
      // lagi login sebagai peserta = balik ke akun admin, bukan keluar total.
      logout: () => {
        if (get().impersonator) get().stopImpersonation()
        else set({ token: null, user: null, impersonator: null })
      },
    }),
    { name: 'newocs-auth' },
  ),
)
