import { OutlineIcon, type OutlineIconName } from '../components/OutlineIcon'

// Ikon per item menu sidebar, dipetakan dari PATH (bukan label) — sama
// kayak grant di role_menu_items, path yang jadi kunci; label boleh
// diganti tanpa ikonnya ilang. Satu tempat aja biar menu.ts tetap katalog
// label+path murni. Path baru yang lupa didaftarin di sini tetap dapat
// ikon default (dokumen), jadi baris menunya nggak pernah "bolong".
const MENU_ICONS: Record<string, OutlineIconName> = {
  '/dashboard': 'squares',
  '/finance': 'banknotes',
  '/statistics': 'chartBar',
  '/report': 'download',
  '/profile': 'userCircle',
  '/guide': 'bookOpen',
  '/conferences': 'presentation',
  '/schedules': 'calendar',
  '/papers/submit': 'documentUp',
  '/papers/review': 'clipboardCheck',
  '/papers/assign-reviewer': 'userPlus',
  '/papers/loa': 'documentCheck',
  '/join': 'ticket',
  '/attendance': 'checkCircle',
  '/certificates': 'academicCap',
  '/certificate-templates': 'pencilSquare',
  '/payment': 'creditCard',
  '/payment/manage': 'receipt',
  '/admin/roles': 'users',
  '/admin/permissions': 'shieldCheck',
  '/admin/settings': 'cog',
  '/admin/developer': 'code',
  '/admin/mail-log': 'envelope',
}

const DEFAULT_ICON: OutlineIconName = 'document'

export function MenuIcon({ path, className = 'h-5 w-5' }: { path: string; className?: string }) {
  return <OutlineIcon name={MENU_ICONS[path] ?? DEFAULT_ICON} className={className} />
}
