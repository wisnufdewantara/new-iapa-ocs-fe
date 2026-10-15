import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/axios'
import { toastError, toastSuccess } from '../lib/toast'

interface SendFeedbackResult {
  saved: boolean
  emailSent: boolean
  emailError?: string
}

// "Send Feedback" ocs2 lama: reviewer/admin upload file feedback (paper
// yang sudah dikomentari) → tersimpan di paper + email notifikasi ke
// submitter. Penulis juga bisa unduh dari Dashboard-nya.
export function SendFeedbackModal({
  paperId,
  paperTitle,
  existingFeedbackUrl,
  onClose,
  onSent,
}: {
  paperId: string
  paperTitle: string
  existingFeedbackUrl: string | null
  onClose: () => void
  onSent: () => void
}) {
  const [file, setFile] = useState<File | null>(null)

  const send = useMutation({
    mutationFn: async () => {
      const form = new FormData()
      form.append('feedback', file as File)
      return (await api.post<SendFeedbackResult>(`/papers/${paperId}/feedback`, form)).data
    },
    onSuccess: (res) => {
      if (res.emailSent) {
        toastSuccess('Feedback tersimpan dan sudah dikirim ke email penulis.')
      } else {
        toast.warning(
          `Feedback tersimpan (penulis bisa unduh dari Dashboard), tapi email gagal terkirim: ${res.emailError ?? 'tidak diketahui'}`,
        )
      }
      onSent()
      onClose()
    },
    onError: (err) => toastError(err, 'Gagal mengirim feedback.'),
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-brand-dark-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-gray-800 dark:text-gray-100">
          {existingFeedbackUrl ? 'Ganti Feedback' : 'Kirim Feedback'}
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{paperTitle}</p>

        {existingFeedbackUrl && (
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            Feedback saat ini:{' '}
            <a href={existingFeedbackUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              Lihat
            </a>
            . Upload baru akan menggantikannya.
          </p>
        )}

        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          File feedback (PDF/DOC/DOCX, maks 10MB)
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-600 dark:text-gray-300"
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Penulis akan menerima email berisi link download, dan bisa mengunduhnya juga dari Dashboard.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Batal
          </button>
          <button onClick={() => send.mutate()} disabled={!file || send.isPending} className="btn btn-primary btn-sm">
            {send.isPending ? 'Mengirim...' : 'Kirim Feedback'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
