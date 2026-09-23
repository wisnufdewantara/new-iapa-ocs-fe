import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'

interface Writer {
  writerId: string
  name: string
  firstName: string
  lastName: string
  role: string
  isMember: boolean | null
  paymentOverride: string | null
  manualFee: number | null
  fee: number
}

interface NewWriterDraft {
  tempId: string
  firstName: string
  lastName: string
  email: string
  gender: 'male' | 'female' | 'other'
  affiliation: string
  phoneNumber: string
  role: string
  isMember: boolean
}

interface PaymentProof {
  proofId: string
  proofUrl: string
  senderName: string | null
  transferDate: string | null
  uploadDate: string | null
}

interface PaperDetail {
  paymentId: string
  paperId: string
  paperTitle: string
  submitterName: string
  totalFee: number | null
  writers: Writer[]
  paymentStatus: string | null
  sentInvoice: boolean
  proofs: PaymentProof[]
}

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(url)

const rupiah = (n: number | null) => (n == null ? '-' : `Rp${n.toLocaleString('id-ID')}`)

const emptyDraft = (): NewWriterDraft => ({
  tempId: crypto.randomUUID(),
  firstName: '',
  lastName: '',
  email: '',
  gender: 'male',
  affiliation: '',
  phoneNumber: '',
  role: 'presenter',
  isMember: false,
})

// Dropdown Membership digabung jadi 1 pilihan (Member/Non-Member/Non-Payment/
// Writer) — 2 opsi terakhir maksa fee jadi Rp 0, buat kasus di luar aturan
// submitter-only otomatis (misal waive submitter sendiri). Mirror dari
// PaymentDetails.vue di ocs2 (CMS-IAPA-FE) biar konsisten dua sistem.
const membershipChoice = (w: Writer) => {
  if (w.paymentOverride) return w.paymentOverride
  if (w.isMember === true) return 'member'
  if (w.isMember === false) return 'non_member'
  return ''
}

