// Formatter angka/uang bersama buat halaman baru (Dashboard Keuangan,
// Statistik, dst). Enam salinan `rupiah` lama di halaman lain sengaja
// belum dipindah ke sini — biar diff fitur ini nggak nyenggol halaman
// yang nggak ada hubungannya.

// Rp1.250.000 — format standar di seluruh app (tanpa spasi setelah Rp).
export const rupiah = (n: number | null | undefined) =>
  n == null ? '-' : `Rp${Math.round(n).toLocaleString('id-ID')}`

export const formatNumber = (n: number | null | undefined) => (n == null ? '-' : n.toLocaleString('id-ID'))

// Angka ringkas buat tile & tick sumbu: 1,5 rb / 12,4 jt / 1,2 M / 3 T.
// Desimal makin sedikit makin besar angkanya, biar lebar teks stabil.
export function compactNumber(n: number): string {
  const abs = Math.abs(n)
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'M'],
    [1e6, 'jt'],
    [1e3, 'rb'],
  ]
  for (const [base, suffix] of units) {
    if (abs >= base) {
      const scaled = n / base
      const digits = Math.abs(scaled) < 10 ? 2 : Math.abs(scaled) < 100 ? 1 : 0
      return `${scaled.toLocaleString('id-ID', { maximumFractionDigits: digits })} ${suffix}`
    }
  }
  return n.toLocaleString('id-ID')
}

// Rupiah ringkas buat tile (Rp1,25 jt / Rp1,2 M). Di bawah sejuta tetap
// ditulis penuh — "Rp750.000" masih muat di tile dan lebih jelas daripada
// "Rp750 rb". Nilai lengkapnya taruh di atribut title pemanggil.
export function rupiahCompact(n: number | null | undefined): string {
  if (n == null) return '-'
  if (Math.abs(n) < 1e6) return rupiah(n)
  return `Rp${compactNumber(n)}`
}

// Tick sumbu uang: selalu ringkas, termasuk ribuan (Rp500 rb).
export const rupiahTick = (n: number) => (n === 0 ? '0' : `Rp${compactNumber(n)}`)

// 0.4567 -> "45,7%"
export const percent = (ratio: number, digits = 1) =>
  `${(ratio * 100).toLocaleString('id-ID', { maximumFractionDigits: digits })}%`

// Tanggal "YYYY-MM-DD" dari backend di-parse sebagai tanggal lokal, bukan
// UTC — new Date('2026-10-05') itu tengah malam UTC, di zona negatif bisa
// mundur sehari.
export function parseDay(day: string): Date {
  const [y, m, d] = day.slice(0, 10).split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

// Label minggu di sumbu: "5 Okt". Tahun ditambah kalau beda tahun berjalan.
export function weekLabel(weekStart: string, withYear = false): string {
  return parseDay(weekStart).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

// Deret tanggal "YYYY-MM-DD" yang lewat pergantian tahun — label sumbunya
// perlu tahun, kalau nggak "5 Okt" bisa berarti Okt tahun mana saja.
export const spansYears = (days: string[]) =>
  days.length > 1 && days[0].slice(0, 4) !== days[days.length - 1].slice(0, 4)

// "2025-10" -> "Okt 2025"
export function monthLabel(month: string): string {
  return parseDay(`${month}-01`).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}

export function dateShort(iso: string | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
