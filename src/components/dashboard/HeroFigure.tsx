import type { ReactNode } from 'react'

interface HeroFigureProps {
  label: string
  value: string
  title?: string
  children?: ReactNode
}

// Angka utama satu halaman (cuma SATU per tampilan). Font sans yang sama
// dengan teks lain, ukuran ngecil di HP biar Rp miliaran tetap muat tanpa
// kepotong; >=48px mulai layar sedang.
export function HeroFigure({ label, value, title, children }: HeroFigureProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h2>
      <p
        className="mt-1 font-semibold leading-tight text-gray-900 dark:text-gray-50"
        style={{ fontSize: 'clamp(1.75rem, 7vw, 3.25rem)' }}
        title={title}
      >
        {value}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}
