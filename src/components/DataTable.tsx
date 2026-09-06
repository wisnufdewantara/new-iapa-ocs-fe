import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'

const PAGE_SIZE_OPTIONS = [50, 100, 200] as const

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  searchPlaceholder?: string
  emptyMessage?: string
}

// Komponen tabel generik dipakai di semua halaman list (Conference,
// Schedule, Attendance, Review Paper, dst) — sort per kolom, filter teks
// global, dan pagination dengan pilihan ukuran halaman/"Semua". Dibuat
// sekali di sini biar nggak perlu diulang manual di tiap halaman.
export function DataTable<T>({ columns, data, searchPlaceholder, emptyMessage }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pageSizeOption, setPageSizeOption] = useState<number | 'all'>(50)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: { pageIndex: 0, pageSize: pageSizeOption === 'all' ? Math.max(data.length, 1) : pageSizeOption },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const totalRows = table.getFilteredRowModel().rows.length
  const pageRows = table.getRowModel().rows
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <input
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value)
            table.setPageIndex(0)
          }}
          placeholder={searchPlaceholder ?? 'Cari...'}
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Tampilkan</span>
          <select
            value={pageSizeOption}
            onChange={(e) => {
              setPageSizeOption(e.target.value === 'all' ? 'all' : Number(e.target.value))
              table.setPageIndex(0)
            }}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="all">Semua</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-4 py-3 text-left font-medium text-gray-500 ${
                      header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: '▲', desc: '▼' }[header.column.getIsSorted() as string] ?? null}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                  {emptyMessage ?? 'Tidak ada data.'}
                </td>
              </tr>
            )}
            {pageRows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalRows > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
          <span>
            Menampilkan {from}–{to} dari {totalRows}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
