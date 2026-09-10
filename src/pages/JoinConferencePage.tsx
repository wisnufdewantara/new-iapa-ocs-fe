import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { useActiveConferences } from '../hooks/useActiveConferences'
import { toastSuccess, toastError } from '../lib/toast'

interface ActiveConference {
  conference_id: string
  conference_name: string
}

interface MyPaper {
  paperId: string
  paperTitle: string
}

interface Profile {
  firstName: string
  lastName: string
  email: string
  affiliation: string
  phone: string
  country: string
}

interface MyParticipant {
  conference_id: string
  is_member: boolean | null
  payment_status: string | null
  total_amount: number | null
}

const STATUS_LABEL: Record<string, string> = {
  'waiting for calculation': 'Menunggu perhitungan biaya',
  'waiting for payment': 'Menunggu pembayaran',
  'waiting for verification': 'Menunggu verifikasi',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
}

const rupiah = (n: number | null) => (n == null ? '-' : `Rp${n.toLocaleString('id-ID')}`)

export function JoinConferencePage() {
  usePageTitle('Join Conference')
  const queryClient = useQueryClient()
  const [isMember, setIsMember] = useState<'true' | 'false' | ''>('')
  const [conferenceId, setConferenceId] = useState('')

  const { data: activeConferences } = useActiveConferences<ActiveConference>()

  useEffect(() => {
    if (activeConferences && activeConferences.length > 0 && !conferenceId) {
      setConferenceId(activeConferences[0].conference_id)
    }
  }, [activeConferences, conferenceId])

  const conference = activeConferences?.find((c) => c.conference_id === conferenceId)

  const { data: myPaper, isLoading: loadingPaper } = useQuery({
    queryKey: ['papers', 'mine'],
    queryFn: async () => (await api.get<MyPaper | null>('/papers/mine')).data,
  })

  const { data: myParticipant, isLoading: loadingParticipant } = useQuery({
    queryKey: ['participants', 'mine'],
    queryFn: async () => (await api.get<MyParticipant | null>('/participants/mine')).data,
  })

  const { data: profile } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await api.get<Profile>('/auth/me')).data,
  })

  const joinMutation = useMutation({
    mutationFn: () => api.post('/participants/join', { isMember: isMember === 'true', conferenceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', 'mine'] })
      toastSuccess('Berhasil join sebagai peserta.')
    },
    onError: (err) => toastError(err, 'Gagal join conference.'),
  })

  if (loadingPaper || loadingParticipant) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  }

  // Niru arah eksklusivitas legacy: sudah presenter (submit paper) ->
  // form Join disembunyikan, bukan sebaliknya.
  if (myPaper) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Join Conference</h1>
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Anda sudah submit paper sebagai presenter (<strong>{myPaper.paperTitle}</strong>), jadi tidak perlu join
            sebagai peserta biasa.
          </p>
        </div>
      </div>
    )
  }

  if (myParticipant) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Join Conference</h1>
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface">
          <p className="text-sm text-gray-600 dark:text-gray-300">Anda sudah terdaftar sebagai peserta.</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Status keanggotaan: {myParticipant.is_member ? 'Member IAPA' : 'Non-Member'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Biaya partisipasi: {rupiah(myParticipant.total_amount)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Status pembayaran: {myParticipant.payment_status ? (STATUS_LABEL[myParticipant.payment_status] ?? myParticipant.payment_status) : '-'}
          </p>
          <Link to="/payment" className="mt-3 inline-block text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange">
            Lihat & bayar di halaman Pembayaran →
          </Link>
        </div>
      </div>
    )
  }

  if (!conference) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Join Conference</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada conference yang sedang aktif untuk di-join.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Join Conference</h1>

      {activeConferences && activeConferences.length > 1 ? (
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Pilih Conference
          </label>
          <select
            value={conferenceId}
            onChange={(e) => setConferenceId(e.target.value)}
            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          >
            {activeConferences.map((c) => (
              <option key={c.conference_id} value={c.conference_id}>
                {c.conference_name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Untuk: {conference.conference_name}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          joinMutation.mutate()
        }}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">Nama</label>
            <p className="text-sm text-gray-800 dark:text-gray-100">
              {profile ? `${profile.firstName} ${profile.lastName}` : '-'}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
            <p className="text-sm text-gray-800 dark:text-gray-100">{profile?.email ?? '-'}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">Telepon</label>
            <p className="text-sm text-gray-800 dark:text-gray-100">{profile?.phone ?? '-'}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">Afiliasi</label>
            <p className="text-sm text-gray-800 dark:text-gray-100">{profile?.affiliation ?? '-'}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">Negara</label>
            <p className="text-sm text-gray-800 dark:text-gray-100">{profile?.country ?? '-'}</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status Keanggotaan IAPA
          </label>
          <select
            value={isMember}
            onChange={(e) => setIsMember(e.target.value as 'true' | 'false' | '')}
            required
            className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          >
            <option value="">-- pilih --</option>
            <option value="true">Member IAPA</option>
            <option value="false">Non-Member</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isMember === '' || joinMutation.isPending}
          className="rounded-md bg-brand-navy px-5 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
        >
          {joinMutation.isPending ? 'Memproses...' : 'Join Sebagai Peserta'}
        </button>
      </form>

      <Link to="/dashboard" className="mt-4 inline-block text-sm text-gray-500 hover:underline dark:text-gray-400">
        ← Kembali ke Dashboard
      </Link>
    </div>
  )
}
