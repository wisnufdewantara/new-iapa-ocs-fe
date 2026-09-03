// Sama persis dengan enum Role di backend (Java lama & newocs-be),
// supaya data role user hasil migrasi tetap valid tanpa perlu mapping.
export type Role = 'Admin' | 'Peserta' | 'Reviewer' | 'Admin_Keuangan' | 'Manager' | 'Moderator'
