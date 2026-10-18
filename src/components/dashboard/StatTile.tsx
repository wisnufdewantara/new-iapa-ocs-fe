import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { StatusIcon } from './viz'
import type { StatusIconKind } from './vizTokens'

interface StatTileProps {
  label: string
  value: string
  // Nilai lengkap buat atribut title — dipakai kalau value ditampilkan
  // ringkas (Rp1,25 jt) biar angka persisnya tetap bisa dilihat.
  title?: string
  sub?: ReactNode
  hint?: ReactNode
  // Ikon status di sebelah label — status selalu ikon + teks, bukan warna doang
  icon?: StatusIconKind
  // Kalau diisi, seluruh tile jadi link (mis. ke halaman tindak lanjut)
  to?: string
  muted?: boolean
}

// Tile angka tunggal (pengganti StatCard/Card lokal yang dulu disalin per
// halaman). Nilai pakai angka proporsional, bukan tabular-nums — angka
// besar yang berdiri sendiri kelihatan renggang kalau tabular.
export function StatTile({ label, value, title, sub, hint, icon, to, muted }: StatTileProps) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        {icon && <StatusIcon kind={icon} />}
        <span>{label}</span>
      </p>
      <p
        className={`mt-1 text-2xl font-semibold break-words ${
          muted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'
        }`}
        title={title}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">{sub}</p>}
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </>
  )
  const cls =
    'block min-w-0 rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-brand-dark-surface'
  if (to) {
    return (
      <Link
        to={to}
        className={`${cls} transition-colors hover:border-brand-navy/40 focus-visible:outline-2 focus-visible:outline-brand-navy dark:hover:border-brand-orange/40 dark:focus-visible:outline-brand-orange`}
      >
        {body}
      </Link>
    )
  }
  return <div className={cls}>{body}</div>
}
