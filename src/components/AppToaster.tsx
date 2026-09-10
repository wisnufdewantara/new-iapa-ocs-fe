import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'

// Toast global buat semua notifikasi sukses/gagal di aplikasi (lihat
// lib/toast.ts). Baca class 'dark' di <html> (diset oleh useTheme.ts)
// biar tema toast ikut tema aplikasi, bukan cuma prefers-color-scheme.
export function AppToaster() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return <Toaster theme={isDark ? 'dark' : 'light'} position="top-right" richColors closeButton />
}
