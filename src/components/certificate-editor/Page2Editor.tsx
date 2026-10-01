import { parsePage2Content } from './page2'
import type { TemplateDraft } from './types'

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'
const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

interface Props {
  draft: TemplateDraft
  onChange: (patch: Partial<TemplateDraft>) => void
}

// Isi halaman 2 SAMA buat semua penerima dalam satu template/conference
// (keputusan user) — nggak ada input per-orang di alur kirim satuan/bulk.
export function Page2Editor({ draft, onChange }: Props) {
  const blocks = draft.page2Content ? parsePage2Content(draft.page2Content) : []

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={draft.page2Enabled} onChange={(e) => onChange({ page2Enabled: e.target.checked })} />
          Aktifkan Halaman 2
        </label>

        {draft.page2Enabled && (
          <>
            <div>
              <label className={labelClass}>Judul</label>
              <input className={inputClass} value={draft.page2Title ?? ''} onChange={(e) => onChange({ page2Title: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Isi (awali baris dengan "- " untuk poin)</label>
              <textarea
                rows={14}
                className={`${inputClass} font-mono text-xs`}
                value={draft.page2Content ?? ''}
                onChange={(e) => onChange({ page2Content: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Total JP (opsional)</label>
              <input
                type="number"
                min={0}
                max={999}
                className={inputClass}
                value={draft.page2TotalJp ?? ''}
                onChange={(e) => onChange({ page2TotalJp: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Ukuran Font</label>
              <input
                type="range"
                min={0.01}
                max={0.06}
                step={0.001}
                value={draft.page2FontSize}
                onChange={(e) => onChange({ page2FontSize: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>

      {draft.page2Enabled && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10" style={{ fontFamily: `cert-${draft.bodyFontKey}` }}>
          {draft.page2Title && <h3 className="mb-4 text-center text-lg font-semibold">{draft.page2Title}</h3>}
          <div className="flex flex-col gap-1 text-sm">
            {blocks.map((b, i) => {
              if (b.type === 'space') return <div key={i} className="h-3" />
              if (b.type === 'bullet') {
                return (
                  <div key={i} className="flex gap-2 pl-2">
                    <span>&bull;</span>
                    <span>{b.text}</span>
                  </div>
                )
              }
              return <p key={i}>{b.text}</p>
            })}
            {draft.page2TotalJp != null && <p className="mt-3 font-semibold">Total: {draft.page2TotalJp} JP</p>}
          </div>
          <p className="mt-4 text-center text-xs text-gray-400 italic">
            Preview kasar — pagination/word-wrap eksak diverifikasi lewat tombol Preview PDF.
          </p>
        </div>
      )}
    </div>
  )
}
