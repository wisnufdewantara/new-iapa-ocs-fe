import { useState, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { toastError, toastSuccess } from '../lib/toast'

// Admin upload bukti transfer atas nama presenter/peserta (bukti masuk
// lewat WA/email). Status cuma naik ke "waiting for verification" —
// verifikasinya tetap lewat tombol Accept biasa. Komponen ini sekalian
// jadi kartu "Bukti Transfer" — tombol Override di header-nya selalu ada,
// baik sudah ada bukti maupun belum (children = tampilan bukti yang ada).
export function AdminProofUpload({
  endpoint,
  onUploaded,
  children,
}: {
  endpoint: string
  onUploaded: () => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [senderName, setSenderName] = useState('')
  const [transferDate, setTransferDate] = useState('')

  const upload = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('proof', file as File)
      if (senderName.trim()) form.append('senderName', senderName.trim())
      if (transferDate) form.append('transferDate', transferDate)
      return api.post(endpoint, form)
    },
    onSuccess: () => {
      toastSuccess('Bukti transfer berhasil diupload.')
      setOpen(false)
      setFile(null)
      setSenderName('')
      setTransferDate('')
      onUploaded()
    },
    onError: (err) => toastError(err, 'Gagal upload bukti transfer.'),
  })

  const inputCls =
    'w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Bukti Transfer</p>
        <button onClick={() => setOpen((v) => !v)} className="btn btn-outline btn-sm">
          {open ? 'Batal Override' : 'Override'}
        </button>
      </div>
      {children}
      {open && (
        <div className="mt-4 rounded-md border border-dashed border-gray-300 p-3 dark:border-white/15">
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Upload bukti transfer atas nama pembayar (PDF/PNG/JPEG, maks 10MB). Status jadi "waiting for
            verification" — tetap perlu di-Accept.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-700 dark:text-gray-300"
            />
            <input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Nama pengirim (opsional)"
              className={inputCls}
            />
            <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} className={inputCls} />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => upload.mutate()}
              disabled={!file || upload.isPending}
              className="btn btn-primary btn-sm"
            >
              {upload.isPending ? 'Mengupload...' : 'Upload'}
            </button>
            <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
