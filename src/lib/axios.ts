import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Endpoint yang 401-nya BUKAN berarti sesi login habis — misal
// verify-admin-gate sengaja balikin 401 kalau password gate-nya salah,
// itu error input biasa, bukan token JWT invalid. Jangan auto-logout
// buat endpoint-endpoint ini.
const SKIP_AUTO_LOGOUT_PATHS = ['/auth/verify-admin-gate', '/auth/login']

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? ''
    const skip = SKIP_AUTO_LOGOUT_PATHS.some((p) => url.includes(p))
    if (err.response?.status === 401 && !skip) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  },
)
