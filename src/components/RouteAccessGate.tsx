import { Outlet, useLocation } from 'react-router-dom'
import { useMenu } from '../hooks/useMenu'
import { AccessRestrictedPage } from '../pages/AccessRestrictedPage'

// Menu (role_menu_items) sebelumnya cuma dipakai buat nyembunyiin item
// di Sidebar — kalau user ketik URL-nya langsung, halamannya tetap
// ke-render (datanya aman karena backend tetap nolak API-nya, tapi
// shell halamannya sendiri kelihatan, membingungkan). Ini nutup itu:
// render AccessRestrictedPage kalau path sekarang nggak ada di menu
// role user, SEBELUM halaman aslinya sempat di-render.
//
// 2 path dinamis butuh mapping manual ke "menu induknya" karena nggak
// match langsung ke daftar dari /menu/mine (lihat router.tsx):
//   /payment/manage/:paymentId -> udah ke-cover otomatis (startsWith)
//   /admin/users/:id           -> induknya /admin/roles, beda string
function isPathAllowed(pathname: string, allowedPaths: string[]): boolean {
  if (allowedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true
  if (pathname.startsWith('/admin/users/') && allowedPaths.includes('/admin/roles')) return true
  return false
}

export function RouteAccessGate() {
  const location = useLocation()
  const { data: menu, isLoading, isError } = useMenu()

  // Query lagi loading atau gagal (mis. sesi baru login) — jangan
  // langsung nge-block, biar gak flash "Akses Dibatasi" palsu.
  if (isLoading || isError || !menu) return <Outlet />

  if (!isPathAllowed(location.pathname, menu)) {
    return <AccessRestrictedPage />
  }

  return <Outlet />
}
