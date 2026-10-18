import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { MENU } from '../config/menu'
import { useMenu } from '../hooks/useMenu'
import { APP_VERSION } from '../version'
import { MenuIcon } from '../config/menuIcons'
import logo from '../assets/logo-iapa.png'

// Grup yang dilipat user, disimpan per browser. Dibungkus try/catch
// karena localStorage bisa nolak (mode privat / storage diblokir) — kalau
// gagal ya semua grup kebuka, sidebar tetap jalan.
const COLLAPSED_KEY = 'newocs-sidebar-collapsed'

function readCollapsed(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((g): g is string => typeof g === 'string') : [])
  } catch {
    return new Set()
  }
}

function writeCollapsed(groups: Set<string>) {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...groups]))
  } catch {
    // abaikan — cuma preferensi tampilan
  }
}

// Sama dengan aturan RouteAccessGate: /payment/manage/123 tetap "milik"
// item /payment/manage. Ambil yang paling panjang biar /payment nggak
// ngerebut /payment/manage.
function matchesPath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

interface SidebarProps {
  open: boolean
  onNavigate: () => void
}

// Satu komponen sidebar dinamis buat semua role, ganti 6 versi
// hardcoded (VSidebar.vue) di ocs2. Di layar kecil jadi drawer
// yang bisa ditutup/dibuka (dikontrol dari Layout), di layar
// md ke atas selalu tampil sebagai kolom statis.
//
// Visibilitas menu sekarang dari role_menu_items di database (lewat
// useMenu), bukan lagi filter statis roles: Role[] di menu.ts — itemnya
// (label/path/grup) tetap dari MENU, cuma yang nge-filter beda.
//
// Tampilan (rilis 1.0): latar navy IAPA (dark: setingkat lebih gelap dari
// halaman), tiap item ada ikon, item aktif = pil oranye dengan teks navy
// tebal — teks putih di atas oranye nggak lolos kontras, navy-deep 6.4:1.
export function Sidebar({ open, onNavigate }: SidebarProps) {
  const role = useAuthStore((s) => s.user?.role)
  const { data: allowedPaths } = useMenu()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  if (!role) return null
  const allowed = new Set(allowedPaths ?? [])
  const groups = MENU.map((group) => ({
    ...group,
    items: group.items.filter((item) => allowed.has(item.path)),
  })).filter((group) => group.items.length > 0)

  // Satu-satunya item aktif = path terpanjang yang cocok. NavLink sendiri
  // nganggap /payment aktif juga di /payment/manage, jadi Admin dapet dua
  // pil oranye + dua aria-current — makanya dihitung manual di sini.
  const activeHit = groups
    .flatMap((g) => g.items.filter((i) => matchesPath(pathname, i.path)).map((i) => ({ group: g.group, path: i.path })))
    .sort((a, b) => b.path.length - a.path.length)[0]
  const activePath = activeHit?.path
  // Grup yang berisi halaman aktif selalu kebuka, walau pernah dilipat —
  // biar user nggak "kehilangan" posisi dia di menu.
  const activeGroup = activeHit?.group

  const toggleGroup = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      writeCollapsed(next)
      return next
    })
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col bg-iapa-navy text-white transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 dark:border-r dark:border-white/5 dark:bg-iapa-sidebar-dark ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo full warna di atas "pelat" putih — peta navy-nya bakal
          hilang kalau ditaruh langsung di latar navy sidebar. */}
      <Link
        to="/"
        className="mx-3 mt-4 mb-4 flex shrink-0 items-center justify-center rounded-xl bg-white px-4 py-3 shadow-sm outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-iapa-orange"
      >
        <img src={logo} alt="IAPA" className="h-auto w-full max-w-[11rem]" />
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-6 [scrollbar-color:rgb(255_255_255/0.25)_transparent]">
        {groups.map((group, gi) => {
          const isActiveGroup = group.group === activeGroup
          const open = isActiveGroup || !collapsed.has(group.group)
          const listId = `sidebar-group-${gi}`
          return (
            <div key={group.group} className="mb-3">
              <button
                type="button"
                onClick={() => toggleGroup(group.group)}
                disabled={isActiveGroup}
                aria-expanded={open}
                aria-controls={listId}
                title={isActiveGroup ? 'Grup halaman yang sedang dibuka selalu terbuka' : undefined}
                className="flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-300 uppercase outline-hidden hover:text-white focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-white/70 disabled:cursor-default disabled:hover:text-slate-300 dark:text-slate-400 dark:disabled:hover:text-slate-400"
              >
                <span>{group.group}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`}
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {/* Disembunyikan (hidden), bukan di-unmount, biar aria-controls tetap nunjuk ke elemen yang ada */}
              <div id={listId} hidden={!open} className="mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.path === activePath
                  return (
                    // outline-hidden (bukan outline-none): di Windows High Contrast
                    // box-shadow/ring dibuang, outline transparan ini yang jadi
                    // kelihatan — fokus keyboard nggak hilang.
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-white/80 ${
                        isActive
                          ? 'bg-iapa-orange font-bold text-iapa-navy-deep shadow-sm'
                          : 'font-medium text-white/85 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <MenuIcon path={item.path} />
                      <span className="min-w-0 truncate" title={item.label}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer versioning — pola sama kayak IAPA Store (v{number}-{YYMMDD}
          di footer). Beda dari MENU: ini bukan item per-role, jadi selalu
          tampil buat semua orang yang login, terlepas dari role_menu_items. */}
      <Link
        to="/changelog"
        onClick={onNavigate}
        className="shrink-0 border-t border-white/10 px-4 py-3 text-xs text-white/70 outline-hidden hover:bg-white/5 hover:text-white focus-visible:bg-white/10 focus-visible:text-white focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-white/80"
      >
        <span className="font-medium">{APP_VERSION.label}</span> <span aria-hidden="true">·</span> Changelog
      </Link>
    </aside>
  )
}
