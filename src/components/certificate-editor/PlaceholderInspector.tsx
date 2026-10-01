import type { FontOption, PlaceholderDraft, PlaceholderType, PlaceholderVariable, TemplateDraft } from './types'

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'
const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

const MAX_PLACEHOLDERS = 10

const TYPE_LABELS: Record<PlaceholderType, string> = {
  name: 'Nama Penerima',
  cert_type: 'Label Tipe (mis. "Presenter")',
  custom: 'Custom Teks',
}

const emptyPlaceholder = (slot: number): PlaceholderDraft => ({
  slot,
  type: 'custom',
  content: '',
  fontKey: 'cardo_regular',
  fontSize: 0.025,
  color: '#17366A',
  posX: 0.5,
  posY: 0.6,
  maxWidth: 0.6,
})

interface Props {
  draft: TemplateDraft
  fonts: FontOption[]
  variables: PlaceholderVariable[]
  onChange: (patch: Partial<TemplateDraft>) => void
}

// Satu list buat SEMUA placeholder teks — Nama Penerima & Label Tipe
// (type='name'/'cert_type', kontennya otomatis dari data recipient) dan
// Custom Teks (type='custom', kontennya diisi manual, boleh {{variabel}}).
export function PlaceholderInspector({ draft, fonts, variables, onChange }: Props) {
  const addPlaceholder = () => {
    const used = new Set(draft.placeholders.map((p) => p.slot))
    const nextSlot = Array.from({ length: MAX_PLACEHOLDERS }, (_, i) => i + 1).find((s) => !used.has(s))
    if (!nextSlot) return
    onChange({ placeholders: [...draft.placeholders, emptyPlaceholder(nextSlot)] })
  }

  const removePlaceholder = (slot: number) => {
    onChange({ placeholders: draft.placeholders.filter((p) => p.slot !== slot) })
  }

  const updatePlaceholder = (slot: number, patch: Partial<PlaceholderDraft>) => {
    onChange({ placeholders: draft.placeholders.map((p) => (p.slot === slot ? { ...p, ...patch } : p)) })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Placeholder teks di atas desain (maks {MAX_PLACEHOLDERS}) — pilih jenisnya. "Nama Penerima" &amp; "Label Tipe"
        otomatis keisi dari data, "Custom Teks" diisi manual, bisa diselingi variabel:{' '}
        {variables.map((v) => (
          <code key={v.key} className="mr-1 rounded bg-gray-100 px-1 dark:bg-white/10">{`{{${v.key}}}`}</code>
        ))}
      </p>

      {draft.placeholders.map((p) => (
        <div key={p.slot} className="rounded-md border border-gray-200 p-3 dark:border-white/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Placeholder {p.slot}</span>
            <button onClick={() => removePlaceholder(p.slot)} className="btn-danger-ghost text-xs">
              Hapus
            </button>
          </div>

          <label className={labelClass}>Jenis</label>
          <select
            className={inputClass}
            value={p.type}
            onChange={(e) => updatePlaceholder(p.slot, { type: e.target.value as PlaceholderType })}
          >
            {(Object.keys(TYPE_LABELS) as PlaceholderType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          {p.type === 'custom' && (
            <>
              <label className={`${labelClass} mt-2`}>Isi</label>
              <textarea
                rows={2}
                className={inputClass}
                value={p.content}
                onChange={(e) => updatePlaceholder(p.slot, { content: e.target.value })}
              />
            </>
          )}

          <label className={`${labelClass} mt-2`}>Font</label>
          <select className={inputClass} value={p.fontKey} onChange={(e) => updatePlaceholder(p.slot, { fontKey: e.target.value })}>
            {fonts.map((f) => (
              <option key={f.key} value={f.key} style={{ fontFamily: `cert-${f.key}` }}>
                {f.label}
              </option>
            ))}
          </select>

          <label className={`${labelClass} mt-2`}>Ukuran Font</label>
          <input
            type="range"
            min={0.01}
            max={0.1}
            step={0.001}
            value={p.fontSize}
            onChange={(e) => updatePlaceholder(p.slot, { fontSize: Number(e.target.value) })}
            className="w-full"
          />

          <label className={`${labelClass} mt-2`}>Warna</label>
          <input
            type="color"
            value={p.color}
            onChange={(e) => updatePlaceholder(p.slot, { color: e.target.value })}
            className="h-9 w-16 rounded border border-gray-300 dark:border-white/15"
          />

          <label className={`${labelClass} mt-2`}>Lebar Maksimal (auto-shrink buat Nama/Label, word-wrap buat Custom)</label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={p.maxWidth}
            onChange={(e) => updatePlaceholder(p.slot, { maxWidth: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      ))}

      {draft.placeholders.length < MAX_PLACEHOLDERS && (
        <button onClick={addPlaceholder} className="btn btn-outline">
          + Tambah Placeholder ({draft.placeholders.length}/{MAX_PLACEHOLDERS})
        </button>
      )}
    </div>
  )
}
