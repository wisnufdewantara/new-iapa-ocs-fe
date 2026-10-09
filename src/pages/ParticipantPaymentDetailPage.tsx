import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'
import { AdminProofUpload } from '../components/AdminProofUpload'

interface ParticipantDetail {
  attendanceId: string
  name: string
  email: string
  conferenceName: string
  isMember: boolean | null
  totalAmount: number | null
  paymentStatus: string | null
  sentInvoice: boolean
  proofUrl: string | null
  senderName: string | null
  transferDate: string | null
}

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(url)

const rupiah = (n: number | null) => (n == null ? '-' : `Rp${n.toLocaleString('id-ID')}`)

export function ParticipantPaymentDetailPage() {
  usePageTitle('Detail Pembayaran Peserta')
  const { attendanceId } = useParams<{ attendanceId: string }>()
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [isMemberDraft, setIsMemberDraft] = useState(false)
  const [amountDraft, setAmountDraft] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['participant-payment-detail', attendanceId],
    queryFn: async () => (await api.get<ParticipantDetail>(`/payment/participant/${attendanceId}/detail`)).data,
    enabled: !!attendanceId,
  })

  useEffect(() => {
    if (data) {
      setIsMemberDraft(data.isMember ?? false)
      setAmountDraft(data.totalAmount != null ? String(data.totalAmount) : '0')
    }
  }, [data])

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/payment/participant/${attendanceId}/override`, {
        isMember: isMemberDraft,
        totalAmount: Number(amountDraft),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-payment-detail', attendanceId] })
      queryClient.invalidateQueries({ queryKey: ['payment-list'] })
      setEditMode(false)
      toastSuccess('Perubahan berhasil disimpan.')
    },
    onError: (err) => toastError(err, 'Gagal menyimpan perubahan.'),
  })

  const sendInvoice = useMutation({
    mutationFn: () => api.post(`/payment/participant/${attendanceId}/send-invoice`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-payment-detail', attendanceId] })
      toastSuccess('Invoice berhasil dikirim.')
    },
    onError: (err) => toastError(err, 'Gagal mengirim invoice.'),
  })

  const sendReceipt = useMutation({
    mutationFn: () => api.post(`/payment/participant/${attendanceId}/send-receipt`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-payment-detail', attendanceId] })
      toastSuccess('Kwitansi berhasil dikirim.')
    },
    onError: (err) => toastError(err, 'Gagal mengirim kwitansi.'),
  })

  const cancelEdit = () => {
    if (data) {
      setIsMemberDraft(data.isMember ?? false)
      setAmountDraft(data.totalAmount != null ? String(data.totalAmount) : '0')
    }
    setEditMode(false)
  }

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  if (!data) return <p className="text-sm text-gray-500 dark:text-gray-400">Data tidak ditemukan.</p>

  const inputCls =
    'w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'

  return (
    <div>
      <Link to="/payment/manage" className="btn btn-ghost btn-sm mb-4">
        &larr; Kembali ke Kelola Pembayaran
      </Link>

      <h1 className="mb-1 text-xl font-bold text-gray-800 dark:text-gray-100">{data.name}</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {data.email} &middot; {data.conferenceName}
      </p>

      <AdminProofUpload
        endpoint={`/payment/participant/${attendanceId}/admin-proof`}
        onUploaded={() => {
          queryClient.invalidateQueries({ queryKey: ['participant-payment-detail', attendanceId] })
          queryClient.invalidateQueries({ queryKey: ['payment-list'] })
        }}
      >
        {!data.proofUrl ? (
          <p className="text-sm italic text-gray-400 dark:text-gray-500">Belum ada bukti transfer diupload.</p>
        ) : (
          <a
            href={data.proofUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block max-w-xs rounded-md border border-gray-200 p-3 hover:border-blue-400 dark:border-white/10 dark:hover:border-blue-400"
          >
            {isImageUrl(data.proofUrl) ? (
              <img src={data.proofUrl} alt="Bukti transfer" className="mb-2 h-32 w-full rounded object-cover" />
            ) : (
              <div className="mb-2 flex h-32 w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
                Lihat Dokumen
              </div>
            )}
            <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{data.senderName || 'Tanpa nama pengirim'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{data.transferDate || '-'}</p>
          </a>
        )}
      </AdminProofUpload>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Membership & Nominal</p>
          {editMode ? (
            <button onClick={cancelEdit} className="btn btn-ghost btn-sm">
              Batal Edit
            </button>
          ) : (
            <button onClick={() => setEditMode(true)} className="btn btn-outline btn-sm">
              Override
            </button>
          )}
        </div>

        {editMode ? (
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Membership</label>
              <select
                value={isMemberDraft ? 'member' : 'non_member'}
                onChange={(e) => setIsMemberDraft(e.target.value === 'member')}
                className={inputCls}
              >
                <option value="member">Member</option>
                <option value="non_member">Non-Member</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Nominal (Rp)</label>
              <input
                type="number"
                min={0}
                value={amountDraft}
                onChange={(e) => setAmountDraft(e.target.value)}
                className={`${inputCls} w-40`}
              />
            </div>
            <button onClick={() => save.mutate()} disabled={save.isPending} className="btn btn-primary btn-sm">
              {save.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        ) : (
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Membership</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {data.isMember ? 'Member' : 'Non-Member'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nominal</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{rupiah(data.totalAmount)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Pembayaran</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{rupiah(data.totalAmount)}</p>
          <div className="mt-2">
            {data.paymentStatus === 'verified' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                &#x2713; Terverifikasi
              </span>
            ) : data.paymentStatus === 'rejected' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                &#x2717; Ditolak
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                &#x23f3; Menunggu Verifikasi
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {data.paymentStatus === 'verified' ? (
            <button onClick={() => sendReceipt.mutate()} disabled={sendReceipt.isPending} className="btn btn-outline">
              {sendReceipt.isPending ? 'Mengirim...' : 'Kirim Kwitansi'}
            </button>
          ) : (
            <button onClick={() => sendInvoice.mutate()} disabled={sendInvoice.isPending} className="btn btn-outline">
              {data.sentInvoice ? 'Kirim Ulang Invoice' : 'Kirim Invoice'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
