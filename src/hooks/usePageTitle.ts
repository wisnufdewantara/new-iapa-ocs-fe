import { useEffect } from 'react'

const APP_NAME = 'Open Conference System - IAPA'

// Dipanggil di tiap halaman biar tab browser nunjukin nama halaman +
// nama aplikasi, bukan cuma judul statis dari index.html.
export function usePageTitle(pageName?: string) {
  useEffect(() => {
    document.title = pageName ? `${pageName} — ${APP_NAME}` : APP_NAME
  }, [pageName])
}
