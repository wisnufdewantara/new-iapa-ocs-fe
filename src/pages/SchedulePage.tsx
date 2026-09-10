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

interface EligiblePaper {
  paperId: string
  paperTitle: string
  presenterName: string | null
}

interface ScheduleItem {
  schedule_id: string
  presenter_name: string
  schedule_date: string
  schedule_time: string
  session_name: string | null
  room: string | null
  type: string | null
  papers: { paper_title: string }
}

export function SchedulePage() {
  usePageTitle('Jadwal Conference')
  const queryClient = useQueryClient()
  const [conferenceId, setConferenceId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [paperId, setPaperId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [room, setRoom] = useState('')

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const { data: schedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ['schedules', conferenceId],
    queryFn: async () => (await api.get<ScheduleItem[]>(`/schedules/${conferenceId}`)).data,
    enabled: !!conferenceId,
  })

  const { data: eligiblePapers } = useQuery({
    queryKey: ['eligible-papers', conferenceId],
    queryFn: async () => (await api.get<EligiblePaper[]>(`/schedules/papers/${conferenceId}`)).data,
    enabled: !!conferenceId,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post(`/schedules/${conferenceId}`, {
        paperId,
        scheduleDate: date,
        scheduleTime: time,
        sessionName: sessionName || undefined,
        room: room || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', conferenceId] })
      toastSuccess('Jadwal berhasil ditambahkan.')
      setShowForm(false)
      setPaperId('')
      setDate('')
      setTime('')
      setSessionName('')
      setRoom('')
    },
    onError: (err) => toastError(err, 'Gagal menambahkan jadwal.'),
  })

  const columns = useMemo<ColumnDef<ScheduleItem, any>[]>(
    () => [
      { id: 'paper', accessorFn: (s) => s.papers.paper_title, header: 'Paper' },
      { accessorKey: 'presenter_name', header: 'Presenter' },
      {
        id: 'tanggal',
        accessorFn: (s) => s.schedule_date,
        header: 'Tanggal',
        cell: ({ row }) =>
          `${new Date(row.original.schedule_date).toLocaleDateString('id-ID')} · ${new Date(row.original.schedule_time).toISOString().slice(11, 16)}`,
      },
      {
        id: 'sesiRuang',
        header: 'Sesi / Ruang',
        enableGlobalFilter: false,
        cell: ({ row }) => `${row.original.session_name ?? '-'} / ${row.original.room ?? '-'}`,
      },
    ],
    [],
  )

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Jadwal Conference</h1>

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
          <button
            onClick={() => setShowForm((v) => !v)}
            className="mb-4 rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark"
          >
            {showForm ? 'Batal' : '+ Tambah Jadwal'}
          </button>

          {showForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createMutation.mutate()
              }}
              className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Paper</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    value={paperId}
                    onChange={(e) => setPaperId(e.target.value)}
                    required
                  >
                    <option value="">-- pilih paper (accepted) --</option>
                    {eligiblePapers?.map((p) => (
                      <option key={p.paperId} value={p.paperId}>
                        {p.paperTitle} — {p.presenterName ?? 'tanpa presenter'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Jam</label>
                  <input
                    type="time"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sesi</label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ruang</label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="mt-4 rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50"
              >
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          )}

          {loadingSchedules ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
          ) : (
            <DataTable
              columns={columns}
              data={schedules ?? []}
              searchPlaceholder="Cari paper/presenter..."
              emptyMessage="Belum ada jadwal."
            />
          )}
        </>
      )}
    </div>
  )
}
