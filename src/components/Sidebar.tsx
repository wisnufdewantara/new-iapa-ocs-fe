import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { MENU } from '../config/menu'
import { useMenu } from '../hooks/useMenu'
import { APP_VERSION } from '../version'
import { LegacySyncButton } from './LegacySyncButton'
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

  // Grup yang berisi halaman aktif selalu kebuka, walau pernah dilipat —
  // biar user nggak "kehilangan" posisi dia di menu.
  const activeGroup = groups
    .flatMap((g) => g.items.filter((i) => matchesPath(pathname, i.path)).map((i) => ({ group: g.group, len: i.path.length })))
    .sort((a, b) => b.len - a.len)[0]?.group

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
      className={`fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 dark:border-white/10 dark:bg-brand-dark-surface ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <Link to="/" className="block shrink-0 px-4 py-5">
        <img src={logo} alt="IAPA" className="h-8 w-auto" />
      </Link>
      <nav className="flex-1 overflow-y-auto px-2 pb-6">
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
                className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-semibold uppercase text-gray-400 hover:text-gray-600 disabled:cursor-default disabled:hover:text-gray-400 dark:text-gray-500 dark:hover:text-gray-300 dark:disabled:hover:text-gray-500"
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
              <div id={listId} hidden={!open} className="mt-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-brand-navy/10 text-brand-navy dark:bg-brand-orange/10 dark:text-brand-orange'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Tombol sync ke DB OCS lawas — Admin-only, matching sensitivitas
          aksi (nyentuh data gabungan 13 tabel lintas sistem). Ditaruh di
          atas footer versioning sesuai permintaan. */}
      {role === 'Admin' && <LegacySyncButton />}

      {/* Footer versioning — pola sama kayak IAPA Store (v{number}-{YYMMDD}
          di footer). Beda dari MENU: ini bukan item per-role, jadi selalu
          tampil buat semua orang yang login, terlepas dari role_menu_items. */}
      <Link
        to="/changelog"
        onClick={onNavigate}
        className="shrink-0 border-t border-gray-200 px-4 py-3 text-xs text-gray-400 hover:text-gray-600 dark:border-white/10 dark:text-gray-500 dark:hover:text-gray-300"
      >
        {APP_VERSION.label} <span className="opacity-60">·</span> Changelog
      </Link>
    </aside>
  )
}
