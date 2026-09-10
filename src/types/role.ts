// Sama persis dengan enum Role di backend (Java lama & newocs-be),
// supaya data role user hasil migrasi tetap valid tanpa perlu mapping.
export type Role = 'Admin' | 'Peserta' | 'Reviewer' | 'Admin_Keuangan' | 'Manager' | 'Moderator'

// Role sekarang bisa custom (dibuat admin di /admin/permissions), jadi
// dropdown/role-picker dinamis (UserManagementPage, RolePermissionsPage)
// pakai tipe ini, bukan union 6 nilai di atas yang masih dipakai logic lama.
export type AnyRoleName = string
