import type { ReactNode } from 'react'

interface HeroFigureProps {
  label: string
  value: string
  title?: string
  children?: ReactNode
}

// Angka utama satu halaman (cuma SATU per tampilan). Font sans yang sama
// dengan teks lain, ukuran ngecil di HP biar Rp miliaran tetap muat tanpa
// kepotong; >=48px mulai layar sedang. Gaya rilis 1.0: bingkai navy tipis,
// angka oranye — di mode terang pakai oranye yang lebih gelap
// (iapa-orange-ink, 3.9:1 di putih) karena #f28c08 cuma 2.5:1; di mode
// gelap oranye asli udah 6.2:1 di kartu navy.
export function HeroFigure({ label, value, title, children }: HeroFigureProps) {
  return (
    <section className="rounded-lg border-[1.5px] border-iapa-navy bg-white p-5 shadow-sm sm:p-6 dark:border-iapa-navy-light/45 dark:bg-brand-dark-surface">
      <h2 className="text-sm font-semibold text-iapa-navy dark:text-slate-200">{label}</h2>
      <p
        className="mt-1 leading-tight font-bold text-iapa-orange-ink dark:text-iapa-orange"
        style={{ fontSize: 'clamp(1.75rem, 7vw, 3.25rem)' }}
        title={title}
      >
        {value}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}
