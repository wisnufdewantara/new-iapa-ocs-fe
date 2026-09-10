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

interface CertRow {
  attendanceId: string
  writerId?: string | null
  name: string
  sentCertificate: boolean
}

interface LoaRow {
  paperId: string
  paperTitle: string
}

interface AwardsData {
  bestPaper: { paperId: string; paperTitle: string; presenterName: string | null } | null
  bestPresenter: { writerId: string; name: string } | null
  paperCertificateSent: boolean
  presenterCertificateSent: boolean
}

interface CertificateListResponse {
  presenters: CertRow[]
  participants: CertRow[]
  awards: AwardsData
}

type Tab = 'presenter' | 'participant' | 'awards'

export function CertificateManagementPage() {
  usePageTitle('Kelola Sertifikat')
  const queryClient = useQueryClient()
  const [conferenceId, setConferenceId] = useState('')
  const [tab, setTab] = useState<Tab>('presenter')

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['certificates', conferenceId],
    queryFn: async () => (await api.get<CertificateListResponse>('/certificates', { params: { conferenceId } })).data,
    enabled: !!conferenceId,
  })

  const send = useMutation({
    mutationFn: ({ attendanceId, type }: { attendanceId: string; type: string }) =>
      api.post(`/certificates/${attendanceId}/send`, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates', conferenceId] })
      toastSuccess('Sertifikat berhasil dikirim.')
    },
    onError: (err) => toastError(err, 'Gagal mengirim sertifikat.'),
  })

  const sendAward = useMutation({
    mutationFn: (award: 'best_paper' | 'best_presenter') => api.post(`/certificates/awards/${conferenceId}/${award}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates', conferenceId] })
      toastSuccess('Sertifikat award berhasil dikirim.')
    },
    onError: (err) => toastError(err, 'Gagal mengirim sertifikat award.'),
  })

  // Reuse daftar paper Accepted dari domain LoA buat opsi Best Paper —
  // Best Presenter dari data presenters yang sudah tercatat kehadirannya
  // di tab ini (masuk akal: pemenang harus hadir).
  const { data: acceptedPapers } = useQuery({
    queryKey: ['loa', conferenceId],
    queryFn: async () => (await api.get<LoaRow[]>('/loa', { params: { conferenceId } })).data,
    enabled: !!conferenceId && tab === 'awards',
  })

  const setAward = useMutation({
    mutationFn: (body: { bestPaperId?: string; bestPresenterId?: string }) =>
      api.patch(`/conferences/${conferenceId}/awards`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates', conferenceId] })
      toastSuccess('Award berhasil diatur.')
    },
    onError: (err) => toastError(err, 'Gagal mengatur award.'),
  })

  const download = async (attendanceId: string, type: string) => {
    const res = await api.get(`/certificates/${attendanceId}/download`, { params: { type }, responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    window.open(url, '_blank')
  }

  const columnsFor = (type: 'Presenter' | 'Participant'): ColumnDef<CertRow, any>[] => [
    { accessorKey: 'name', header: 'Nama' },
    {
      id: 'status',
      accessorKey: 'sentCertificate',
      header: 'Status',
      enableGlobalFilter: false,
      cell: (c) =>
        c.getValue() ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-500/10 dark:text-green-400">
            Terkirim
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300">
            Belum
          </span>
        ),
    },
    {
      id: 'actions',
      header: '',
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="flex gap-3">
          <button
            onClick={() => download(row.original.attendanceId, type)}
            className="text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange"
          >
            Download
          </button>
          <button
            onClick={() => send.mutate({ attendanceId: row.original.attendanceId, type })}
            disabled={send.isPending}
            className="text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange"
          >
            Kirim
          </button>
        </div>
      ),
    },
  ]

  const presenterColumns = useMemo(() => columnsFor('Presenter'), [send])
  const participantColumns = useMemo(() => columnsFor('Participant'), [send])

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Kelola Sertifikat</h1>

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

      {conferenceId && (
        <>
          <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-white/10">
            {(
              [
                ['presenter', 'Presenter & Tim'],
                ['participant', 'Peserta'],
                ['awards', 'Special Awards'],
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

          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
          ) : (
            <>
              {tab === 'presenter' && (
                <DataTable columns={presenterColumns} data={data?.presenters ?? []} searchPlaceholder="Cari nama..." />
              )}
              {tab === 'participant' && (
                <DataTable columns={participantColumns} data={data?.participants ?? []} searchPlaceholder="Cari nama..." />
              )}
              {tab === 'awards' && data && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
                    <h2 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">Best Paper</h2>
                    <select
                      className="mb-3 w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                      value={data.awards.bestPaper?.paperId ?? ''}
                      onChange={(e) => setAward.mutate({ bestPaperId: e.target.value || undefined })}
                    >
                      <option value="">-- belum diatur --</option>
                      {acceptedPapers?.map((p) => (
                        <option key={p.paperId} value={p.paperId}>
                          {p.paperTitle}
                        </option>
                      ))}
                    </select>
                    {data.awards.bestPaper && (
                      <>
                        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                          Presenter: {data.awards.bestPaper.presenterName ?? '-'}
                        </p>
                        <button
                          onClick={() => sendAward.mutate('best_paper')}
                          disabled={sendAward.isPending}
                          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-40 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
                        >
                          {data.awards.paperCertificateSent ? 'Kirim Ulang' : 'Kirim Sertifikat'}
                        </button>
                        {data.awards.paperCertificateSent && (
                          <span className="ml-3 text-sm text-green-600 dark:text-green-400">Sudah terkirim</span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
                    <h2 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">Best Presenter</h2>
                    <select
                      className="mb-3 w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                      value={data.awards.bestPresenter?.writerId ?? ''}
                      onChange={(e) => setAward.mutate({ bestPresenterId: e.target.value || undefined })}
                    >
                      <option value="">-- belum diatur --</option>
                      {data.presenters
                        .filter((p) => p.writerId)
                        .map((p) => (
                          <option key={p.writerId} value={p.writerId!}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    {data.awards.bestPresenter && (
                      <>
                        <button
                          onClick={() => sendAward.mutate('best_presenter')}
                          disabled={sendAward.isPending}
                          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-40 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
                        >
                          {data.awards.presenterCertificateSent ? 'Kirim Ulang' : 'Kirim Sertifikat'}
                        </button>
                        {data.awards.presenterCertificateSent && (
                          <span className="ml-3 text-sm text-green-600 dark:text-green-400">Sudah terkirim</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
