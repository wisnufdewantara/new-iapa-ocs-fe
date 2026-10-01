import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastError, toastSuccess } from '../lib/toast'
import { DesignCanvas } from '../components/certificate-editor/DesignCanvas'
import { SignerInspector } from '../components/certificate-editor/SignerInspector'
import { QrInspector } from '../components/certificate-editor/QrInspector'
import { Page2Editor } from '../components/certificate-editor/Page2Editor'
import { PlaceholderInspector } from '../components/certificate-editor/PlaceholderInspector'
import type { ElementId, FontOption, PlaceholderVariable, SignerDraft, TemplateDraft } from '../components/certificate-editor/types'

type Tab = 'elemen' | 'signer' | 'page2'

export function CertificateTemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLDivElement>(null)

  const [draft, setDraft] = useState<TemplateDraft | null>(null)
  const [saved, setSaved] = useState<TemplateDraft | null>(null)
  const [selectedId, setSelectedId] = useState<ElementId | null>(null)
  const [tab, setTab] = useState<Tab>('elemen')
  const [sampleName, setSampleName] = useState('Nama Lengkap Peserta')

  const { data: template, isLoading } = useQuery({
    queryKey: ['certificate-template', id],
    queryFn: async () => (await api.get<TemplateDraft>(`/certificate-templates/${id}`)).data,
    enabled: !!id,
  })

  const { data: fonts } = useQuery({
    queryKey: ['certificate-fonts'],
    queryFn: async () => (await api.get<FontOption[]>('/certificate-templates/fonts')).data,
  })

  const { data: placeholderVariables } = useQuery({
    queryKey: ['certificate-placeholder-variables'],
    queryFn: async () => (await api.get<PlaceholderVariable[]>('/certificate-templates/placeholder-variables')).data,
  })

  usePageTitle(template ? `Edit Template: ${template.name}` : 'Edit Template Sertifikat')

  useEffect(() => {
    if (template) {
      setDraft(template)
      setSaved(template)
    }
  }, [template])

  useEffect(() => {
    const isDirty = JSON.stringify(draft) !== JSON.stringify(saved)
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [draft, saved])

  const saveMutation = useMutation({
    mutationFn: (dto: Partial<TemplateDraft>) => api.patch(`/certificate-templates/${id}`, dto),
    onSuccess: async () => {
      const { data } = await api.get<TemplateDraft>(`/certificate-templates/${id}`)
      setDraft(data)
      setSaved(data)
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] })
      toastSuccess('Template berhasil disimpan.')
    },
    onError: (err) => toastError(err, 'Gagal menyimpan template.'),
  })

  const designMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('design', file)
      return api.post(`/certificate-templates/${id}/design`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: async (res) => {
      const { data } = await api.get<TemplateDraft>(`/certificate-templates/${id}`)
      setDraft(data)
      setSaved(data)
      if (res.data.aspectChanged) {
        toastSuccess('Desain diganti. Perhatian: rasio gambar baru beda dari sebelumnya, posisi elemen mungkin perlu disesuaikan ulang.')
      } else {
        toastSuccess('Desain berhasil diganti.')
      }
    },
    onError: (err) => toastError(err, 'Gagal mengganti desain.'),
  })

  if (isLoading || !draft || !saved) {
    return <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Memuat template...</div>
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const updateDraft = (patch: Partial<TemplateDraft>) => setDraft({ ...draft, ...patch })

  const onMove = (elId: ElementId, pos: { x: number; y: number }) => {
    if (elId === 'qr') updateDraft({ qrPosX: pos.x, qrPosY: pos.y })
    else if (elId.startsWith('placeholder-')) {
      const slot = Number(elId.replace('placeholder-', ''))
      updateDraft({ placeholders: draft.placeholders.map((p) => (p.slot === slot ? { ...p, posX: pos.x, posY: pos.y } : p)) })
    } else {
      const slot = Number(elId.replace('signer-', ''))
      updateDraft({ signers: draft.signers.map((s) => (s.slot === slot ? { ...s, posX: pos.x, posY: pos.y } : s)) })
    }
  }

  const onSignerSynced = (signer: SignerDraft) => {
    const merge = (t: TemplateDraft | null): TemplateDraft | null =>
      t && {
        ...t,
        signers: t.signers.some((s) => s.slot === signer.slot)
          ? t.signers.map((s) => (s.slot === signer.slot ? signer : s))
          : [...t.signers, signer],
      }
    setDraft(merge)
    setSaved(merge)
  }

  const handleSave = () => {
    const { id: _id, designImageUrl: _d, designWidthPx: _w, designHeightPx: _h, updatedAt: _u, ...dto } = draft
    saveMutation.mutate(dto)
  }

  const handlePreview = async () => {
    try {
      const res = await api.post(`/certificate-templates/${id}/preview`, { sampleName }, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank')
    } catch (err) {
      toastError(err, 'Gagal membuat preview PDF.')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/certificate-templates" className="text-sm font-medium text-gray-500 hover:text-brand-navy dark:text-gray-400 dark:hover:text-brand-orange">
            ← Kembali
          </Link>
          <input
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="btn btn-outline cursor-pointer">
            Ganti Desain
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) designMutation.mutate(file)
                e.target.value = ''
              }}
            />
          </label>
          <button onClick={handlePreview} disabled={isDirty} title={isDirty ? 'Simpan dulu' : ''} className="btn btn-outline">
            Preview PDF
          </button>
          <button onClick={handleSave} disabled={!isDirty || saveMutation.isPending} className="btn btn-primary">
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 items-start justify-center">
          <DesignCanvas draft={draft} selectedId={selectedId} onSelect={setSelectedId} onMove={onMove} sampleName={sampleName} canvasRef={canvasRef} />
        </div>

        <div className="w-full shrink-0 lg:w-80">
          <div className="mb-3 flex flex-wrap gap-1 rounded-md bg-gray-100 p-1 text-sm dark:bg-white/5">
            {(['elemen', 'signer', 'page2'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded px-2 py-1.5 font-medium ${
                  tab === t ? 'bg-white text-brand-navy shadow-sm dark:bg-brand-dark-surface dark:text-brand-orange' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t === 'elemen' ? 'Elemen' : t === 'signer' ? 'Tanda Tangan' : 'Halaman 2'}
              </button>
            ))}
          </div>

          {tab === 'elemen' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Sample (preview saja)</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                />
              </div>
              <div className="mt-6 border-t border-gray-200 pt-4 dark:border-white/10">
                <QrInspector draft={draft} onChange={updateDraft} />
              </div>
              <div className="mt-6 border-t border-gray-200 pt-4 dark:border-white/10">
                <PlaceholderInspector draft={draft} fonts={fonts ?? []} variables={placeholderVariables ?? []} onChange={updateDraft} />
              </div>
            </>
          )}
          {tab === 'signer' && id && (
            <SignerInspector templateId={id} draft={draft} onChange={updateDraft} onSignerSynced={onSignerSynced} />
          )}
          {tab === 'page2' && <Page2Editor draft={draft} onChange={updateDraft} />}
        </div>
      </div>
    </div>
  )
}
