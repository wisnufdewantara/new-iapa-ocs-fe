// Cermin PERMISSION_CATALOG di backend (newocs-be/src/roles/permission-catalog.constant.ts).
// Nambah modul/aksi baru? Samain manual di kedua tempat. Aksi yang belum
// ada di sini nggak muncul checkbox-nya di halaman Role & Permission —
// grant-nya cuma bisa lewat SQL, jadi jaga dua file ini tetap sama.
export const PERMISSION_CATALOG: Record<string, string[]> = {
  schedule: ['manage'],
  conference: ['create', 'update', 'manage_awards'],
  papers: ['review', 'submit'],
  attendance: ['manage'],
  assign_reviewer: ['manage'],
  settings: ['manage'],
  users: ['manage', 'impersonate'],
  roles: ['manage'],
  loa: ['manage'],
  certificate: ['manage', 'manage_awards', 'manage_templates'],
  admin_gate: ['verify'],
  payment: ['submit', 'verify', 'manage_types', 'manage_invoices'],
  participant: ['join'],
  developer: ['view'],
  // finance_dashboard = Dashboard Keuangan (/finance), statistics =
  // Statistik (/statistics) — dipisah dari download biar Manager bisa
  // lihat statistik tanpa ikut lihat angka uang.
  report: ['download', 'finance_dashboard', 'statistics'],
}

export const MODULE_LABEL: Record<string, string> = {
  schedule: 'Jadwal',
  conference: 'Conference',
  papers: 'Paper',
  attendance: 'Presensi',
  assign_reviewer: 'Assign Reviewer',
  settings: 'System Settings',
  users: 'Kelola User',
  roles: 'Role & Permission',
  loa: 'Generate LoA',
  certificate: 'Sertifikat',
  admin_gate: 'Admin Gate',
  payment: 'Pembayaran',
  participant: 'Join Conference (Peserta)',
  developer: 'Developer',
  report: 'Laporan & Dashboard',
}
