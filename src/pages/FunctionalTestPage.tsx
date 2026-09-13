import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { usePageTitle } from '../hooks/usePageTitle'
import logo from '../assets/logo-iapa.png'

interface TestCase {
  id: string
  title: string
  steps: string[]
  expect: string
}

interface Section {
  section: string
  cases: TestCase[]
}

interface ResultRow {
  test_id: string
  status: 'pending' | 'pass' | 'fail'
  note: string | null
  tester: string | null
}

// Konten sama persis dengan lembar UAT Peserta yang sebelumnya dibikin
// sebagai Artifact terpisah — sekarang jadi halaman publik di dalam
// aplikasi (/functional-test), aktif/nonaktifnya diatur admin lewat
// Dashboard Developer.
const DATA: Section[] = [
  {
    section: 'Registrasi & Autentikasi',
    cases: [
      {
        id: 'TC-01',
        title: 'Lihat conference aktif di homepage (belum login)',
        steps: ['Buka halaman utama tanpa login.'],
        expect:
          'Conference berstatus "Sedang Berlangsung" tampil lengkap dengan poster, tanggal, dan tombol "Daftar Sebagai Peserta" / "Submit Paper". Kalau ada lebih dari satu conference aktif, keduanya tampil setara.',
      },
      {
        id: 'TC-02',
        title: 'Daftar akun baru',
        steps: ['Klik "Daftar", isi semua field wajib dengan data valid.', 'Klik "Create Account".'],
        expect: 'Notifikasi "Registrasi berhasil" muncul, diarahkan ke halaman Login.',
      },
      {
        id: 'TC-03',
        title: 'Validasi form registrasi',
        steps: ['Isi email dengan format salah (mis. "abc@").', 'Isi password kurang dari 8 karakter atau tanpa angka.'],
        expect: 'Form menolak submit, pesan error yang jelas muncul, tidak ada request ke server.',
      },
      {
        id: 'TC-04',
        title: 'Login dengan akun baru',
        steps: ['Masukkan username/email dan password yang baru didaftarkan.', 'Klik "Login".'],
        expect: 'Notifikasi "Login berhasil" muncul, masuk ke halaman Dashboard.',
      },
      {
        id: 'TC-05',
        title: 'Login dengan password salah',
        steps: ['Masukkan username yang benar, password yang salah.', 'Klik "Login".'],
        expect: 'Notifikasi error "Username/email atau password salah" muncul, tetap di halaman Login.',
      },
    ],
  },
  {
    section: 'Homepage & Riwayat Event',
    cases: [
      {
        id: 'TC-06',
        title: 'Buka Riwayat Event',
        steps: ['Dari homepage, klik "Lihat Event Sebelumnya".'],
        expect: 'Daftar event yang sudah lewat tampil dengan benar.',
      },
      {
        id: 'TC-07',
        title: 'Buka detail salah satu event lama',
        steps: ['Dari halaman Riwayat Event, klik salah satu event.'],
        expect: 'Halaman detail event terbuka, menampilkan info conference tersebut.',
      },
    ],
  },
  {
    section: 'Join Conference (Peserta)',
    cases: [
      {
        id: 'TC-08',
        title: 'Buka form Join Conference',
        steps: ['Login sebagai peserta yang belum submit paper/join.', 'Dari Dashboard, buka menu "Join Conference".'],
        expect: 'Form join tampil, data profil (nama, email, telepon, afiliasi, negara) otomatis terisi dari akun.',
      },
      {
        id: 'TC-09',
        title: 'Submit Join Conference',
        steps: ['Pilih status keanggotaan IAPA (Member/Non-Member).', 'Klik "Join Sebagai Peserta".'],
        expect: 'Notifikasi "Berhasil join sebagai peserta" muncul.',
      },
      {
        id: 'TC-10',
        title: 'Buka ulang Join Conference setelah terdaftar',
        steps: ['Setelah berhasil join, buka lagi menu "Join Conference".'],
        expect: 'Halaman menampilkan status keanggotaan & info pembayaran yang sudah terdaftar, BUKAN form kosong lagi.',
      },
    ],
  },
  {
    section: 'Submit Paper (Presenter)',
    cases: [
      {
        id: 'TC-11',
        title: 'Buka form Submit Paper',
        steps: ['Login sebagai peserta yang belum submit paper/join.', 'Dari Dashboard, buka menu "Submit Paper".'],
        expect: 'Form tampil: judul, abstrak, keywords, sub tema, daftar penulis, dan upload dokumen PDF.',
      },
      {
        id: 'TC-12',
        title: 'Validasi dokumen wajib',
        steps: ['Isi semua field KECUALI dokumen PDF.', 'Klik "Submit Paper".'],
        expect: 'Form menolak submit karena dokumen wajib diisi.',
      },
      {
        id: 'TC-13',
        title: 'Submit paper lengkap',
        steps: ['Lengkapi semua field termasuk upload dokumen PDF.', 'Klik "Submit Paper".'],
        expect: 'Notifikasi "Paper berhasil disubmit!" muncul.',
      },
      {
        id: 'TC-14',
        title: 'Buka ulang Submit Paper setelah submit',
        steps: ['Setelah berhasil submit, buka lagi menu "Submit Paper".'],
        expect: 'Halaman menampilkan judul paper & status paper yang sudah disubmit, BUKAN form kosong lagi.',
      },
    ],
  },
  {
    section: 'Pembayaran',
    cases: [
      {
        id: 'TC-15',
        title: 'Lihat tagihan pembayaran',
        steps: ['Buka menu "Pembayaran Saya".'],
        expect: 'Tagihan (presenter dan/atau peserta) tampil dengan nominal dan status yang sesuai.',
      },
      {
        id: 'TC-16',
        title: 'Cek info rekening tujuan',
        steps: ['Di halaman "Pembayaran Saya", periksa bagian info transfer.'],
        expect: 'Nama bank, nama pemilik rekening, dan nomor rekening tampil dengan benar.',
      },
      {
        id: 'TC-17',
        title: 'Upload bukti transfer',
        steps: ['Pilih file bukti transfer (gambar/PDF).', 'Isi nama pengirim & tanggal transfer.', 'Klik "Upload Bukti Transfer".'],
        expect: 'Notifikasi "Bukti transfer berhasil diupload" muncul.',
      },
      {
        id: 'TC-18',
        title: 'Status setelah upload',
        steps: ['Setelah upload berhasil, lihat status pembayaran.'],
        expect: 'Status berubah menjadi "Menunggu verifikasi", form upload tersembunyi/nonaktif.',
      },
    ],
  },
  {
    section: 'Keamanan & Umum',
    cases: [
      { id: 'TC-19', title: 'Logout', steps: ['Klik "Logout" di header.'], expect: 'Kembali ke halaman publik (bukan Dashboard).' },
      {
        id: 'TC-20',
        title: 'Akses Dashboard setelah logout',
        steps: ['Setelah logout, buka langsung URL /dashboard di address bar.'],
        expect: 'TIDAK bisa masuk — diarahkan ke halaman Login.',
      },
      {
        id: 'TC-21',
        title: 'Coba akses halaman admin sebagai peserta',
        steps: ['Login sebagai peserta.', 'Buka langsung URL /admin/roles di address bar.'],
        expect: 'Akses ditolak — TIDAK menampilkan halaman kelola role.',
      },
      {
        id: 'TC-22',
        title: 'Tampilan di HP & dark mode',
        steps: ['Buka Homepage, Login, Submit Paper, dan Pembayaran dari browser HP.', 'Coba toggle dark mode (ikon di header).'],
        expect: 'Semua halaman tetap rapi (tidak ada elemen kepotong/tabrakan), dark mode konsisten di semua halaman.',
      },
    ],
  },
]

