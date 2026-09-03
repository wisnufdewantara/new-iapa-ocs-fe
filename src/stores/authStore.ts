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
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'newocs-auth' },
  ),
)
