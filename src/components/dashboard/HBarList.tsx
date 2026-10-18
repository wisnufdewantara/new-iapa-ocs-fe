import { useRef, useState, type FocusEvent, type PointerEvent } from 'react'
import { ChartTooltip, TooltipRow } from './viz'
import { fillOf, useElementWidth, type VizColor } from './vizTokens'

export interface HBarItem {
  key: string
  label: string
  value: number
}

interface HBarListProps {
  items: HBarItem[]
  formatValue: (n: number) => string
  // Satu seri = satu warna buat semua batang (bukan gelap-terang per
  // ranking — panjang batang udah nunjukin besarnya).
  color?: VizColor
  // Ruang di kanan buat angka di ujung batang
  valueWidth?: string
  unitLabel?: string
  emptyMessage?: string
}

// Daftar batang horizontal (afiliasi, negara, tipe paper, role). Label di
// atas batang, bukan di kiri, biar nama panjang tetap kebaca di HP. Batang
// tipis 12px, ujung data membulat 4px, pangkal kotak di garis dasar.
export function HBarList({
  items,
  formatValue,
  color = 's1',
  valueWidth = '4.5rem',
  unitLabel,
  emptyMessage = 'Belum ada data.',
}: HBarListProps) {
  const [setRef, width, ref] = useElementWidth<HTMLUListElement>()
  const [active, setActive] = useState<{ i: number; x: number; y: number } | null>(null)
  const focused = useRef<number | null>(null)
  const max = Math.max(0, ...items.map((i) => i.value))

  if (items.length === 0) return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>

  const place = (i: number, row: HTMLElement) => {
    const list = ref.current
    const bar = row.querySelector<HTMLElement>('[data-bar]')
    if (!list || !bar) return
    const lr = list.getBoundingClientRect()
    const br = bar.getBoundingClientRect()
    setActive({ i, x: br.right - lr.left, y: br.top - lr.top })
  }

  return (
    <ul ref={setRef} className="relative flex flex-col gap-2.5">
      {items.map((item, i) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0
        return (
          <li
            key={item.key}
            tabIndex={0}
            aria-label={`${item.label}: ${formatValue(item.value)}${unitLabel ? ` ${unitLabel}` : ''}`}
            className="rounded outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/50 dark:focus-visible:ring-brand-orange/60"
            onPointerEnter={(e: PointerEvent<HTMLLIElement>) => place(i, e.currentTarget)}
            onPointerLeave={() => {
              // Baris yang lagi difokus keyboard tetap pegang tooltip-nya
              if (focused.current == null) setActive(null)
            }}
            onFocus={(e: FocusEvent<HTMLLIElement>) => {
              focused.current = i
              place(i, e.currentTarget)
            }}
            onBlur={() => {
              focused.current = null
              setActive(null)
            }}
          >
            <p className="truncate text-xs text-gray-700 dark:text-gray-300" title={item.label}>
              {item.label}
            </p>
            <div className="mt-1" style={{ paddingRight: valueWidth }}>
              <div className="relative h-3">
                <div
                  data-bar
                  className="h-full transition-[filter]"
                  style={{
                    width: `${pct}%`,
                    minWidth: item.value > 0 ? 2 : 0,
                    borderRadius: '0 4px 4px 0',
                    background: fillOf(color),
                    filter: active?.i === i ? 'brightness(1.12)' : undefined,
                  }}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 text-xs font-medium whitespace-nowrap tabular-nums"
                  style={{ left: `calc(${pct}% + 6px)`, color: 'var(--viz-ink-2)' }}
                >
                  {formatValue(item.value)}
                </span>
              </div>
            </div>
          </li>
        )
      })}
      {active && items[active.i] && (
        <ChartTooltip x={active.x} y={active.y} containerWidth={width}>
          <TooltipRow
            color={color}
            value={formatValue(items[active.i].value)}
            label={unitLabel ?? ''}
          />
          <div className="mt-0.5 whitespace-normal break-words">{items[active.i].label}</div>
        </ChartTooltip>
      )}
    </ul>
  )
}