const STATUS_STYLE: Record<ResultRow['status'], string> = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  pass: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  fail: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

export function FunctionalTestPage() {
  usePageTitle('Functional Test')
  const queryClient = useQueryClient()
  const [tester, setTester] = useState(() => {
    try {
      return localStorage.getItem('newocs-uat-tester-name') ?? ''
    } catch {
      return ''
    }
  })

  const { data: statusData, isLoading: loadingStatus } = useQuery({
    queryKey: ['functional-test-status'],
    queryFn: async () => (await api.get<{ enabled: boolean }>('/functional-test/status')).data,
  })

  const { data: results } = useQuery({
    queryKey: ['functional-test-results'],
    queryFn: async () => (await api.get<ResultRow[]>('/functional-test/results')).data,
    enabled: !!statusData?.enabled,
    refetchInterval: 8000,
  })

  const resultMap = new Map((results ?? []).map((r) => [r.test_id, r]))
  const total = DATA.reduce((n, s) => n + s.cases.length, 0)
  const passCount = (results ?? []).filter((r) => r.status === 'pass').length
  const failCount = (results ?? []).filter((r) => r.status === 'fail').length

  const saveMutation = useMutation({
    mutationFn: (body: { testId: string; status: ResultRow['status']; note?: string }) =>
      api.post('/functional-test/results', { ...body, tester }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['functional-test-results'] }),
  })

  const setTesterName = (v: string) => {
    setTester(v)
    try {
      localStorage.setItem('newocs-uat-tester-name', v)
    } catch {
      // localStorage bisa nggak tersedia, abaikan
    }
  }

  if (loadingStatus) {
    return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  }

  if (!statusData?.enabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center dark:bg-brand-dark">
        <img src={logo} alt="IAPA" className="mb-2 h-9 w-auto" />
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Functional Test sedang tidak aktif</h1>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Halaman ini cuma aktif kalau admin menyalakannya lewat Dashboard Developer.
        </p>
        <Link to="/" className="mt-2 text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange">
          ← Kembali ke Beranda
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-brand-dark-surface">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="IAPA" className="h-8 w-auto" />
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange">Dokumen Uji Fungsional</p>
          <h1 className="mt-1 text-xl font-bold text-gray-800 dark:text-gray-100">UAT — newocs OCS, Peran Peserta</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Ruang lingkup: alur yang dilihat pengguna dengan role <strong>Peserta</strong> saja — registrasi, homepage, Join
            Conference, Submit Paper, dan Pembayaran.
          </p>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Penguji</label>
            <input
              value={tester}
              onChange={(e) => setTesterName(e.target.value)}
              placeholder="Nama kamu"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
          <div>
            <p className="font-mono text-xl font-semibold text-green-600 dark:text-green-400">{passCount}</p>
            <p className="text-xs uppercase text-gray-400">Lulus</p>
          </div>
          <div>
            <p className="font-mono text-xl font-semibold text-red-600 dark:text-red-400">{failCount}</p>
            <p className="text-xs uppercase text-gray-400">Gagal</p>
          </div>
          <div>
            <p className="font-mono text-xl font-semibold text-gray-500 dark:text-gray-400">{total - passCount - failCount}</p>
            <p className="text-xs uppercase text-gray-400">Belum diuji</p>
          </div>
          <div className="ml-auto flex-1">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div className="bg-green-500" style={{ width: `${(passCount / total) * 100}%` }} />
              <div className="bg-red-500" style={{ width: `${(failCount / total) * 100}%` }} />
            </div>
          </div>
        </div>

        {DATA.map((section, si) => (
          <div key={section.section} className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-brand-dark-surface">
            <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-white/10 dark:bg-white/5">
              <span className="font-mono text-xs font-semibold text-brand-orange">BAGIAN {['I', 'II', 'III', 'IV', 'V', 'VI'][si]}</span>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{section.section}</h2>
            </div>
            {section.cases.map((c) => {
              const row = resultMap.get(c.id)
              const status = row?.status ?? 'pending'
              return (
                <div key={c.id} className="grid gap-3 border-b border-gray-200 p-5 last:border-b-0 dark:border-white/10 sm:grid-cols-[64px_1fr_180px]">
                  <div className="font-mono text-xs text-gray-400">{c.id}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{c.title}</h3>
                    <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {c.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                    <p className="mt-2 rounded border-l-2 border-brand-orange bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-white/5 dark:text-gray-300">
                      <span className="mb-0.5 block font-semibold uppercase text-gray-400">Hasil yang diharapkan</span>
                      {c.expect}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex overflow-hidden rounded-md border border-gray-300 text-xs dark:border-white/15">
                      {(['pending', 'pass', 'fail'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => saveMutation.mutate({ testId: c.id, status: s, note: row?.note ?? '' })}
                          className={`flex-1 border-r border-gray-300 px-2 py-1.5 font-medium last:border-r-0 dark:border-white/15 ${
                            status === s ? STATUS_STYLE[s] : 'bg-white text-gray-500 dark:bg-brand-dark-surface dark:text-gray-400'
                          }`}
                        >
                          {s === 'pending' ? 'Belum' : s === 'pass' ? 'Lulus' : 'Gagal'}
                        </button>
                      ))}
                    </div>
                    <textarea
                      defaultValue={row?.note ?? ''}
                      placeholder="Catatan (opsional)"
                      onBlur={(e) => saveMutation.mutate({ testId: c.id, status, note: e.target.value })}
                      className="min-h-[44px] w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    />
                    {row?.tester && <p className="font-mono text-[10px] text-gray-400">diuji oleh {row.tester}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
