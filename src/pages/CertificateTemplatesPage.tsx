import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastError, toastSuccess } from '../lib/toast'

const apiOrigin = (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '')

interface TemplateListItem {
  id: string
  name: string
  description: string | null
  designImageUrl: string
  isDefault: boolean
  usedBy: number
}

interface Conference {
  conference_id: string
  conference_name: string
}

interface Mappings {
  participant: string | null
  presenter: string | null
  bestPaper: string | null
  bestPresenter: string | null
  defaultTemplate: { id: string; name: string } | null
}

type MappingKey = 'participant' | 'presenter' | 'bestPaper' | 'bestPresenter'
const CERT_TYPE_LABELS: Record<MappingKey, string> = {
  participant: 'Peserta',
  presenter: 'Presenter',
  bestPaper: 'Best Paper',
  bestPresenter: 'Best Presenter',
}

function NewTemplateModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const createMutation = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('name', name)
      if (description) form.append('description', description)
      if (file) form.append('design', file)
      return api.post('/certificate-templates', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] })
      navigate(`/certificate-templates/${res.data.id}`)
    },
    onError: (err) => toastError(err, 'Gagal membuat template.'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-brand-dark-surface">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">Template Sertifikat Baru</h2>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Template</label>
        <input
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi (opsional)</label>
        <input
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Desain (PNG/JPEG)</label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mb-4 text-sm text-gray-600 dark:text-gray-300"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost">
            Batal
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name || !file || createMutation.isPending}
            className="btn btn-primary"
          >
            {createMutation.isPending ? 'Membuat...' : 'Buat & Edit'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TemplateGrid() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: templates } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => (await api.get<TemplateListItem[]>('/certificate-templates')).data,
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.post(`/certificate-templates/${id}/set-default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] })
      toastSuccess('Template dijadikan default.')
    },
    onError: (err) => toastError(err, 'Gagal menjadikan default.'),
  })

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/certificate-templates/${id}/duplicate`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] })
      navigate(`/certificate-templates/${res.data.id}`)
    },
    onError: (err) => toastError(err, 'Gagal menduplikat template.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/certificate-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] })
      toastSuccess('Template dihapus.')
    },
    onError: (err) => toastError(err, 'Gagal menghapus template.'),
  })

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Template Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map((t) => (
          <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-brand-dark-surface">
            <img
              src={`${apiOrigin}${t.designImageUrl}`}
              alt={t.name}
              className="mb-3 aspect-[4/3] w-full rounded-md border border-gray-200 object-cover dark:border-white/10"
            />
            <div className="mb-1 flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t.name}</h3>
              {t.isDefault && <span className="rounded bg-brand-orange/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-orange">Default</span>}
            </div>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Dipakai di {t.usedBy} conference</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button onClick={() => navigate(`/certificate-templates/${t.id}`)} className="btn btn-outline btn-sm">
                Edit
              </button>
              {!t.isDefault && (
                <button onClick={() => setDefaultMutation.mutate(t.id)} className="btn btn-outline btn-sm">
                  Jadikan Default
                </button>
              )}
              <button onClick={() => duplicateMutation.mutate(t.id)} className="btn btn-outline btn-sm">
                Duplikat
              </button>
              <button
                onClick={() => {
                  if (confirm(`Hapus template "${t.name}"?`)) deleteMutation.mutate(t.id)
                }}
                className="btn-danger-ghost text-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && <NewTemplateModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

function MappingPanel() {
  const [conferenceId, setConferenceId] = useState('')

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const { data: templates } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => (await api.get<TemplateListItem[]>('/certificate-templates')).data,
  })

  const { data: mappings } = useQuery({
    queryKey: ['certificate-template-mappings', conferenceId],
    queryFn: async () => (await api.get<Mappings>('/certificate-templates/mappings', { params: { conferenceId } })).data,
    enabled: !!conferenceId,
  })

  const [draft, setDraft] = useState<Record<MappingKey, string>>({ participant: '', presenter: '', bestPaper: '', bestPresenter: '' })

  if (mappings && draft.participant === '' && draft.presenter === '' && !draft.bestPaper && !draft.bestPresenter) {
    const next = {
      participant: mappings.participant ?? '',
      presenter: mappings.presenter ?? '',
      bestPaper: mappings.bestPaper ?? '',
      bestPresenter: mappings.bestPresenter ?? '',
    }
    if (JSON.stringify(next) !== JSON.stringify(draft)) setDraft(next)
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/certificate-templates/mappings/${conferenceId}`, {
        participant: draft.participant || null,
        presenter: draft.presenter || null,
        bestPaper: draft.bestPaper || null,
        bestPresenter: draft.bestPresenter || null,
      }),
    onSuccess: () => toastSuccess('Pemetaan template berhasil disimpan.'),
    onError: (err) => toastError(err, 'Gagal menyimpan pemetaan.'),
  })

  return (
    <div>
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Conference</label>
        <select
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          value={conferenceId}
          onChange={(e) => {
            setConferenceId(e.target.value)
            setDraft({ participant: '', presenter: '', bestPaper: '', bestPresenter: '' })
          }}
        >
          <option value="">-- pilih conference --</option>
          {conferences?.map((c) => (
            <option key={c.conference_id} value={c.conference_id}>
              {c.conference_name}
            </option>
          ))}
        </select>
      </div>

      {conferenceId && mappings && (
        <div className="max-w-md rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
          {(Object.keys(CERT_TYPE_LABELS) as MappingKey[]).map((key) => (
            <div key={key} className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{CERT_TYPE_LABELS[key]}</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              >
                <option value="">
                  {mappings.defaultTemplate ? `— Default (${mappings.defaultTemplate.name}) —` : '— Template lama (legacy) —'}
                </option>
                {templates?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn btn-primary">
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Pemetaan'}
          </button>
        </div>
      )}
    </div>
  )
}

export function CertificateTemplatesPage() {
  usePageTitle('Pengaturan Sertifikat')
  const [tab, setTab] = useState<'template' | 'mapping'>('template')

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Pengaturan Sertifikat</h1>

      <div className="mb-4 flex gap-1 rounded-md bg-gray-100 p-1 text-sm dark:bg-white/5" style={{ width: 'fit-content' }}>
        <button
          onClick={() => setTab('template')}
          className={`rounded px-4 py-1.5 font-medium ${tab === 'template' ? 'bg-white text-brand-navy shadow-sm dark:bg-brand-dark-surface dark:text-brand-orange' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Template
        </button>
        <button
          onClick={() => setTab('mapping')}
          className={`rounded px-4 py-1.5 font-medium ${tab === 'mapping' ? 'bg-white text-brand-navy shadow-sm dark:bg-brand-dark-surface dark:text-brand-orange' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Pemetaan Conference
        </button>
      </div>

      {tab === 'template' ? <TemplateGrid /> : <MappingPanel />}
    </div>
  )
}
