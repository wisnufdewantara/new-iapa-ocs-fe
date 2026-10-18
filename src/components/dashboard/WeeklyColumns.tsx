import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { ChartTooltip, SrOnly, TooltipRow } from './viz'
import { fillOf, niceTicks, useElementWidth, type VizColor } from './vizTokens'

export interface WeekPoint {
  key: string
  axisLabel: string // label pendek di sumbu ("5 Okt")
  fullLabel: string // label lengkap di tooltip ("Minggu 5 Okt 2026")
  value: number
  extra?: ReactNode // baris tambahan di tooltip (mis. jumlah transaksi)
}

interface WeeklyColumnsProps {
  points: WeekPoint[]
  formatValue: (n: number) => string
  formatTick: (n: number) => string
  ariaLabel: string
  stepLabel?: string // satuan langkah panah kiri/kanan ("minggu" / "bulan")
  valueLabel: string
  integer?: boolean
  color?: VizColor
  plotHeight?: number
}

const M = { top: 12, right: 16, bottom: 24 }

// Kolom per minggu (satu seri, satu sumbu — dua ukuran beda skala = dua
// grafik, bukan dual axis). Hover/fokus keyboard: garis bantu vertikal
// nempel ke minggu terdekat + tooltip; panah kiri/kanan buat jalan antar
// minggu. Tinggi SVG udah termasuk pita label sumbu X, jadi kartu nggak
// pernah dapat scroll vertikal sendiri.
export function WeeklyColumns({
  points,
  formatValue,
  formatTick,
  ariaLabel,
  stepLabel = 'minggu',
  valueLabel,
  integer = false,
  color = 's1',
  plotHeight = 170,
}: WeeklyColumnsProps) {
  const [setRef, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  if (points.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada data.</p>
  }

  const max = Math.max(0, ...points.map((p) => p.value))
  const ticks = niceTicks(max, 4, integer)
  const top = ticks[ticks.length - 1] || 1
  const tickLabels = ticks.map(formatTick)
  // Lebar kolom label sumbu Y dari tick terpanjang (≈6.5px/karakter di 11px)
  const left = Math.max(...tickLabels.map((t) => t.length)) * 6.5 + 10
  const plotW = Math.max(0, width - left - M.right)
  const n = points.length
  const band = n > 0 ? plotW / n : 0
  // Kolom nggak boleh lebih lebar dari slotnya dikurangi celah 2px —
  // kalau minggunya banyak banget, batang lebih baik tipis daripada
  // numpuk jadi satu blok tanpa celah.
  const barW = Math.min(24, band * 0.62, Math.max(1, band - 2))
  const y = (v: number) => M.top + plotHeight - (v / top) * plotHeight
  const cx = (i: number) => left + band * (i + 0.5)
  // Label sumbu X jarang-jarang biar nggak tabrakan (min. 48px per label,
  // lebih lebar kalau labelnya pakai tahun); dihitung dari minggu terakhir
  // ke belakang supaya minggu terbaru selalu kebagian label.
  const labelW = Math.max(48, Math.max(...points.map((p) => p.axisLabel.length)) * 6 + 12)
  const every = Math.max(1, Math.ceil((n * labelW) / Math.max(1, plotW)))
  const H = M.top + plotHeight + M.bottom

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left - left
    if (band <= 0) return
    setActive(Math.min(n - 1, Math.max(0, Math.floor(x / band))))
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = active ?? n - 1
    let next: number | null = null
    if (e.key === 'ArrowRight') next = Math.min(n - 1, cur + 1)
    else if (e.key === 'ArrowLeft') next = Math.max(0, cur - 1)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    else if (e.key === 'Escape') {
      setActive(null)
      return
    }
    if (next != null) {
      e.preventDefault()
      setActive(next)
    }
  }

  const a = active != null ? points[active] : null

  return (
    <div
      ref={setRef}
      className="relative rounded outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/50 dark:focus-visible:ring-brand-orange/60"
      tabIndex={0}
      role="group"
      aria-label={`${ariaLabel}. Pakai panah kiri/kanan buat menelusuri per ${stepLabel}.`}
      onKeyDown={onKey}
      onFocus={() => setActive((v) => v ?? n - 1)}
      onBlur={() => setActive(null)}
    >
      {width > 0 && (
        <svg
          width={width}
          height={H}
          className="block select-none"
          style={{ overflow: 'visible' }}
          aria-hidden="true"
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
        >
          {/* Grid horizontal: garis tipis solid, satu tingkat dari warna kartu */}
          {ticks.map((t, i) => (
            <g key={t}>
              <line
                x1={left}
                x2={left + plotW}
                y1={y(t)}
                y2={y(t)}
                stroke={i === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize={11}
                fill="var(--viz-muted)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {tickLabels[i]}
              </text>
            </g>
          ))}

          {active != null && (
            <line
              x1={cx(active)}
              x2={cx(active)}
              y1={M.top}
              y2={M.top + plotHeight}
              stroke="var(--viz-axis)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          )}

          {points.map((p, i) => {
            if (p.value <= 0) return null
            const h = Math.max(1, (p.value / top) * plotHeight)
            const x0 = cx(i) - barW / 2
            const y0 = M.top + plotHeight - h
            const r = Math.min(4, barW / 2, h)
            // Ujung atas membulat 4px, pangkal di garis dasar tetap kotak
            const d = `M${x0},${M.top + plotHeight}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + barW - r}Q${x0 + barW},${y0} ${x0 + barW},${y0 + r}V${M.top + plotHeight}Z`
            return (
              <path
                key={p.key}
                d={d}
                fill={fillOf(color)}
                style={{ filter: active === i ? 'brightness(1.12)' : undefined }}
              />
            )
          })}

          {points.map((p, i) =>
            (n - 1 - i) % every === 0 ? (
              <text
                key={p.key}
                x={cx(i)}
                y={M.top + plotHeight + 16}
                textAnchor="middle"
                fontSize={11}
                fill="var(--viz-muted)"
              >
                {p.axisLabel}
              </text>
            ) : null,
          )}
        </svg>
      )}
      {width === 0 && <div style={{ height: H }} />}

      {a && active != null && (
        <ChartTooltip x={cx(active)} y={Math.min(y(a.value), M.top + plotHeight - 4)} containerWidth={width}>
          <div className="mb-0.5 font-medium" style={{ color: 'var(--viz-ink)' }}>
            {a.fullLabel}
          </div>
          <TooltipRow color={color} value={formatValue(a.value)} label={valueLabel} />
          {a.extra && <div className="mt-0.5">{a.extra}</div>}
        </ChartTooltip>
      )}
      <SrOnly live>{a ? `${a.fullLabel}: ${formatValue(a.value)} ${valueLabel}` : ''}</SrOnly>
    </div>
  )
}
