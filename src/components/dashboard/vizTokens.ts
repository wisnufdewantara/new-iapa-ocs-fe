import { useCallback, useEffect, useRef, useState } from 'react'

// Nama warna yang boleh dipakai grafik — semuanya nunjuk ke token CSS di
// index.css (.viz-root), jadi light/dark otomatis ikut class .dark tanpa
// perlu baca state tema di JS.
export type VizColor =
  | 's1'
  | 's2'
  | 's3'
  | 's4'
  | 'good'
  | 'warning'
  | 'serious'
  | 'critical'
  | 'neutral'
  | 'neutral-2'

export const fillOf = (c: VizColor) => `var(--viz-${c})`
export const inkOn = (c: VizColor) => `var(--viz-on-${c})`

export type StatusIconKind = 'good' | 'warning' | 'serious' | 'critical' | 'neutral' | 'other'

export interface StatusMeta {
  label: string
  color: VizColor
  icon: StatusIconKind
}

// Satu peta status pembayaran buat semua grafik/tabel dashboard — label
// sama dengan yang dilihat peserta di MyPaymentCards biar istilahnya
// konsisten.
export const PAYMENT_STATUS: Record<string, StatusMeta> = {
  verified: { label: 'Terverifikasi', color: 'good', icon: 'good' },
  'waiting for verification': { label: 'Menunggu verifikasi', color: 'warning', icon: 'warning' },
  'waiting for payment': { label: 'Menunggu pembayaran', color: 'serious', icon: 'serious' },
  rejected: { label: 'Bukti ditolak', color: 'critical', icon: 'critical' },
  'waiting for calculation': { label: 'Menunggu perhitungan', color: 'neutral', icon: 'neutral' },
  other: { label: 'Status lain', color: 'neutral-2', icon: 'other' },
}

export const paymentStatusMeta = (status: string | null): StatusMeta =>
  status == null
    ? { label: 'Belum ada status', color: 'neutral', icon: 'neutral' }
    : (PAYMENT_STATUS[status] ?? { label: status, color: 'neutral-2', icon: 'other' })

// Lebar elemen live (ResizeObserver) — grafik SVG digambar di ukuran
// piksel aslinya, bukan viewBox yang di-stretch, supaya teks sumbu nggak
// ikut melar/menciut di HP.
// Pakai callback ref (bukan useEffect [] sekali di mount): grafik yang
// mount pertama kali dalam keadaan "Belum ada data." belum punya elemen
// buat di-observe, dan pas datanya datang (ganti conference) komponennya
// nggak di-remount — observer harus nyambung ulang begitu elemennya muncul.
// `ref` (objek) tetap dibalikin buat yang perlu baca posisi elemen.
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [node, setNode] = useState<T | null>(null)
  const [width, setWidth] = useState(0)
  const setRef = useCallback((el: T | null) => {
    ref.current = el
    setNode(el)
  }, [])
  useEffect(() => {
    if (!node || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidth(Math.round(w))
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [node])
  return [setRef, width, ref] as const
}

// Tick sumbu "bulat" (0, 5, 10 / 0, 250 rb, 500 rb ...). integer = data
// hitungan (jumlah paper/akun) — step minimal 1, nggak ada tick 0,5 paper.
export function niceTicks(max: number, count = 4, integer = false): number[] {
  // Semua nol: cukup garis dasar 0, skala atas diurus pemanggil
  if (!(max > 0)) return [0]
  const raw = max / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step0 = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow
  const step = integer ? Math.max(1, Math.ceil(step0)) : step0
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  return ticks
}
