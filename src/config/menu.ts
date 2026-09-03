import type { Role } from '../types/role'

export interface MenuItem {
  label: string
  path: string
  roles: Role[]
}

export interface MenuGroup {
  group: string
  items: MenuItem[]
}

// Satu sumber kebenaran buat sidebar & routing, gantiin 6 blok sidebar
// hardcoded per-role di ocs2. Menu yang mirip antar role (mis. Payment
// presenter vs participant) disatukan jadi satu halaman dengan tab,
// bukan halaman terpisah — lihat PaymentPage.
export const MENU: MenuGroup[] = [
  {
    group: 'Utama',
    items: [
      { label: 'Dashboard', path: '/', roles: ['Admin', 'Peserta', 'Manager', 'Admin_Keuangan'] },
    ],
  },
  {
    group: 'Conference',
    items: [
      { label: 'Daftar Conference', path: '/conferences', roles: ['Admin', 'Manager'] },
      { label: 'Jadwal', path: '/schedules', roles: ['Admin', 'Manager'] },
    ],
  },
  {
    group: 'Paper',
    items: [
      { label: 'Submit Paper', path: '/papers/submit', roles: ['Peserta'] },
      { label: 'Review Paper', path: '/papers/review', roles: ['Admin', 'Reviewer', 'Manager'] },
      { label: 'Assign Reviewer', path: '/papers/assign-reviewer', roles: ['Admin', 'Manager'] },
      { label: 'Generate LoA', path: '/papers/loa', roles: ['Admin', 'Manager'] },
    ],
  },
  {
    group: 'Peserta & Presensi',
    items: [
      { label: 'Join Conference', path: '/join', roles: ['Peserta'] },
      { label: 'Presensi', path: '/attendance', roles: ['Admin', 'Moderator'] },
    ],
  },
  {
    group: 'Sertifikat',
    items: [{ label: 'Kelola Sertifikat', path: '/certificates', roles: ['Admin', 'Manager'] }],
  },
  {
    group: 'Pembayaran',
    items: [
      { label: 'Pembayaran Saya', path: '/payment', roles: ['Peserta'] },
      { label: 'Kelola Pembayaran', path: '/payment/manage', roles: ['Admin', 'Admin_Keuangan'] },
    ],
  },
  {
    group: 'Admin',
    items: [
      { label: 'Kelola Role', path: '/admin/roles', roles: ['Admin'] },
      { label: 'Pengaturan', path: '/admin/settings', roles: ['Admin', 'Admin_Keuangan'] },
    ],
  },
]

export function menuForRole(role: Role): MenuGroup[] {
  return MENU.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}
