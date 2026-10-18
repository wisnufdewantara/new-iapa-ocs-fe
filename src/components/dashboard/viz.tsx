import type { ReactNode } from 'react'
import { fillOf, inkOn, paymentStatusMeta, type StatusIconKind, type VizColor } from './vizTokens'

// Ikon kecil pendamping warna status — status nggak boleh dibaca dari
// warna doang (buta warna, cetak hitam-putih), jadi selalu ada bentuk +
// label teks di sebelahnya.
export function StatusIcon({ kind, className = 'h-3.5 w-3.5' }: { kind: StatusIconKind; className?: string }) {
  const color: VizColor = kind === 'other' ? 'neutral-2' : kind
  return (
    <svg viewBox="0 0 16 16" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill={fillOf(color)} />
      <g stroke={inkOn(color)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {kind === 'good' && <path d="M4.5 8.3l2.3 2.2 4.7-4.8" />}
        {kind === 'warning' && <path d="M8 4.5V8l2.2 1.6" />}
        {kind === 'serious' && <path d="M8 4.3v4.4M8 11.4v.1" />}
        {kind === 'critical' && <path d="M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2" />}
        {kind === 'neutral' && <path d="M4.8 8h6.4" />}
        {kind === 'other' && <path d="M6.3 6.2a1.8 1.8 0 113 1.4c-.8.5-1.3.9-1.3 1.8M8 11.5v.1" />}
      </g>
    </svg>
  )
}

export function StatusLabel({ status, label }: { status: string | null; label?: string }) {
  const meta = paymentStatusMeta(status)
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <StatusIcon kind={meta.icon} />
      {label ?? meta.label}
    </span>
  )
}

// Tooltip grafik — konten dirender React (teks otomatis di-escape), bukan
// innerHTML, karena label (nama afiliasi, sub tema, dst) datang dari input
// user. Posisi x dijepit ke tepi container biar nggak kepotong di HP.
export function ChartTooltip({
  x,
  y,
  containerWidth,
  children,
}: {
  x: number
  y: number
  containerWidth: number
  children: ReactNode
}) {
  const edge = 96
  const transform =
    x < edge
      ? 'translate(-8px, -100%)'
      : x > containerWidth - edge
        ? 'translate(calc(-100% + 8px), -100%)'
        : 'translate(-50%, -100%)'
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-10 max-w-[15rem] rounded-md border px-2.5 py-1.5 text-xs shadow-md"
      style={{
        left: x,
        top: y - 8,
        transform,
        background: 'var(--viz-tooltip-bg)',
        borderColor: 'var(--viz-tooltip-border)',
        color: 'var(--viz-ink-2)',
      }}
    >
      {children}
    </div>
  )
}

// Baris tooltip: nilai duluan (tebal, kontras tinggi), nama seri
// belakangan — pembaca udah tahu serinya, yang dicari angkanya. Kunci
// seri pakai garis pendek, bukan kotak.
export function TooltipRow({ color, value, label }: { color?: VizColor; value: ReactNode; label: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      {color && <span className="inline-block h-0.5 w-3 shrink-0 rounded-full" style={{ background: fillOf(color) }} />}
      <span className="font-semibold tabular-nums" style={{ color: 'var(--viz-ink)' }}>
        {value}
      </span>
      <span className="truncate">{label}</span>
    </div>
  )
}

// Swatch legenda: kotak buat batang (bentuknya ngikutin mark-nya).
export function LegendSwatch({ color }: { color: VizColor }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: fillOf(color) }} />
}

// Teks khusus pembaca layar (pengumuman titik aktif grafik, dsb).
export function SrOnly({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return (
    <span className="sr-only" aria-live={live ? 'polite' : undefined}>
      {children}
    </span>
  )
}
