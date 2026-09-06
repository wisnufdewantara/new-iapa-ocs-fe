import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { menuForRole } from '../config/menu'
import logo from '../assets/logo-iapa.png'

interface SidebarProps {
  open: boolean
  onNavigate: () => void
}

// Satu komponen sidebar dinamis buat semua role, ganti 6 versi
// hardcoded (VSidebar.vue) di ocs2. Di layar kecil jadi drawer
// yang bisa ditutup/dibuka (dikontrol dari Layout), di layar
// md ke atas selalu tampil sebagai kolom statis.
export function Sidebar({ open, onNavigate }: SidebarProps) {
  const role = useAuthStore((s) => s.user?.role)
  if (!role) return null
  const groups = menuForRole(role)

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 dark:border-white/10 dark:bg-brand-dark-surface ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="px-4 py-5">
        <img src={logo} alt="IAPA" className="h-8 w-auto" />
      </div>
      <nav className="px-2 pb-6">
        {groups.map((group) => (
          <div key={group.group} className="mb-4">
            <p className="px-2 mb-1 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{group.group}</p>
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
        ))}
      </nav>
    </aside>
  )
}
