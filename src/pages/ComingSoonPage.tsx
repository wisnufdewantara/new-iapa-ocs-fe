import { useLocation } from 'react-router-dom'
import { MENU } from '../config/menu'
import { usePageTitle } from '../hooks/usePageTitle'

export function ComingSoonPage() {
  const { pathname } = useLocation()
  const label = MENU.flatMap((g) => g.items).find((i) => i.path === pathname)?.label ?? pathname
  usePageTitle(label)

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center dark:border-white/20 dark:bg-brand-dark-surface">
      <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{label}</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        modul is under constructions awokawokawokawok
      </p>
    </div>
  )
}
