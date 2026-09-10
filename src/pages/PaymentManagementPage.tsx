import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '../lib/axios'
import { DataTable } from '../components/DataTable'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'

interface Conference {
  conference_id: string
  conference_name: string
}

interface TeamRow {
  paymentId: string
  paperTitle: string
  presenterNames: string
  amount: number | null
  status: string | null
  sentInvoice: boolean
}

interface ParticipantRow {
  attendanceId: string
  name: string
  amount: number | null
  status: string | null
  sentInvoice: boolean
}

interface PaymentType {
  payment_type_id: string
  label: string
  type_key: string
  unique_code: string | null
}

type Tab = 'team' | 'participant' | 'types'

const rupiah = (n: number | null) => (n == null ? '-' : `Rp${n.toLocaleString('id-ID')}`)

function StatusBadge({ status }: { status: string | null }) {
  const color =
    status === 'verified'
      ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
      : status === 'rejected'
        ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
        : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
  return <span className={`rounded-full px-2 py-0.5 text-xs ${color}`}>{status ?? '-'}</span>
}

export function PaymentManagementPage() {
  usePageTitle('Kelola Pembayaran')
  const queryClient = useQueryClient()
  const [conferenceId, setConferenceId] = useState('')
  const [tab, setTab] = useState<Tab>('team')

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['payment-list', conferenceId],
    queryFn: async () =>
      (await api.get<{ team: TeamRow[]; participants: ParticipantRow[] }>('/payment', { params: { conferenceId } }))
        .data,
    enabled: !!conferenceId,
  })

  const { data: paymentTypes } = useQuery({
    queryKey: ['payment-types'],
    queryFn: async () => (await api.get<PaymentType[]>('/payment-types')).data,
  })

  const verifyTeam = useMutation({
    mutationFn: ({ paymentId, action, reason }: { paymentId: string; action: 'accept' | 'reject'; reason?: string }) =>
      api.post(`/payment/${paymentId}/verify`, { action, reason }),
    onSuccess: (_data, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['payment-list', conferenceId] })
      toastSuccess(`Pembayaran berhasil di-${action === 'accept' ? 'accept' : 'reject'}.`)
    },
    onError: (err) => toastError(err, 'Gagal memverifikasi pembayaran.'),
  })

  const verifyParticipant = useMutation({
    mutationFn: ({
      attendanceId,
      action,
      reason,
    }: {
      attendanceId: string
      action: 'accept' | 'reject'
      reason?: string
    }) => api.post(`/payment/participant/${attendanceId}/verify`, { action, reason }),
    onSuccess: (_data, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['payment-list', conferenceId] })
      toastSuccess(`Pembayaran berhasil di-${action === 'accept' ? 'accept' : 'reject'}.`)
    },
    onError: (err) => toastError(err, 'Gagal memverifikasi pembayaran.'),
  })

  const sendInvoiceTeam = useMutation({
    mutationFn: (paymentId: string) => api.post(`/payment/${paymentId}/send-invoice`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-list', conferenceId] })
      toastSuccess('Invoice berhasil dikirim.')
    },
    onError: (err) => toastError(err, 'Gagal mengirim invoice.'),
  })

  const sendInvoiceParticipant = useMutation({
    mutationFn: (attendanceId: string) => api.post(`/payment/participant/${attendanceId}/send-invoice`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-list', conferenceId] })
      toastSuccess('Invoice berhasil dikirim.')
    },
    onError: (err) => toastError(err, 'Gagal mengirim invoice.'),
  })

  const updateUniqueCode = useMutation({
    mutationFn: ({ id, uniqueCode }: { id: string; uniqueCode: string }) =>
      api.put(`/payment-types/${id}`, { uniqueCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] })
      toastSuccess('Kode unik berhasil diubah.')
    },
    onError: (err) => toastError(err, 'Gagal mengubah kode unik.'),
  })

  const reject = (onReject: (reason: string) => void) => {
    const reason = window.prompt('Alasan reject (wajib diisi):')
    if (reason && reason.trim()) onReject(reason.trim())
  }

  const teamColumns = useMemo<ColumnDef<TeamRow, any>[]>(
    () => [
      { accessorKey: 'paperTitle', header: 'Paper' },
      { accessorKey: 'presenterNames', header: 'Presenter' },
      { accessorKey: 'amount', header: 'Nominal', cell: (c) => rupiah(c.getValue() as number | null) },
      { id: 'status', accessorKey: 'status', header: 'Status', enableGlobalFilter: false, cell: (c) => <StatusBadge status={c.getValue() as string | null} /> },
      {
        id: 'actions',
        header: '',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => verifyTeam.mutate({ paymentId: row.original.paymentId, action: 'accept' })}
              className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
            >
              Accept
            </button>
            <button
              onClick={() =>
                reject((reason) => verifyTeam.mutate({ paymentId: row.original.paymentId, action: 'reject', reason }))
              }
              className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
            >
              Reject
            </button>
            <button
              onClick={() => sendInvoiceTeam.mutate(row.original.paymentId)}
              className="text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange"
            >
              {row.original.sentInvoice ? 'Kirim Ulang Invoice' : 'Kirim Invoice'}
            </button>
          </div>
        ),
      },
    ],
    [verifyTeam, sendInvoiceTeam],
  )

  const participantColumns = useMemo<ColumnDef<ParticipantRow, any>[]>(
    () => [
      { accessorKey: 'name', header: 'Nama' },
      { accessorKey: 'amount', header: 'Nominal', cell: (c) => rupiah(c.getValue() as number | null) },
      { id: 'status', accessorKey: 'status', header: 'Status', enableGlobalFilter: false, cell: (c) => <StatusBadge status={c.getValue() as string | null} /> },
      {
        id: 'actions',
        header: '',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => verifyParticipant.mutate({ attendanceId: row.original.attendanceId, action: 'accept' })}
              className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
            >
              Accept
            </button>
            <button
              onClick={() =>
                reject((reason) =>
                  verifyParticipant.mutate({ attendanceId: row.original.attendanceId, action: 'reject', reason }),
                )
              }
              className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
            >
              Reject
            </button>
            <button
              onClick={() => sendInvoiceParticipant.mutate(row.original.attendanceId)}
              className="text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange"
            >
              {row.original.sentInvoice ? 'Kirim Ulang Invoice' : 'Kirim Invoice'}
            </button>
          </div>
        ),
      },
    ],
    [verifyParticipant, sendInvoiceParticipant],
  )

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Kelola Pembayaran</h1>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Conference</label>
        <select
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          value={conferenceId}
          onChange={(e) => setConferenceId(e.target.value)}
        >
          <option value="">-- pilih conference --</option>
          {conferences?.map((c) => (
            <option key={c.conference_id} value={c.conference_id}>
              {c.conference_name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-white/10">
        {(
          [
            ['team', 'Tim / Presenter'],
            ['participant', 'Peserta'],
            ['types', 'Kode Unik'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === key
                ? 'border-b-2 border-brand-navy text-brand-navy dark:border-brand-orange dark:text-brand-orange'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== 'types' && !conferenceId && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Pilih conference dulu.</p>
      )}

      {tab === 'team' && conferenceId && (isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
      ) : (
        <DataTable columns={teamColumns} data={data?.team ?? []} searchPlaceholder="Cari paper/presenter..." />
      ))}

      {tab === 'participant' && conferenceId && (isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
      ) : (
        <DataTable columns={participantColumns} data={data?.participants ?? []} searchPlaceholder="Cari nama..." />
      ))}

      {tab === 'types' && (
        <div className="flex flex-col gap-3">
          {paymentTypes?.map((t) => (
            <div
              key={t.payment_type_id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-brand-dark-surface"
            >
              <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">{t.label}</label>
              <input
                defaultValue={t.unique_code ?? ''}
                maxLength={3}
                className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                onBlur={(e) => {
                  if (e.target.value !== t.unique_code) {
                    updateUniqueCode.mutate({ id: t.payment_type_id, uniqueCode: e.target.value })
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
