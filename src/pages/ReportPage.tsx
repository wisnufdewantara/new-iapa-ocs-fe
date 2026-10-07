import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastError } from '../lib/toast'

interface Conference {
  conference_id: string
  conference_name: string
}

interface ReportColumn {
  key: string
  label: string
}

interface ReportColumns {
  papers: ReportColumn[]
  payments: ReportColumn[]
  participants: ReportColumn[]
}

type ReportKey = keyof ReportColumns
type Format = 'csv' | 'xlsx'

const REPORTS: { key: ReportKey; label: string; desc: string; path: string }[] = [
  {
    key: 'papers',
    label: 'Rekap Paper',
    desc: 'Daftar paper beserta status review, penulis, dan email per conference.',
    path: '/report/papers/csv',
  },
  {
    key: 'payments',
    label: 'Rekap Keuangan',
    desc: 'Daftar invoice presenter & peserta beserta nominal dan status member.',
    path: '/report/payments/csv',
  },
  {
    key: 'participants',
    label: 'Rekap Peserta',
    desc: 'Daftar peserta yang join sebuah conference.',
    path: '/report/participants/csv',
  },
]

function ReportCard({
  report,
  columns,
  conferenceId,
}: {
  report: (typeof REPORTS)[number]
  columns: ReportColumn[]
  conferenceId: string
}) {
  const [showColumns, setShowColumns] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [format, setFormat] = useState<Format>('csv')
  const [downloading, setDownloading] = useState(false)

  // Default semua kolom tercentang begitu daftar kolomnya kebaca dari API.
  useEffect(() => {
    setSelected(new Set(columns.map((c) => c.key)))
  }, [columns])

  const toggleColumn = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(columns.map((c) => c.key)))
  const selectNone = () => setSelected(new Set())

  const handleDownload = async () => {
    if (selected.size === 0) {
      toast.error('Pilih minimal 1 kolom dulu.')
      return
    }
    setDownloading(true)
    try {
      const response = await api.get(report.path, {
        params: { conferenceId, columns: Array.from(selected).join(','), format },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      let filename = `${report.label.replace(/ /g, '_')}.${format}`
      const contentDisposition = response.headers['content-disposition']
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match && match.length === 2) filename = match[1]
      }
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toastError(err, `Gagal mengunduh ${report.label}.`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10 dark:bg-brand-dark-surface">
      <h2 className="mb-1 font-semibold text-gray-800 dark:text-gray-100">{report.label}</h2>
      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{report.desc}</p>

      <button
        onClick={() => setShowColumns((v) => !v)}
        className="mb-2 text-xs font-medium text-brand-navy hover:underline dark:text-brand-orange"
      >
        {showColumns ? 'Sembunyikan' : 'Pilih'} kolom & format {showColumns ? '▲' : '▼'}
      </button>

      {showColumns && (
        <div className="mb-3 rounded-md border border-gray-200 p-3 dark:border-white/10">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Kolom ({selected.size}/{columns.length})
            </p>
            <div className="flex gap-2 text-xs">
              <button onClick={selectAll} className="text-brand-navy hover:underline dark:text-brand-orange">
                Pilih Semua
              </button>
              <button onClick={selectNone} className="text-gray-400 hover:underline dark:text-gray-500">
                Kosongkan
              </button>
            </div>
          </div>
          <div className="mb-3 grid max-h-40 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
            {columns.map((c) => (
              <label key={c.key} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={selected.has(c.key)} onChange={() => toggleColumn(c.key)} />
                {c.label}
              </label>
            ))}
          </div>

          <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">Format</p>
          <div className="flex gap-4 text-xs text-gray-700 dark:text-gray-300">
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={format === 'csv'} onChange={() => setFormat('csv')} /> CSV
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} /> Excel (.xlsx)
            </label>
          </div>
        </div>
      )}

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="rounded-md bg-brand-navy px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50 dark:bg-brand-orange"
      >
        {downloading ? 'Mengunduh...' : `Download ${format.toUpperCase()}`}
      </button>
    </div>
  )
}

export function ReportPage() {
  usePageTitle('Download Laporan')
  const [conferenceId, setConferenceId] = useState('')

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const { data: reportColumns, isLoading: columnsLoading } = useQuery({
    queryKey: ['report-columns'],
    queryFn: async () => (await api.get<ReportColumns>('/report/columns')).data,
  })

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-800 dark:text-gray-100">Download Laporan</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Export rekap paper dan keuangan — pilih kolom yang mau ditampilkan dan format file (CSV atau Excel).
      </p>

      <div className="mb-6 max-w-md">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Pilih Conference (opsional)
        </label>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          value={conferenceId}
          onChange={(e) => setConferenceId(e.target.value)}
        >
          <option value="">-- semua conference --</option>
          {conferences?.map((c) => (
            <option key={c.conference_id} value={c.conference_id}>
              {c.conference_name}
            </option>
          ))}
        </select>
      </div>

      {columnsLoading || !reportColumns ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map((r) => (
            <ReportCard key={r.key} report={r} columns={reportColumns[r.key]} conferenceId={conferenceId} />
          ))}
        </div>
      )}
    </div>
  )
}
