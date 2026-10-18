import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { StatusIcon } from './viz'
import type { StatusIconKind } from './vizTokens'
import { OutlineIcon, type OutlineIconName } from '../OutlineIcon'

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
  // Ilustrasi garis oranye besar di kanan — murni hiasan (aria-hidden),
  // maknanya udah dibawa label di strip atas.
  illustration?: OutlineIconName
  // Kalau diisi, seluruh tile jadi link (mis. ke halaman tindak lanjut)
  to?: string
  muted?: boolean
}

// Tile angka tunggal (pengganti StatCard/Card lokal yang dulu disalin per
// halaman). Gaya rilis 1.0: strip judul navy (label putih + ikon status),
// badan putih dengan angka warna navy, ilustrasi oranye di kanan. Nilai
// pakai angka proporsional, bukan tabular-nums — angka besar yang berdiri
// sendiri kelihatan renggang kalau tabular.
export function StatTile({ label, value, title, sub, hint, icon, illustration, to, muted }: StatTileProps) {
  const body = (
    <>
      <p className="flex min-h-9 items-center gap-1.5 bg-iapa-navy px-3 py-2 text-xs leading-tight font-semibold text-white sm:px-4 dark:border-b dark:border-white/10 dark:bg-iapa-navy-deep">
        {/* Pelat putih di belakang ikon status: fill "terkumpul" = navy,
            bakal hilang kalau ditaruh polos di strip navy */}
        {icon && (
          <span className="inline-flex shrink-0 rounded-full bg-white p-[1.5px]">
            <StatusIcon kind={icon} />
          </span>
        )}
        <span className="min-w-0">{label}</span>
      </p>
      <div className="flex flex-1 items-start gap-2 px-3 pt-3 pb-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xl leading-tight font-bold break-words sm:text-2xl ${
              muted ? 'text-gray-400 dark:text-gray-500' : 'text-iapa-navy dark:text-slate-50'
            }`}
            title={title}
          >
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{sub}</p>}
        </div>
        {illustration && (
          <OutlineIcon
            name={illustration}
            strokeWidth={1.25}
            className={`h-8 w-8 sm:h-11 sm:w-11 ${muted ? 'text-iapa-orange/40' : 'text-iapa-orange'}`}
          />
        )}
      </div>
      {hint && <p className="-mt-1 px-3 pb-3 text-xs text-gray-500 sm:px-4 dark:text-gray-400">{hint}</p>}
    </>
  )
  const cls =
    'flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-brand-dark-surface'
  if (to) {
    return (
      <Link
        to={to}
        className={`${cls} transition hover:border-iapa-navy/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iapa-navy dark:hover:border-iapa-navy-light/50 dark:focus-visible:outline-iapa-navy-light`}
      >
        {body}
      </Link>
    )
  }
  return <div className={cls}>{body}</div>
}
