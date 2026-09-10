import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'

interface TeamPayment {
  paymentId: string
  paperTitle: string
  amount: number | null
  transferAmount: number | null
  status: string | null
  description: string | null
  sentInvoice: boolean
}

interface ParticipantPayment {
  attendanceId: string
  amount: number | null
  transferAmount: number | null
  status: string | null
  description: string | null
  sentInvoice: boolean
}

interface MineResponse {
  teamPayments: TeamPayment[]
  participantPayment: ParticipantPayment | null
  bank: { bankName: string; bankHolder: string; bankAccountNumber: string }
}

const rupiah = (n: number | null) => (n == null ? '-' : `Rp${n.toLocaleString('id-ID')}`)

const STATUS_LABEL: Record<string, string> = {
  'waiting for calculation': 'Menunggu perhitungan',
  'waiting for payment': 'Menunggu pembayaran',
  'waiting for verification': 'Menunggu verifikasi',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
}

function PaymentCard({
  title,
  amount,
  transferAmount,
  status,
  description,
  bank,
  onUpload,
  uploading,
}: {
  title: string
  amount: number | null
  transferAmount: number | null
  status: string | null
  description: string | null
  bank: MineResponse['bank']
  onUpload: (file: File, senderName: string, transferDate: string) => void
  uploading: boolean
}) {
  const [senderName, setSenderName] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const canUpload = status === 'waiting for payment' || status === 'rejected'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
      <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">Nominal: {rupiah(amount)}</p>
      {transferAmount != null && (
        <p className="text-sm font-semibold text-brand-navy dark:text-brand-orange">
          Jumlah yang harus ditransfer (dengan kode unik): {rupiah(transferAmount)}
        </p>
      )}
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Status: {status ? (STATUS_LABEL[status] ?? status) : '-'}
      </p>
      {status === 'rejected' && description && (
        <p className="mt-1 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          Alasan ditolak: {description}
        </p>
      )}

      {bank.bankAccountNumber && (
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
          Transfer ke <strong>{bank.bankName}</strong> a.n. <strong>{bank.bankHolder}</strong> — No. Rek{' '}
          <strong>{bank.bankAccountNumber}</strong>
        </div>
      )}

      {canUpload && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (file) onUpload(file, senderName, transferDate)
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bukti Transfer (gambar/PDF)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 dark:text-gray-300"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Pengirim</label>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Transfer</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!file || uploading}
            className="self-start rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
          >
            {uploading ? 'Mengunggah...' : 'Upload Bukti Transfer'}
          </button>
        </form>
      )}
    </div>
  )
}

export function PaymentPage() {
  usePageTitle('Pembayaran Saya')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['payment-mine'],
    queryFn: async () => (await api.get<MineResponse>('/payment/mine')).data,
  })

  const uploadMutation = useMutation({
    mutationFn: ({
      paymentId,
      file,
      senderName,
      transferDate,
    }: {
      paymentId?: string
      file: File
      senderName: string
      transferDate: string
    }) => {
      const form = new FormData()
      form.append('proof', file)
      if (paymentId) form.append('paymentId', paymentId)
      form.append('senderName', senderName)
      form.append('transferDate', transferDate)
      return api.post('/payment/mine/proof', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-mine'] })
      toastSuccess('Bukti transfer berhasil diupload.')
    },
    onError: (err) => toastError(err, 'Gagal mengupload bukti transfer.'),
  })

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>

  const hasAny = (data?.teamPayments.length ?? 0) > 0 || !!data?.participantPayment

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Pembayaran Saya</h1>

      {!hasAny && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada tagihan pembayaran untuk Anda saat ini.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {data?.teamPayments.map((tp) => (
          <PaymentCard
            key={tp.paymentId}
            title={`Biaya Presenter — ${tp.paperTitle}`}
            amount={tp.amount}
            transferAmount={tp.transferAmount}
            status={tp.status}
            description={tp.description}
            bank={data.bank}
            uploading={uploadMutation.isPending}
            onUpload={(file, senderName, transferDate) =>
              uploadMutation.mutate({ paymentId: tp.paymentId, file, senderName, transferDate })
            }
          />
        ))}

        {data?.participantPayment && (
          <PaymentCard
            title="Biaya Partisipasi Peserta"
            amount={data.participantPayment.amount}
            transferAmount={data.participantPayment.transferAmount}
            status={data.participantPayment.status}
            description={data.participantPayment.description}
            bank={data.bank}
            uploading={uploadMutation.isPending}
            onUpload={(file, senderName, transferDate) => uploadMutation.mutate({ file, senderName, transferDate })}
          />
        )}
      </div>
    </div>
  )
}
