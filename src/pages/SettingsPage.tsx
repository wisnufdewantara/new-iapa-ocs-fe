import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/axios'

interface Setting {
  setting_key: string
  label: string | null
  description: string | null
  setting_value: string | null
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Setting[]>('/settings')).data,
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => api.put(`/settings/${key}`, { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  })

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Pengaturan</h1>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>}

      <div className="flex flex-col gap-4">
        {data?.map((s) => {
          const draft = drafts[s.setting_key] ?? s.setting_value ?? ''
          const dirty = draft !== (s.setting_value ?? '')
          return (
            <div
              key={s.setting_key}
              className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface"
            >
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-100">
                {s.label ?? s.setting_key}
              </label>
              {s.description && (
                <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{s.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={draft}
                  onChange={(e) => setDrafts((d) => ({ ...d, [s.setting_key]: e.target.value }))}
                  className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                />
                <button
                  disabled={!dirty || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ key: s.setting_key, value: draft })}
                  className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-40 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
                >
                  {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
