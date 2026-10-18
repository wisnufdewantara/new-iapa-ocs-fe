import { useId, useState, type ReactNode } from 'react'

export interface TableTwin {
  columns: { label: string; numeric?: boolean }[]
  rows: { key: string; cells: ReactNode[] }[]
}

interface ChartCardProps {
  title: string
  caption?: ReactNode
  // Kembaran tabel grafik — wajib ada buat tiap grafik, biar semua angka
  // bisa dibaca tanpa hover dan tanpa ngandelin warna.
  table?: TableTwin
  children: ReactNode
  footer?: ReactNode
  className?: string
}

// Wadah grafik: judul, keterangan, dan tombol "Lihat tabel" yang nukar
// grafik dengan <table> biasa (versi aksesibel). Tinggi ngikutin isi,
// bukan fixed, jadi label sumbu nggak bikin scroll dalam kartu.
export function ChartCard({ title, caption, table, children, footer, className = '' }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false)
  const id = useId()
  return (
    <section
      className={`min-w-0 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-brand-dark-surface ${className}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h2>
          {caption && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{caption}</p>}
        </div>
        {table && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-pressed={showTable}
            aria-controls={`${id}-body`}
            onClick={() => setShowTable((v) => !v)}
          >
            {showTable ? 'Lihat grafik' : 'Lihat tabel'}
          </button>
        )}
      </div>
      <div id={`${id}-body`}>{showTable && table ? <DataTwin title={title} table={table} /> : children}</div>
      {footer && <div className="mt-3">{footer}</div>}
    </section>
  )
}

function DataTwin({ title, table }: { title: string; table: TableTwin }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr className="border-b border-gray-200 dark:border-white/10">
            {table.columns.map((c) => (
              <th
                key={c.label}
                scope="col"
                className={`px-2 py-2 font-medium text-gray-500 dark:text-gray-400 ${c.numeric ? 'text-right' : 'text-left'}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.length === 0 && (
            <tr>
              <td colSpan={table.columns.length} className="px-2 py-3 text-gray-500 dark:text-gray-400">
                Belum ada data.
              </td>
            </tr>
          )}
          {table.rows.map((r) => (
            <tr key={r.key} className="border-b border-gray-100 last:border-0 dark:border-white/5">
              {r.cells.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-2 py-1.5 text-left font-normal text-gray-700 dark:text-gray-300">
                    {cell}
                  </th>
                ) : (
                  <td
                    key={i}
                    className={`px-2 py-1.5 text-gray-700 dark:text-gray-300 ${
                      table.columns[i]?.numeric ? 'text-right tabular-nums whitespace-nowrap' : ''
                    }`}
                  >
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
