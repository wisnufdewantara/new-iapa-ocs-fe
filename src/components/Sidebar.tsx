import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { menuForRole } from '../config/menu'

// Satu komponen sidebar dinamis buat semua role, ganti 6 versi
// hardcoded (VSidebar.vue) di ocs2.
export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role)
  if (!role) return null
  const groups = menuForRole(role)

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 py-5 font-bold text-lg text-blue-700">newocs</div>
      <nav className="px-2 pb-6">
        {groups.map((group) => (
          <div key={group.group} className="mb-4">
            <p className="px-2 mb-1 text-xs font-semibold uppercase text-gray-400">{group.group}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
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
