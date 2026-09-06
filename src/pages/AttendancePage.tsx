import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '../lib/axios'
import { DataTable } from '../components/DataTable'

interface Conference {
  conference_id: string
  conference_name: string
}

interface TeamRow {
  writerId: string
  paperTitle: string
  presenterName: string
  present: boolean
}

interface ParticipantRow {
  participantId: string
  name: string
  email: string
  present: boolean
}

type Tab = 'team' | 'participant'

// Satu halaman dengan tab, gantiin 2 halaman terpisah (Attendance
// presenter vs participant) di ocs2 — sesuai keputusan simplifikasi.
export function AttendancePage() {
  const queryClient = useQueryClient()
  const [conferenceId, setConferenceId] = useState('')
  const [tab, setTab] = useState<Tab>('team')

  const { data: conferences } = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => (await api.get<Conference[]>('/conferences')).data,
  })

  const { data: teamRows, isLoading: loadingTeam } = useQuery({
    queryKey: ['attendance-team', conferenceId],
    queryFn: async () => (await api.get<TeamRow[]>(`/attendance/team/${conferenceId}`)).data,
    enabled: !!conferenceId && tab === 'team',
  })

  const { data: participantRows, isLoading: loadingParticipant } = useQuery({
    queryKey: ['attendance-participant', conferenceId],
    queryFn: async () => (await api.get<ParticipantRow[]>(`/attendance/participant/${conferenceId}`)).data,
    enabled: !!conferenceId && tab === 'participant',
  })

  const toggleTeam = useMutation({
    mutationFn: (row: TeamRow) =>
      api.patch(`/attendance/team/${conferenceId}`, { writerId: row.writerId, present: !row.present }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-team', conferenceId] }),
  })

  const toggleParticipant = useMutation({
    mutationFn: (row: ParticipantRow) =>
      api.patch(`/attendance/participant/${conferenceId}`, {
        participantId: row.participantId,
        present: !row.present,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-participant', conferenceId] }),
  })

  const teamColumns = useMemo<ColumnDef<TeamRow, any>[]>(
    () => [
      { accessorKey: 'paperTitle', header: 'Paper' },
      { accessorKey: 'presenterName', header: 'Presenter' },
      {
        id: 'hadir',
        accessorKey: 'present',
        header: 'Hadir',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.original.present}
            onChange={() => toggleTeam.mutate(row.original)}
            className="h-4 w-4"
          />
        ),
      },
    ],
    [toggleTeam],
  )

  const participantColumns = useMemo<ColumnDef<ParticipantRow, any>[]>(
    () => [
      { accessorKey: 'name', header: 'Nama' },
      { accessorKey: 'email', header: 'Email' },
      {
        id: 'hadir',
        accessorKey: 'present',
        header: 'Hadir',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.original.present}
            onChange={() => toggleParticipant.mutate(row.original)}
            className="h-4 w-4"
          />
        ),
      },
    ],
    [toggleParticipant],
  )

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Presensi</h1>

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
            <button
              onClick={() => setTab('team')}
              className={`px-4 py-2 text-sm font-medium ${
                tab === 'team'
                  ? 'border-b-2 border-brand-navy text-brand-navy dark:border-brand-orange dark:text-brand-orange'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Tim / Presenter
            </button>
            <button
              onClick={() => setTab('participant')}
              className={`px-4 py-2 text-sm font-medium ${
                tab === 'participant'
                  ? 'border-b-2 border-brand-navy text-brand-navy dark:border-brand-orange dark:text-brand-orange'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Peserta
            </button>
          </div>

          {tab === 'team' &&
            (loadingTeam ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
            ) : (
              <DataTable columns={teamColumns} data={teamRows ?? []} searchPlaceholder="Cari paper/presenter..." />
            ))}

          {tab === 'participant' &&
            (loadingParticipant ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
            ) : (
              <DataTable
                columns={participantColumns}
                data={participantRows ?? []}
                searchPlaceholder="Cari nama/email..."
              />
            ))}
        </>
      )}
    </div>
  )
}
