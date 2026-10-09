// Diringkas manual dari `git log` newocs-fe + newocs-be — bukan auto-generate,
// jadi perlu ditambahin manual tiap ada rilis besar berikutnya (cukup keterangan
// singkat, gak perlu semua commit).
export interface ChangelogEntry {
  date: string // YYYY-MM-DD
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-10-09',
    items: [
      'Sistem baru resmi pindah ke ocs2.iapa.or.id (dev-ocs.iapa.or.id dialihkan otomatis)',
      'Halaman Syarat dan Ketentuan (ID/EN), termasuk kebijakan pembayaran non-refundable — wajib disetujui saat registrasi',
      'Admin bisa upload bukti transfer atas nama presenter/peserta (tombol Override di kartu Bukti Transfer)',
      'Peserta bisa upload bukti transfer langsung dari Dashboard (PDF/JPG/PNG), dan ganti bukti selama belum diverifikasi',
      'Tombol Lihat Profil di Kelola Role',
      'Ikon situs (favicon) IAPA',
    ],
  },
  {
    date: '2026-10-07',
    items: [
      'Tombol "Sync dengan DB OCS Lawas" di sidebar (Admin)',
      'Download Laporan: pilih kolom + format Excel (.xlsx), link dokumen paper & bukti bayar',
      'Bukti transfer peserta dari ocs2 ikut tertarik otomatis tiap 15 menit',
      'Perbaikan keamanan: dokumen paper & bukti transfer tidak lagi bisa diakses publik tanpa izin',
    ],
  },
  {
    date: '2026-10-06',
    items: [
      'Halaman Download Laporan — export CSV paper, pembayaran, dan peserta',
      'Kirim kwitansi otomatis (bukan invoice ulang) begitu pembayaran peserta verified',
      'Halaman detail pembayaran peserta: lihat bukti transfer + override nominal/membership',
      'Perbaikan keamanan: celah stored-XSS di upload bukti transfer, akses silang data penulis antar-paper, nominal pembayaran bisa berubah diam-diam setelah verified, dan kirim kwitansi dobel akibat double-click',
    ],
  },
  {
    date: '2026-10-01',
    items: [
      'Sistem manajemen template sertifikat baru (editor drag-and-drop, upload desain sendiri, placeholder teks manual)',
      'Perbaikan invoice PDF yang sempat pakai halaman polos, bukan template asli',
    ],
  },
  {
    date: '2026-09-30',
    items: ['Fitur lupa password & reset password'],
  },
  {
    date: '2026-09-23',
    items: [
      'Bulk accept/reject paper + catatan reviewer',
      'Halaman detail pembayaran: edit penulis (tambah/ganti nama/hapus) + lihat bukti transfer',
      'Sinkronisasi status & nominal pembayaran otomatis ke sistem lama (ocs2)',
      'Perbaikan keamanan: password SMTP yang sempat bocor plaintext lewat API Settings',
    ],
  },
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
