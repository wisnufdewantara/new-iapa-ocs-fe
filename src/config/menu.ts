export interface MenuItem {
  label: string
  path: string
}

export interface MenuGroup {
  group: string
  items: MenuItem[]
}

// Satu sumber kebenaran buat sidebar & routing, gantiin 6 blok sidebar
// hardcoded per-role di ocs2. Menu yang mirip antar role (mis. Payment
// presenter vs participant) disatukan jadi satu halaman dengan tab,
// bukan halaman terpisah — lihat PaymentPage. Visibilitas per role
// diatur dari database (role_menu_items, lihat /admin/permissions),
// bukan hardcode di sini lagi — file ini cuma katalog label+path.
export const MENU: MenuGroup[] = [
  {
    group: 'Utama',
    items: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    group: 'Conference',
    items: [
      { label: 'Daftar Conference', path: '/conferences' },
      { label: 'Jadwal', path: '/schedules' },
    ],
  },
  {
    group: 'Paper',
    items: [
      { label: 'Submit Paper', path: '/papers/submit' },
      { label: 'Review Paper', path: '/papers/review' },
      { label: 'Assign Reviewer', path: '/papers/assign-reviewer' },
      { label: 'Generate LoA', path: '/papers/loa' },
    ],
  },
  {
    group: 'Peserta & Presensi',
    items: [
      { label: 'Join Conference', path: '/join' },
      { label: 'Presensi', path: '/attendance' },
    ],
  },
  {
    group: 'Sertifikat',
    items: [{ label: 'Kelola Sertifikat', path: '/certificates' }],
  },
  {
    group: 'Pembayaran',
    items: [
      { label: 'Pembayaran Saya', path: '/payment' },
      { label: 'Kelola Pembayaran', path: '/payment/manage' },
    ],
  },
  {
    group: 'Admin',
    items: [
      { label: 'Kelola Role', path: '/admin/roles' },
      { label: 'Role & Permission', path: '/admin/permissions' },
      { label: 'Pengaturan', path: '/admin/settings' },
    ],
  },
  {
    group: 'Developer',
    items: [{ label: 'Dashboard Developer', path: '/admin/developer' }],
  },
]