export function PaymentWriterDetailPage() {
  usePageTitle('Detail Pembayaran')
  const { paymentId } = useParams<{ paymentId: string }>()
  const queryClient = useQueryClient()
  const [writers, setWriters] = useState<Writer[]>([])
  // writerId yang lagi nampilin input override (belum disimpan) — dipisah
  // dari data writer sendiri biar gampang batal tanpa nyentuh state utama.
  const [editingOverride, setEditingOverride] = useState<Record<string, string>>({})
  // Fitur "Edit Penulis" — ganti nama, tambah, hapus penulis langsung dari
  // halaman ini (sebelumnya cuma bisa lewat DB manual).
  const [deletedWriterIds, setDeletedWriterIds] = useState<Set<string>>(new Set())
  const [newWriterRows, setNewWriterRows] = useState<NewWriterDraft[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['payment-detail', paymentId],
    queryFn: async () => (await api.get<PaperDetail>(`/payment/${paymentId}/detail`)).data,
    enabled: !!paymentId,
  })

  useEffect(() => {
    if (data) setWriters(data.writers)
  }, [data])

  const save = useMutation({
    mutationFn: () => {
      const missing = newWriterRows.find((nw) => !nw.firstName.trim() || !nw.email.trim() || !nw.affiliation.trim())
      if (missing) {
        throw new Error('Nama, email, dan afiliasi penulis baru wajib diisi.')
      }
      return api.put(`/payment/${paymentId}/writers`, {
        writers: writers
          .filter((w) => !deletedWriterIds.has(w.writerId))
          .map((w) => ({
            writerId: w.writerId,
            firstName: w.firstName,
            lastName: w.lastName,
            role: w.role,
            isMember: w.isMember ?? false,
            paymentOverride: w.paymentOverride,
            // Cuma dikirim kalau writer ini baru mau dikunci sekarang (draft
            // di editingOverride) — writer yang udah punya manualFee dari
            // server nggak perlu dikirim ulang, backend juga nolak kalau
            // dikirim ulang.
            manualFee: editingOverride[w.writerId] != null ? Number(editingOverride[w.writerId]) : undefined,
          })),
        newWriters: newWriterRows.map((nw) => ({
          firstName: nw.firstName,
          lastName: nw.lastName,
          gender: nw.gender,
          affiliation: nw.affiliation,
          email: nw.email,
          phoneNumber: nw.phoneNumber || undefined,
          role: nw.role,
          isMember: nw.isMember,
        })),
        deleteWriterIds: Array.from(deletedWriterIds),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-detail', paymentId] })
      queryClient.invalidateQueries({ queryKey: ['payment-list'] })
      setEditingOverride({})
      setDeletedWriterIds(new Set())
      setNewWriterRows([])
      toastSuccess('Perubahan berhasil disimpan.')
    },
    onError: (err) => toastError(err, 'Gagal menyimpan perubahan.'),
  })

  const sendInvoice = useMutation({
    mutationFn: () => api.post(`/payment/${paymentId}/send-invoice`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-detail', paymentId] })
      toastSuccess('Invoice berhasil dikirim.')
    },
    onError: (err) => toastError(err, 'Gagal mengirim invoice.'),
  })

  const updateWriter = (writerId: string, patch: Partial<Writer>) => {
    setWriters((prev) => prev.map((w) => (w.writerId === writerId ? { ...w, ...patch } : w)))
  }

  const onMembershipChange = (writerId: string, value: string) => {
    if (value === 'non_payment' || value === 'writer') {
      updateWriter(writerId, { paymentOverride: value })
    } else {
      updateWriter(writerId, { isMember: value === 'member', paymentOverride: null })
    }
  }

  // Override manual — dipakai kasus khusus: anggota presenter yang MINTA
  // SENDIRI ikut bayar biar dapat sertifikat sendiri (bukan aturan umum).
  // Sengaja double-confirm karena SEKALI disimpan, backend nolak diubah
  // lagi lewat halaman ini — jangan sampai kepencet nggak sengaja.
  const startOverride = (writerId: string) => {
    if (!confirm('Set nominal manual buat writer ini? Biasanya dipakai kalau dia sendiri minta ikut bayar demi dapat sertifikat sendiri.'))
      return
    if (!confirm('PERINGATAN: setelah disimpan, nominal ini TERKUNCI — nggak bisa direvisi lagi lewat halaman ini. Lanjutkan?')) return
    setEditingOverride((prev) => ({ ...prev, [writerId]: '0' }))
  }

  const cancelOverride = (writerId: string) => {
    setEditingOverride((prev) => {
      const next = { ...prev }
      delete next[writerId]
      return next
    })
  }

  const markDeleted = (writerId: string, name: string) => {
    if (!confirm(`Hapus "${name}" dari daftar penulis? Baru permanen setelah klik Simpan Perubahan.`)) return
    setDeletedWriterIds((prev) => new Set(prev).add(writerId))
  }

  const undoDelete = (writerId: string) => {
    setDeletedWriterIds((prev) => {
      const next = new Set(prev)
      next.delete(writerId)
      return next
    })
  }

  const addWriterDraft = () => setNewWriterRows((prev) => [...prev, emptyDraft()])
  const removeWriterDraft = (tempId: string) => setNewWriterRows((prev) => prev.filter((r) => r.tempId !== tempId))
  const updateWriterDraft = (tempId: string, patch: Partial<NewWriterDraft>) =>
    setNewWriterRows((prev) => prev.map((r) => (r.tempId === tempId ? { ...r, ...patch } : r)))

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  if (!data) return <p className="text-sm text-gray-500 dark:text-gray-400">Data tidak ditemukan.</p>

  const inputCls =
    'w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'
  const selectCls = inputCls

  return (
    <div>
      <Link to="/payment/manage" className="btn btn-ghost btn-sm mb-4">
        &larr; Kembali ke Kelola Pembayaran
      </Link>

      <h1 className="mb-1 text-xl font-bold text-gray-800 dark:text-gray-100">{data.paperTitle}</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Submitter: {data.submitterName}</p>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Bukti Transfer</p>
        {data.proofs.length === 0 ? (
          <p className="text-sm italic text-gray-400 dark:text-gray-500">Belum ada bukti transfer diupload.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.proofs.map((p) => (
              <a
                key={p.proofId}
                href={p.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-gray-200 p-3 hover:border-blue-400 dark:border-white/10 dark:hover:border-blue-400"
              >
                {isImageUrl(p.proofUrl) ? (
                  <img src={p.proofUrl} alt="Bukti transfer" className="mb-2 h-32 w-full rounded object-cover" />
                ) : (
                  <div className="mb-2 flex h-32 w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    Lihat Dokumen
                  </div>
                )}
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{p.senderName || 'Tanpa nama pengirim'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{p.transferDate || '-'}</p>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 dark:bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Nama</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Membership</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Fee</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Override Manual</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/10">
            {writers.map((w) => {
              const draft = editingOverride[w.writerId]
              const isDraft = draft !== undefined
              const willDelete = deletedWriterIds.has(w.writerId)
              return (
                <tr key={w.writerId} className={willDelete ? 'opacity-40' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <input
                        value={w.firstName}
                        disabled={willDelete}
                        onChange={(e) => updateWriter(w.writerId, { firstName: e.target.value })}
                        placeholder="Nama depan"
                        className={`${inputCls} w-28`}
                      />
                      <input
                        value={w.lastName}
                        disabled={willDelete}
                        onChange={(e) => updateWriter(w.writerId, { lastName: e.target.value })}
                        placeholder="Nama belakang"
                        className={`${inputCls} w-28`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={w.role}
                      disabled={willDelete}
                      onChange={(e) => updateWriter(w.writerId, { role: e.target.value })}
                      className={selectCls}
                    >
                      <option value="presenter">Presenter</option>
                      <option value="participant">Participant</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={membershipChoice(w)}
                      disabled={willDelete}
                      onChange={(e) => onMembershipChange(w.writerId, e.target.value)}
                      className={selectCls}
                    >
                      <option value="" disabled>
                        Pilih Membership
                      </option>
                      <option value="member">Member</option>
                      <option value="non_member">Non-Member</option>
                      <option value="non_payment">Non-Payment</option>
                      <option value="writer">Writer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-100">
                    {rupiah(isDraft ? Number(draft || 0) : w.fee)}
                  </td>
                  <td className="px-4 py-3">
                    {w.manualFee != null ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        🔒 Dikunci: {rupiah(w.manualFee)}
                      </span>
                    ) : isDraft ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          autoFocus
                          value={draft}
                          onChange={(e) => setEditingOverride((prev) => ({ ...prev, [w.writerId]: e.target.value }))}
                          className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                        />
                        <button onClick={() => cancelOverride(w.writerId)} className="btn btn-danger-ghost btn-sm">
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button disabled={willDelete} onClick={() => startOverride(w.writerId)} className="btn btn-outline btn-sm">
                        Override
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {willDelete ? (
                      <button onClick={() => undoDelete(w.writerId)} className="btn btn-ghost btn-sm">
                        Batal Hapus
                      </button>
                    ) : (
                      <button onClick={() => markDeleted(w.writerId, w.name)} className="btn btn-danger-ghost btn-sm">
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {newWriterRows.length > 0 && (
        <div className="mt-4 space-y-3">
          {newWriterRows.map((nw) => (
            <div
              key={nw.tempId}
              className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4 dark:border-blue-500/30 dark:bg-blue-500/5"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Penulis Baru</span>
                <button onClick={() => removeWriterDraft(nw.tempId)} className="btn btn-danger-ghost btn-sm">
                  Hapus
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <input
                  value={nw.firstName}
                  onChange={(e) => updateWriterDraft(nw.tempId, { firstName: e.target.value })}
                  placeholder="Nama depan"
                  className={inputCls}
                />
                <input
                  value={nw.lastName}
                  onChange={(e) => updateWriterDraft(nw.tempId, { lastName: e.target.value })}
                  placeholder="Nama belakang"
                  className={inputCls}
                />
                <input
                  value={nw.email}
                  type="email"
                  onChange={(e) => updateWriterDraft(nw.tempId, { email: e.target.value })}
                  placeholder="Email"
                  className={inputCls}
                />
                <input
                  value={nw.affiliation}
                  onChange={(e) => updateWriterDraft(nw.tempId, { affiliation: e.target.value })}
                  placeholder="Afiliasi"
                  className={inputCls}
                />
                <input
                  value={nw.phoneNumber}
                  onChange={(e) => updateWriterDraft(nw.tempId, { phoneNumber: e.target.value })}
                  placeholder="No. telepon (opsional)"
                  className={inputCls}
                />
                <select
                  value={nw.gender}
                  onChange={(e) => updateWriterDraft(nw.tempId, { gender: e.target.value as NewWriterDraft['gender'] })}
                  className={selectCls}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={nw.role}
                  onChange={(e) => updateWriterDraft(nw.tempId, { role: e.target.value })}
                  className={selectCls}
                >
                  <option value="presenter">Presenter</option>
                  <option value="participant">Participant</option>
                </select>
                <select
                  value={nw.isMember ? 'member' : 'non_member'}
                  onChange={(e) => updateWriterDraft(nw.tempId, { isMember: e.target.value === 'member' })}
                  className={selectCls}
                >
                  <option value="member">Member</option>
                  <option value="non_member">Non-Member</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={addWriterDraft} className="btn btn-outline btn-sm mt-4">
        + Tambah Penulis
      </button>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Pembayaran</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{rupiah(data.totalFee)}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn btn-primary">
            {save.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button
            onClick={() => sendInvoice.mutate()}
            disabled={sendInvoice.isPending || data.totalFee == null}
            className="btn btn-outline"
          >
            {data.sentInvoice ? 'Kirim Ulang Invoice' : 'Kirim Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}
