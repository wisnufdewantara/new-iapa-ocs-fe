import type { TemplateDraft } from './types'

const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

interface Props {
  draft: TemplateDraft
  onChange: (patch: Partial<TemplateDraft>) => void
}

export function QrInspector({ draft, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <input type="checkbox" checked={draft.qrEnabled} onChange={(e) => onChange({ qrEnabled: e.target.checked })} />
        Tampilkan QR verifikasi
      </label>

      {draft.qrEnabled && (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            QR mengarah ke halaman publik <code>/certificate-validation/&lt;kode&gt;</code> — dibuat otomatis saat sertifikat
            benar-benar dikirim/didownload (bukan saat Preview).
          </p>
          <label className={labelClass}>Ukuran</label>
          <input
            type="range"
            min={0.04}
            max={0.25}
            step={0.005}
            value={draft.qrSize}
            onChange={(e) => onChange({ qrSize: Number(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">Posisi: drag langsung kotak QR di kanvas.</p>
        </>
      )}
    </div>
  )
}
