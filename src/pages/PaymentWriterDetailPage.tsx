import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'

interface Writer {
  writerId: string
  name: string
  role: string
  isMember: boolean | null
  paymentOverride: string | null
  manualFee: number | null
  fee: number
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
}

const rupiah = (n: number | null) => (n == null ? '-' : `Rp${n.toLocaleString('id-ID')}`)

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

  const { data, isLoading } = useQuery({
    queryKey: ['payment-detail', paymentId],
    queryFn: async () => (await api.get<PaperDetail>(`/payment/${paymentId}/detail`)).data,
    enabled: !!paymentId,
  })

  useEffect(() => {
    if (data) setWriters(data.writers)
  }, [data])

  const save = useMutation({
    mutationFn: () =>
      api.put(`/payment/${paymentId}/writers`, {
        writers: writers.map((w) => ({
          writerId: w.writerId,
          role: w.role,
          isMember: w.isMember ?? false,
          paymentOverride: w.paymentOverride,
          // Cuma dikirim kalau writer ini baru mau dikunci sekarang (draft
          // di editingOverride) — writer yang udah punya manualFee dari
          // server nggak perlu dikirim ulang, backend juga nolak kalau
          // dikirim ulang.
          manualFee: editingOverride[w.writerId] != null ? Number(editingOverride[w.writerId]) : undefined,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-detail', paymentId] })
      queryClient.invalidateQueries({ queryKey: ['payment-list'] })
      setEditingOverride({})
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

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  if (!data) return <p className="text-sm text-gray-500 dark:text-gray-400">Data tidak ditemukan.</p>

  return (
    <div>
      <Link to="/payment/manage" className="btn btn-ghost btn-sm mb-4">
        &larr; Kembali ke Kelola Pembayaran
      </Link>

      <h1 className="mb-1 text-xl font-bold text-gray-800 dark:text-gray-100">{data.paperTitle}</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Submitter: {data.submitterName}</p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 dark:bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Nama</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Membership</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Fee</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Override Manual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/10">
            {writers.map((w) => {
              const draft = editingOverride[w.writerId]
              const isDraft = draft !== undefined
              return (
                <tr key={w.writerId}>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{w.name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={w.role}
                      onChange={(e) => updateWriter(w.writerId, { role: e.target.value })}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    >
                      <option value="presenter">Presenter</option>
                      <option value="participant">Participant</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={membershipChoice(w)}
                      onChange={(e) => onMembershipChange(w.writerId, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
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
                      <button onClick={() => startOverride(w.writerId)} className="btn btn-outline btn-sm">
                        Override
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

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
