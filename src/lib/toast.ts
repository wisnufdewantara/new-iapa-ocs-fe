import { toast } from 'sonner'
import { isAxiosError } from 'axios'

// Satu titik ekstraksi pesan error dari response axios, dipakai semua
// onError mutation — backend selalu balikin { message: string | string[] }
// (lihat ValidationPipe NestJS), sebelumnya tiap halaman ngulang pola
// `e.response?.data?.message ?? fallback` sendiri-sendiri.
export function errorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (typeof msg === 'string') return msg
  }
  return fallback
}

export function toastSuccess(message: string) {
  toast.success(message)
}

export function toastError(err: unknown, fallback: string) {
  toast.error(errorMessage(err, fallback))
}
