import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastError } from '../lib/toast'

interface Conference {
  conference_id: string
  conference_name: string
}

const REPORTS = [
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
] as const

export function ReportPage() {
  usePageTitle('Download Laporan')
  const [conferenceId, setConferenceId] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const handleDownload = async (path: string, key: string, label: string) => {
    setDownloading(key)
    try {
      const response = await api.get(path, { params: { conferenceId }, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      let filename = `${label.replace(/ /g, '_')}.csv`
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
      toastError(err, `Gagal mengunduh ${label}.`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-800 dark:text-gray-100">Download Laporan</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Export rekap paper dan keuangan dalam format CSV (bisa dibuka di Excel/Google Sheets).
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <div
            key={r.key}
            className="rounded-lg border border-gray-200 p-4 dark:border-white/10 dark:bg-brand-dark-surface"
          >
            <h2 className="mb-1 font-semibold text-gray-800 dark:text-gray-100">{r.label}</h2>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{r.desc}</p>
            <button
              onClick={() => handleDownload(r.path, r.key, r.label)}
              disabled={downloading === r.key}
              className="rounded-md bg-brand-navy px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50 dark:bg-brand-orange"
            >
              {downloading === r.key ? 'Mengunduh...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
