import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { toastError, toastSuccess } from '../../lib/toast'
import type { SignerDraft, TemplateDraft } from './types'

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'
const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

const emptySigner = (slot: number): SignerDraft => ({
  slot,
  signerName: '',
  signerTitle: '',
  signatureImageUrl: null,
  signatureWidthPx: null,
  signatureHeightPx: null,
  posX: 0.5,
  posY: 0.78 - (slot - 1) * 0.12,
  width: 0.15,
})

interface Props {
  templateId: string
  draft: TemplateDraft
  onChange: (patch: Partial<TemplateDraft>) => void
  onSignerSynced: (signer: SignerDraft) => void
}

export function SignerInspector({ templateId, draft, onChange, onSignerSynced }: Props) {
  const uploadMutation = useMutation({
    mutationFn: async ({ slot, file }: { slot: number; file: File }) => {
      const form = new FormData()
      form.append('image', file)
      const { data } = await api.post(`/certificate-templates/${templateId}/signers/${slot}/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (data, variables) => {
      const signer = data.signers.find((s: SignerDraft) => s.slot === variables.slot)
      if (signer) onSignerSynced(signer)
      toastSuccess('Tanda tangan berhasil diupload.')
    },
    onError: (err) => toastError(err, 'Gagal upload tanda tangan.'),
  })

  const removeImageMutation = useMutation({
    mutationFn: (slot: number) => api.delete(`/certificate-templates/${templateId}/signers/${slot}/image`),
    onSuccess: (_data, slot) => {
      const current = draft.signers.find((s) => s.slot === slot)
      if (current) onSignerSynced({ ...current, signatureImageUrl: null, signatureWidthPx: null, signatureHeightPx: null })
    },
    onError: (err) => toastError(err, 'Gagal menghapus gambar tanda tangan.'),
  })

  const addSlot = () => {
    const used = new Set(draft.signers.map((s) => s.slot))
    const nextSlot = [1, 2, 3].find((s) => !used.has(s))
    if (!nextSlot) return
    onChange({ signers: [...draft.signers, emptySigner(nextSlot)] })
  }

  const removeSlot = (slot: number) => {
    onChange({ signers: draft.signers.filter((s) => s.slot !== slot) })
  }

  const updateSlot = (slot: number, patch: Partial<SignerDraft>) => {
    onChange({ signers: draft.signers.map((s) => (s.slot === slot ? { ...s, ...patch } : s)) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Ukuran Font Nama/Jabatan</label>
        <input
          type="range"
          min={0.01}
          max={0.06}
          step={0.001}
          value={draft.signerFontSize}
          onChange={(e) => onChange({ signerFontSize: Number(e.target.value) })}
          className="w-full"
        />
        <label className={`${labelClass} mt-3`}>Warna</label>
        <input
          type="color"
          value={draft.signerColor}
          onChange={(e) => onChange({ signerColor: e.target.value })}
          className="h-9 w-16 rounded border border-gray-300 dark:border-white/15"
        />
      </div>

      {[1, 2, 3].map((slot) => {
        const signer = draft.signers.find((s) => s.slot === slot)
        if (!signer) {
          return (
            <button key={slot} onClick={addSlot} className="btn btn-outline">
              + Tambah Penandatangan {slot}
            </button>
          )
        }
        return (
          <div key={slot} className="rounded-md border border-gray-200 p-3 dark:border-white/10">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Penandatangan {slot}</span>
              <button onClick={() => removeSlot(slot)} className="btn-danger-ghost text-xs">
                Hapus
              </button>
            </div>
            <label className={labelClass}>Nama</label>
            <input className={inputClass} value={signer.signerName} onChange={(e) => updateSlot(slot, { signerName: e.target.value })} />
            <label className={`${labelClass} mt-2`}>Jabatan</label>
            <input className={inputClass} value={signer.signerTitle} onChange={(e) => updateSlot(slot, { signerTitle: e.target.value })} />

            <label className={`${labelClass} mt-2`}>Gambar Tanda Tangan (PNG)</label>
            <input
              type="file"
              accept="image/png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadMutation.mutate({ slot, file })
                e.target.value = ''
              }}
              disabled={uploadMutation.isPending}
              className="text-sm text-gray-600 dark:text-gray-300"
            />
            {signer.signatureImageUrl && (
              <button onClick={() => removeImageMutation.mutate(slot)} className="btn-danger-ghost ml-2 text-xs">
                Hapus gambar
              </button>
            )}

            <label className={`${labelClass} mt-2`}>Lebar</label>
            <input
              type="range"
              min={0.05}
              max={0.35}
              step={0.01}
              value={signer.width}
              onChange={(e) => updateSlot(slot, { width: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        )
      })}
    </div>
  )
}
