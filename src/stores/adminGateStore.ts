import { create } from 'zustand'

// Sengaja TIDAK di-persist ke localStorage — gate ini harus diverifikasi
// ulang tiap sesi baru (reload/buka tab baru), beda dari token login
// biasa yang persisten. Itu poinnya sebagai "password kedua".
interface AdminGateState {
  verified: boolean
  setVerified: (v: boolean) => void
}

export const useAdminGateStore = create<AdminGateState>((set) => ({
  verified: false,
  setVerified: (v) => set({ verified: v }),
}))
