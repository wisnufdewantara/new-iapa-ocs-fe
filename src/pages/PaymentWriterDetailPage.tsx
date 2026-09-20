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
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-detail', paymentId] })
      queryClient.invalidateQueries({ queryKey: ['payment-list'] })
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

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  if (!data) return <p className="text-sm text-gray-500 dark:text-gray-400">Data tidak ditemukan.</p>

  return (
    <div>
      <Link to="/payment/manage" className="mb-4 inline-block text-sm text-brand-navy hover:underline dark:text-brand-orange">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/10">
            {writers.map((w) => (
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
                <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-100">{rupiah(w.fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Pembayaran</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{rupiah(data.totalFee)}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-brand-orange"
          >
            {save.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button
            onClick={() => sendInvoice.mutate()}
            disabled={sendInvoice.isPending || data.totalFee == null}
            className="rounded-md border border-brand-navy px-4 py-2 text-sm font-medium text-brand-navy hover:bg-brand-navy/5 disabled:opacity-50 dark:border-brand-orange dark:text-brand-orange"
          >
            {data.sentInvoice ? 'Kirim Ulang Invoice' : 'Kirim Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}
