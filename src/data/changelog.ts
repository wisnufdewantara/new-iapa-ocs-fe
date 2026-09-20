// Diringkas manual dari `git log` newocs-fe + newocs-be — bukan auto-generate,
// jadi perlu ditambahin manual tiap ada rilis besar berikutnya (cukup keterangan
// singkat, gak perlu semua commit).
export interface ChangelogEntry {
  date: string // YYYY-MM-DD
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-09-20',
    items: [
      'Sistem tombol biru terpadu di seluruh halaman',
      'Halaman detail payment: breakdown per-writer + opsi Non-Payment/Writer',
      'Panduan Penggunaan dibatasi per-role (Admin bisa lihat semua)',
      'Halaman diblokir otomatis kalau di luar menu role kamu',
      'Push nominal & status payment otomatis ke sistem lama (ocs2)',
    ],
  },
  {
    date: '2026-09-17',
    items: ['Tombol "Batalkan Keputusan" di Review Paper (dengan konfirmasi dobel)'],
  },
  {
    date: '2026-09-16',
    items: ['Toggle buka/tutup submission paper per-conference'],
  },
  {
    date: '2026-09-15',
    items: [
      'Urutan penulis paper sesuai submission (LoA & Review Paper)',
      'Template email notifikasi + tes SMTP',
      'Opsi metode pembayaran (checkbox)',
    ],
  },
  {
    date: '2026-09-14',
    items: [
      'Kirim sertifikat massal di background (gak nge-block halaman)',
      'Tenggat pembayaran bisa diatur admin',
      'Sync berkala dari sistem lama (ocs2/Supabase)',
    ],
  },
  {
    date: '2026-09-13',
    items: ['Manage user (buat/hapus akun)', 'Halaman Profil Saya', 'Halaman Functional Test publik'],
  },
  {
    date: '2026-09-11',
    items: [
      'Sistem role & permission custom (bisa bikin role baru sendiri)',
      'Halaman LoA, Sertifikat, Payment, Peserta',
      'Developer Dashboard',
    ],
  },
  {
    date: '2026-09-07',
    items: [
      'Halaman Submit Paper',
      'Login pakai username atau email',
      'Halaman registrasi peserta baru',
      'Kelola Role (user management)',
    ],
  },
  {
    date: '2026-09-06',
    items: ['Homepage publik + dark mode', 'Conference, Jadwal, Presensi, Review Paper, Assign Reviewer, Pengaturan'],
  },
  {
    date: '2026-09-03',
    items: ['Fondasi newocs — React + Vite + Tailwind (frontend), NestJS + Prisma (backend)'],
  },
]
