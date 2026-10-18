import { fillOf, type VizColor } from './vizTokens'

interface MeterProps {
  // Rasio 0..1 (di luar itu dijepit)
  value: number
  label: string
  color?: VizColor
  // Warna track (bagian kosong) — default: warna isi yang diencerkan.
  // Hero "dana terkumpul" sengaja pakai track oranye muda (brand IAPA).
  trackColor?: string
  className?: string
}

// Meter rasio tunggal (bukan pie 2 irisan). Track-nya warna yang SAMA
// tapi diencerkan ke warna kartu — jadi satu batang kebaca utuh sebagai
// "x dari total", bukan dua warna yang bersaing.
export function Meter({ value, label, color = 's1', trackColor, className = 'h-2' }: MeterProps) {
  const v = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
  const fill = fillOf(color)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={`w-full overflow-hidden rounded ${className}`}
      style={{ background: trackColor ?? `color-mix(in srgb, ${fill} 20%, var(--viz-surface))` }}
    >
      <div className="h-full rounded" style={{ width: `${v * 100}%`, background: fill }} />
    </div>
  )
}
