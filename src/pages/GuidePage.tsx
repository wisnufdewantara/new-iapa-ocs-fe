import { useAuthStore } from '../stores/authStore'
import { usePageTitle } from '../hooks/usePageTitle'
import type { Role } from '../types/role'

interface GuideSection {
  menu: string
  path: string
  steps: string[]
}

interface RoleGuide {
  role: Role
  label: string
  intro: string
  sections: GuideSection[]
}

const GUIDES: RoleGuide[] = [
  {
    role: 'Peserta',
    label: 'Peserta',
    intro: 'Sebagai Peserta, kamu bisa submit paper (jadi presenter) ATAU join sebagai peserta biasa — bukan dua-duanya.',
    sections: [
      {
        menu: 'Submit Paper',
        path: '/papers/submit',
        steps: [
          'Isi judul, abstrak, keywords, sub tema, daftar penulis, dan upload dokumen PDF.',
          'Klik "Submit Paper" — paper cuma bisa disubmit sekali, jadi pastikan datanya lengkap dulu.',
          'Buka menu ini lagi kapan saja buat cek status review paper kamu.',
        ],
      },
      {
        menu: 'Join Conference',
        path: '/join',
        steps: [
          'Pilih status keanggotaan IAPA (Member/Non-Member) — biaya partisipasi beda tergantung status ini.',
          'Klik "Join Sebagai Peserta".',
          'Kalau sudah pernah daftar sebelumnya, halaman ini otomatis nampilin status keanggotaan & pembayaran kamu.',
        ],
      },
      {
        menu: 'Pembayaran Saya',
        path: '/payment',
        steps: [
          'Cek nominal tagihan (biaya presenter dan/atau peserta) beserta status pembayarannya.',
          'Kalau statusnya "Menunggu pembayaran", transfer ke rekening yang tertera, lalu upload bukti transfer.',
          'Setelah diverifikasi admin keuangan, status berubah jadi "Terverifikasi".',
        ],
      },
    ],
  },
  {
    role: 'Reviewer',
    label: 'Reviewer',
    intro: 'Sebagai Reviewer, tugas kamu memutuskan paper mana yang diterima (Accepted) atau ditolak (Rejected).',
    sections: [
      {
        menu: 'Review Paper',
        path: '/papers/review',
        steps: [
          'Pilih conference, lalu lihat daftar paper yang perlu direview.',
          'Buka dokumen paper (klik judulnya) untuk membaca isinya.',
          'Klik "Accept" atau "Reject" sesuai keputusan.',
        ],
      },
    ],
  },
  {
    role: 'Manager',
    label: 'Manager',
    intro: 'Sebagai Manager, kamu mengelola jalannya conference dari sisi konten & jadwal — dari pembuatan acara sampai sertifikat.',
    sections: [
      {
        menu: 'Daftar Conference',
        path: '/conferences',
        steps: [
          'Klik "+ Buat Conference" untuk bikin acara baru (nama, tanggal, sub tema, status tampilan di homepage).',
          'Klik "Atur" pada salah satu conference untuk mengatur tenggat pembayaran dan upload poster acara.',
          'Ubah status (Coming Soon / Sedang Berlangsung / Selesai) langsung dari dropdown di tabel.',
        ],
      },
      { menu: 'Jadwal', path: '/schedules', steps: ['Pilih conference, lalu susun jadwal presentasi (paper, tanggal, jam, sesi, ruang).'] },
      { menu: 'Review Paper', path: '/papers/review', steps: ['Sama seperti role Reviewer — Manager juga bisa accept/reject paper.'] },
      {
        menu: 'Assign Reviewer',
        path: '/papers/assign-reviewer',
        steps: ['Pilih conference, klik "+ Assign Reviewer" pada paper yang belum ada reviewer-nya, tentukan reviewer & deadline review.'],
      },
      {
        menu: 'Generate LoA',
        path: '/papers/loa',
        steps: ['Pilih conference, centang paper yang mau dikirimi Letter of Acceptance, lalu kirim satu-satu atau sekaligus.'],
      },
      {
        menu: 'Kelola Sertifikat',
        path: '/certificates',
        steps: [
          'Kirim sertifikat ke presenter/peserta yang sudah presensi.',
          'Tab "Special Awards" — tentukan Best Paper & Best Presenter, lalu kirim sertifikat penghargaannya.',
        ],
      },
    ],
  },
  {
    role: 'Admin_Keuangan',
    label: 'Admin Keuangan',
    intro: 'Sebagai Admin Keuangan, kamu memverifikasi pembayaran dan mengelola tagihan peserta/presenter.',
    sections: [
      {
        menu: 'Kelola Pembayaran',
        path: '/payment/manage',
        steps: [
          'Pilih conference, lihat daftar tagihan tim/presenter dan peserta beserta bukti transfernya.',
          'Klik "Accept" kalau bukti transfer valid, atau "Reject" (wajib isi alasan) kalau tidak sesuai.',
          'Klik "Kirim Invoice" untuk mengirim rincian tagihan lewat email.',
          'Tab "Kode Unik" — atur kode unik nominal transfer per jenis pembayaran (presenter/peserta).',
        ],
      },
    ],
  },
  {
    role: 'Moderator',
    label: 'Moderator',
    intro: 'Sebagai Moderator, tugas kamu mencatat kehadiran peserta selama acara berlangsung.',
    sections: [
      {
        menu: 'Presensi',
        path: '/attendance',
        steps: [
          'Pilih conference, lalu pilih tab "Tim / Presenter" atau "Peserta".',
          'Centang kotak "Hadir" untuk menandai kehadiran — tersimpan otomatis.',
        ],
      },
    ],
  },
  {
    role: 'Admin',
    label: 'Admin',
    intro: 'Sebagai Admin (superuser), kamu punya akses ke semua menu di atas, ditambah pengelolaan sistem lewat area /admin (dilindungi password kedua).',
    sections: [
      { menu: 'Kelola Role', path: '/admin/roles', steps: ['Ubah role setiap user terdaftar lewat dropdown di tabel.'] },
      {
        menu: 'Role & Permission',
        path: '/admin/permissions',
        steps: [
          'Buat role baru lewat kolom "+ Nama role baru".',
          'Pilih role di daftar kiri, lalu centang menu yang boleh diakses (kolom tengah) dan aksi API yang diizinkan (kolom kanan).',
        ],
      },
      {
        menu: 'Pengaturan',
        path: '/admin/settings',
        steps: ['Atur konfigurasi SMTP (email), info rekening pembayaran, dan lihat Activity Log seluruh sistem.'],
      },
      {
        menu: 'Dashboard Developer',
        path: '/admin/developer',
        steps: [
          'Pantau status sistem: uptime, koneksi database, jumlah data per tabel — cuma metrik agregat, bukan data pribadi user.',
          'Aktifkan/nonaktifkan halaman Functional Test (/functional-test) dari sini kalau mau ada tim yang melakukan UAT.',
        ],
      },
    ],
  },
]

export function GuidePage() {
  usePageTitle('Panduan Penggunaan')
  const myRole = useAuthStore((s) => s.user?.role)
  // Setiap role cuma boleh lihat panduan role-nya sendiri — bukan tab
  // yang bisa diklik pindah ke role lain, biar orang gak salah kira dia
  // punya akses ke menu yang sebenarnya bukan buat dia.
  const guide = GUIDES.find((g) => g.role === myRole) ?? GUIDES[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Panduan Penggunaan</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cara pakai newocs untuk peran kamu: <strong>{guide.label}</strong>
        </p>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">{guide.intro}</p>

      <div className="flex flex-col gap-4">
        {guide.sections.map((s) => (
          <div key={s.path} className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{s.menu}</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-white/10 dark:text-gray-400">{s.path}</span>
            </div>
            <ol className="list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {s.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}
