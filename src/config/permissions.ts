// Cermin PERMISSION_CATALOG di backend (newocs-be/src/roles/permission-catalog.constant.ts).
// Nambah modul/aksi baru? Samain manual di kedua tempat.
export const PERMISSION_CATALOG: Record<string, string[]> = {
  schedule: ['manage'],
  conference: ['create', 'update', 'manage_awards'],
  papers: ['review', 'submit'],
  attendance: ['manage'],
  assign_reviewer: ['manage'],
  settings: ['manage'],
  users: ['manage'],
  roles: ['manage'],
  loa: ['manage'],
  certificate: ['manage', 'manage_awards'],
  admin_gate: ['verify'],
  payment: ['submit', 'verify', 'manage_types'],
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
}
