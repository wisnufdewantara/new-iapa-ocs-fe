import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/axios'
import { toastError, toastSuccess } from '../lib/toast'

export interface FeedbackMessage {
  id: string
  side: 'reviewer' | 'author'
  senderName: string
  body: string | null
  fileUrl: string | null
  fileName: string | null
  createdAt: string | null
  legacy: boolean
}

const formatTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

// Thread feedback reviewer <-> penulis, dipakai di 2 sisi:
//  - viewer 'reviewer' (Review Paper → Detail): nama pengirim asli kelihatan
//  - viewer 'author' (Dashboard → Feedback): reviewer tampil "Tim Reviewer"
// Penyamaran nama dilakukan backend — komponen ini cuma nampilin senderName.
export function FeedbackThread({
  messages,
  viewer,
  postEndpoint,
  onPosted,
}: {
  messages: FeedbackMessage[]
  viewer: 'reviewer' | 'author'
  postEndpoint: string
  onPosted: () => void
}) {
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)

  const send = useMutation({
    mutationFn: async () => {
      const form = new FormData()
      if (body.trim()) form.append('body', body.trim())
      if (file) form.append('file', file)
      return (await api.post<{ emailSent: boolean | null; emailError?: string }>(postEndpoint, form)).data
    },
    onSuccess: (res) => {
      if (res.emailSent === false) {
        toast.warning(`Pesan terkirim, tapi email notifikasi ke penulis gagal: ${res.emailError ?? 'tidak diketahui'}`)
      } else {
        toastSuccess(viewer === 'reviewer' ? 'Feedback terkirim ke penulis.' : 'Balasan terkirim ke Tim Reviewer.')
      }
      setBody('')
      setFile(null)
      setFileInputKey((k) => k + 1)
      onPosted()
    },
    onError: (err) => toastError(err, 'Gagal mengirim pesan.'),
  })

  // Pesan "milik sendiri" rata kanan, pihak lain rata kiri — kayak chat.
  const isMine = (m: FeedbackMessage) => m.side === viewer

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
      <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Feedback</h2>

      {messages.length === 0 ? (
        <p className="mb-4 text-sm italic text-gray-400 dark:text-gray-500">
          {viewer === 'reviewer' ? 'Belum ada feedback. Tulis feedback pertama di bawah.' : 'Belum ada feedback dari Tim Reviewer.'}
        </p>
      ) : (
        <ul className="mb-4 flex flex-col gap-3">
          {messages.map((m) => (
            <li key={m.id} className={`flex ${isMine(m) ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg border px-4 py-3 text-sm ${
                  m.side === 'reviewer'
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {m.senderName}
                  <span className="ml-2 font-normal text-gray-400 dark:text-gray-500">{formatTime(m.createdAt)}</span>
                  {m.legacy && <span className="ml-2 font-normal text-gray-400 dark:text-gray-500">(feedback lama)</span>}
                </p>
                {m.body && <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-100">{m.body}</p>}
                {m.fileUrl && (
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
                  >
                    📎 {m.fileName || 'Lampiran'}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send.mutate()
        }}
        className="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-white/10"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder={viewer === 'reviewer' ? 'Tulis feedback untuk penulis...' : 'Tulis balasan untuk Tim Reviewer...'}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <input
              key={fileInputKey}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-600 dark:text-gray-300"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Lampiran opsional: PDF/DOC/DOCX, maks 10MB</p>
          </div>
          <button type="submit" disabled={(!body.trim() && !file) || send.isPending} className="btn btn-primary btn-sm">
            {send.isPending ? 'Mengirim...' : viewer === 'reviewer' ? 'Kirim Feedback' : 'Kirim Balasan'}
          </button>
        </div>
        {viewer === 'reviewer' && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Penulis menerima email notifikasi. Di sisi penulis, pengirim tampil sebagai "Tim Reviewer".
          </p>
        )}
      </form>
    </div>
  )
}
