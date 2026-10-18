import { useState } from 'react'
import { ChartTooltip, LegendSwatch, StatusIcon, TooltipRow } from './viz'
import { fillOf, inkOn, useElementWidth, type StatusIconKind, type VizColor } from './vizTokens'
import { percent } from '../../lib/format'

export interface StackSeries {
  key: string
  label: string
  color: VizColor
  // Seri status (lunas/ditolak/dst) wajib bawa ikon — warna status nggak
  // boleh jadi satu-satunya pembeda.
  icon?: StatusIconKind
}

export interface StackRow {
  key: string
  label: string
  values: number[] // urutan sama dengan series
}

interface StackedBarProps {
  series: StackSeries[]
  rows: StackRow[]
  // share = tiap baris 100% (komposisi); absolute = panjang baris
  // sebanding totalnya (bandingkan besar + komposisi sekaligus)
  scale: 'share' | 'absolute'
  formatValue: (n: number) => string
  // Total per seri di legenda (mis. jumlah semua baris)
  legendTotals?: boolean
  emptyMessage?: string
}

const BAR_H = 20
const GAP = 2

// Batang bertumpuk horizontal buat bagian-dari-keseluruhan (status bayar,
// keputusan per sub tema). Antar segmen ada celah 2px warna kartu (bukan
// garis tepi), legenda selalu tampil, angka di dalam segmen cuma kalau
// muat — sisanya lewat tooltip & tabel.
export function StackedBar({
  series,
  rows,
  scale,
  formatValue,
  legendTotals = false,
  emptyMessage = 'Belum ada data.',
}: StackedBarProps) {
  const [setRef, width, ref] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<{ row: number; seg: number | null; x: number; y: number } | null>(null)

  const totals = rows.map((r) => r.values.reduce((a, b) => a + b, 0))
  const maxTotal = Math.max(0, ...totals)
  const seriesTotals = series.map((_, si) => rows.reduce((a, r) => a + (r.values[si] ?? 0), 0))

  if (rows.length === 0 || maxTotal === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
  }

  const placeFrom = (row: number, seg: number | null, el: HTMLElement) => {
    const box = ref.current
    if (!box) return
    const b = box.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    setActive({ row, seg, x: r.left + r.width / 2 - b.left, y: r.top - b.top })
  }

  return (
    <div ref={setRef} className="relative">
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300" aria-label="Legenda">
        {series.map((s, si) => (
          <li key={s.key} className="flex items-center gap-1.5">
            {s.icon ? <StatusIcon kind={s.icon} /> : <LegendSwatch color={s.color} />}
            <span>{s.label}</span>
            {legendTotals && (
              <span className="font-medium tabular-nums text-gray-800 dark:text-gray-100">
                {formatValue(seriesTotals[si])}
              </span>
            )}
          </li>
        ))}
      </ul>

      <ul className="flex flex-col gap-3">
        {rows.map((row, ri) => {
          const total = totals[ri]
          const rowFrac = scale === 'absolute' ? total / maxTotal : 1
          const barPx = width * rowFrac
          const visible = series
            .map((s, si) => ({ s, si, v: row.values[si] ?? 0 }))
            .filter((x) => x.v > 0)
          return (
            <li
              key={row.key}
              tabIndex={0}
              className="rounded outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/50 dark:focus-visible:ring-brand-orange/60"
              aria-label={`${row.label}: total ${formatValue(total)}. ${series
                .map((s, si) => `${s.label} ${formatValue(row.values[si] ?? 0)}`)
                .join(', ')}`}
              onFocus={(e) => {
                const bar = e.currentTarget.querySelector<HTMLElement>('[data-bar]')
                if (bar) placeFrom(ri, null, bar)
              }}
              onBlur={() => setActive(null)}
            >
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate text-gray-700 dark:text-gray-300" title={row.label}>
                  {row.label}
                </span>
                <span className="shrink-0 font-medium tabular-nums text-gray-800 dark:text-gray-100">
                  {formatValue(total)}
                </span>
              </div>
              <div
                data-bar
                className="flex"
                style={{ width: `${rowFrac * 100}%`, minWidth: total > 0 ? 4 : 0, height: BAR_H, gap: GAP }}
                onPointerLeave={() => setActive(null)}
              >
                {visible.map(({ s, si, v }, idx) => {
                  const segPx = total > 0 ? (barPx - GAP * (visible.length - 1)) * (v / total) : 0
                  const text = percent(total > 0 ? v / total : 0, 0)
                  // Perkiraan lebar teks 12px ≈ 7px/karakter + padding kiri-kanan
                  const fits = segPx >= text.length * 7 + 12
                  const last = idx === visible.length - 1
                  const isActive = active?.row === ri && active.seg === si
                  return (
                    <div
                      key={s.key}
                      className="flex min-w-[2px] items-center justify-center text-[11px] font-semibold tabular-nums"
                      style={{
                        flexGrow: v,
                        flexBasis: 0,
                        background: fillOf(s.color),
                        color: inkOn(s.color),
                        borderRadius: last ? '0 4px 4px 0' : undefined,
                        filter: isActive ? 'brightness(1.12)' : undefined,
                      }}
                      onPointerEnter={(e) => placeFrom(ri, si, e.currentTarget)}
                    >
                      {fits ? text : null}
                    </div>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>

      {active && rows[active.row] && (
        <ChartTooltip x={active.x} y={active.y} containerWidth={width}>
          <div className="mb-0.5 font-medium" style={{ color: 'var(--viz-ink)' }}>
            {rows[active.row].label}
          </div>
          {series.map((s, si) => {
            if (active.seg != null && active.seg !== si) return null
            const v = rows[active.row].values[si] ?? 0
            const t = totals[active.row]
            return (
              <TooltipRow
                key={s.key}
                color={s.color}
                value={formatValue(v)}
                label={`${s.label} · ${percent(t > 0 ? v / t : 0)}`}
              />
            )
          })}
        </ChartTooltip>
      )}
    </div>
  )
}
