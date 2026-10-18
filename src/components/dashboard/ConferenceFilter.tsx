import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'

interface Conference {
  conference_id: string
  conference_name: string
}

interface ConferenceFilterProps {
  value: string
  onChange: (id: string) => void
  updatedAt?: string | null
}

// Satu baris filter di atas konten dashboard — semua tile, grafik, dan
// tabel di bawahnya ikut satu pilihan ini (nggak ada filter per grafik),
// jadi angkanya selalu nyambung satu sama lain.
export function ConferenceFilter({ value, onChange, updatedAt }: ConferenceFilterProps) {
  const id = useId()
  // Key ['conferences'] sama dengan halaman lain biar cache-nya dipakai bareng
  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  return (
    <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-2">
      <div className="w-full max-w-md">
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Conference
        </label>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
        >
          <option value="">Semua conference</option>
          {conferences?.map((c) => (
            <option key={c.conference_id} value={c.conference_id}>
              {c.conference_name}
            </option>
          ))}
        </select>
      </div>
      {updatedAt && (
        <p className="pb-2 text-xs text-gray-500 dark:text-gray-400">
          Data per{' '}
          {new Date(updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      )}
    </div>
  )
}
