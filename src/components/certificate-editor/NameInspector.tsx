import type { FontOption, TemplateDraft } from './types'

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'
const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

interface Props {
  draft: TemplateDraft
  fonts: FontOption[]
  sampleName: string
  onSampleNameChange: (v: string) => void
  onChange: (patch: Partial<TemplateDraft>) => void
}

export function NameInspector({ draft, fonts, sampleName, onSampleNameChange, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Nama Sample (preview saja)</label>
        <input className={inputClass} value={sampleName} onChange={(e) => onSampleNameChange(e.target.value)} />
      </div>

      <div className="border-t border-gray-200 pt-4 dark:border-white/10">
        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">Nama Penerima</h3>
        <label className={labelClass}>Font</label>
        <select className={inputClass} value={draft.nameFontKey} onChange={(e) => onChange({ nameFontKey: e.target.value })}>
          {fonts.map((f) => (
            <option key={f.key} value={f.key} style={{ fontFamily: `cert-${f.key}` }}>
              {f.label}
            </option>
          ))}
        </select>

        <label className={`${labelClass} mt-3`}>
          Ukuran Font ({(draft.nameFontSize * 100).toFixed(1)}% tinggi halaman)
        </label>
        <input
          type="range"
          min={0.01}
          max={0.2}
          step={0.001}
          value={draft.nameFontSize}
          onChange={(e) => onChange({ nameFontSize: Number(e.target.value) })}
          className="w-full"
        />

        <label className={`${labelClass} mt-3`}>Warna</label>
        <input
          type="color"
          value={draft.nameColor}
          onChange={(e) => onChange({ nameColor: e.target.value })}
          className="h-9 w-16 rounded border border-gray-300 dark:border-white/15"
        />

        <label className={`${labelClass} mt-3`}>Lebar Maksimal (auto-shrink kalau nama kepanjangan)</label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={draft.nameMaxWidth}
          onChange={(e) => onChange({ nameMaxWidth: Number(e.target.value) })}
          className="w-full"
        />

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Posisi: drag langsung di kanvas, atau pakai arrow key (Shift = lebih cepat) setelah elemen dipilih.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-4 dark:border-white/10">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={draft.labelEnabled} onChange={(e) => onChange({ labelEnabled: e.target.checked })} />
          Tampilkan label tipe (mis. "Presenter")
        </label>
        {draft.labelEnabled && (
          <>
            <label className={`${labelClass} mt-3`}>Ukuran Font Label</label>
            <input
              type="range"
              min={0.01}
              max={0.15}
              step={0.001}
              value={draft.labelFontSize}
              onChange={(e) => onChange({ labelFontSize: Number(e.target.value) })}
              className="w-full"
            />
          </>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 dark:border-white/10">
        <label className={labelClass}>Font Teks (tanda tangan &amp; halaman 2)</label>
        <select className={inputClass} value={draft.bodyFontKey} onChange={(e) => onChange({ bodyFontKey: e.target.value })}>
          {fonts.map((f) => (
            <option key={f.key} value={f.key} style={{ fontFamily: `cert-${f.key}` }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
