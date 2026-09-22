import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/axios'

interface MyPaper {
  paperId: string
  paperTitle: string
  conferenceStatus: 'Waiting' | 'Accepted' | 'Rejected' | null
  paperStatus: string | null
  documentUrl: string | null
  reviewFeedback: string | null
}

interface MyParticipant {
  attendance_id: string
  payment_status: string | null
  total_amount: number | null
  is_member: boolean | null
}

interface TeamPayment {
  paymentId: string
  paperTitle: string
  amount: number | null
  status: string | null
}

interface MyPayments {
  teamPayments: TeamPayment[]
  participantPayment: { amount: number | null; status: string | null } | null
}

type StepState = 'done' | 'current' | 'upcoming' | 'blocked'

function Step({ title, desc, state }: { title: string; desc: string; state: StepState }) {
  const dot =
    state === 'done'
      ? 'bg-green-500'
      : state === 'current'
        ? 'bg-blue-600 dark:bg-blue-400'
        : state === 'blocked'
          ? 'bg-red-500'
          : 'bg-gray-300 dark:bg-white/15'
  const textColor =
    state === 'upcoming' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`h-3 w-3 shrink-0 rounded-full ${dot}`} />
        <span className="mt-1 w-px flex-1 bg-gray-200 dark:bg-white/10" />
      </div>
      <div className="pb-6">
        <p className={`text-sm font-semibold ${textColor}`}>{title}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
    </div>
  )
}

// Progress tracker pribadi buat Peserta — gantiin daftar-semua-conference
// yang gak ada gunanya buat conference yang udah lewat. Fokusnya "posisi
// aku sekarang di mana", bukan browsing daftar acara. Cuma pakai endpoint
// self-service yang udah ada (papers/mine, participants/mine, payment/mine)
// — belum ada endpoint sertifikat versi "punya saya sendiri", jadi step
// terakhir masih status generik, bukan link download nyata.
export function PesertaProgressDashboard() {
  const { data: paper, isLoading: loadingPaper } = useQuery({
    queryKey: ['my-paper'],
    queryFn: async () => (await api.get<MyPaper | null>('/papers/mine')).data,
  })
  const { data: participant, isLoading: loadingParticipant } = useQuery({
    queryKey: ['my-participant'],
    queryFn: async () => (await api.get<MyParticipant | null>('/participants/mine')).data,
  })
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['my-payments-dashboard'],
    queryFn: async () => (await api.get<MyPayments>('/payment/mine')).data,
  })

  const isLoading = loadingPaper || loadingParticipant || loadingPayments

  if (isLoading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat progress kamu...</p>
  }

  // Belum daftar apa-apa sama sekali — presenter maupun participant biasa.
  if (!paper && !participant) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface">
        <p className="mb-1 font-semibold text-gray-800 dark:text-gray-100">Kamu belum terdaftar di conference manapun</p>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Pilih salah satu: submit paper buat jadi presenter, atau join sebagai peserta biasa.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/papers/submit" className="btn btn-primary">
            Submit Paper
          </Link>
          <Link to="/join" className="btn btn-outline">
            Join Conference
          </Link>
        </div>
      </div>
    )
  }

  // Jalur presenter (submit paper).
  if (paper) {
    const teamPayment = payments?.teamPayments.find((p) => p.paperTitle === paper.paperTitle)
    const reviewState: StepState =
      paper.conferenceStatus === 'Accepted' ? 'done' : paper.conferenceStatus === 'Rejected' ? 'blocked' : 'current'
    const paymentState: StepState =
      paper.conferenceStatus !== 'Accepted'
        ? 'upcoming'
        : teamPayment?.status === 'verified'
          ? 'done'
          : teamPayment
            ? 'current'
            : 'upcoming'
    const certState: StepState = teamPayment?.status === 'verified' ? 'current' : 'upcoming'

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Progress Presenter</p>
        <p className="mb-6 font-semibold text-gray-800 dark:text-gray-100">{paper.paperTitle}</p>

        <Step title="Paper Disubmit" desc={paper.documentUrl ? 'Dokumen berhasil diunggah.' : 'Menunggu dokumen.'} state="done" />
        <Step
          title="Direview"
          desc={
            paper.conferenceStatus === 'Accepted'
              ? 'Paper kamu diterima.'
              : paper.conferenceStatus === 'Rejected'
                ? 'Paper kamu tidak diterima kali ini.'
                : 'Masih menunggu keputusan reviewer.'
          }
          state={reviewState}
        />
        {paper.reviewFeedback && (
          <div className="-mt-4 mb-6 ml-6 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Catatan dari Reviewer
            </p>
            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{paper.reviewFeedback}</p>
          </div>
        )}
        <Step
          title="Pembayaran"
          desc={
            paper.conferenceStatus !== 'Accepted'
              ? 'Muncul setelah paper diterima.'
              : teamPayment?.status === 'verified'
                ? 'Pembayaran sudah diverifikasi.'
                : teamPayment
                  ? `Menunggu pembayaran${teamPayment.amount ? ` — Rp${teamPayment.amount.toLocaleString('id-ID')}` : ''}.`
                  : 'Nominal belum dihitung admin.'
          }
          state={paymentState}
        />
        <Step
          title="Sertifikat"
          desc={certState === 'current' ? 'Akan dikirim admin setelah acara selesai.' : 'Muncul setelah pembayaran diverifikasi.'}
          state={certState}
        />

        {teamPayment && teamPayment.status !== 'verified' && (
          <Link to="/payment" className="btn btn-outline btn-sm mt-2">
            Ke Halaman Pembayaran
          </Link>
        )}
      </div>
    )
  }

  // Jalur participant biasa (join, bukan presenter).
  const p = participant!
  const paymentState: StepState = p.payment_status === 'verified' ? 'done' : p.total_amount != null ? 'current' : 'upcoming'
  const certState: StepState = p.payment_status === 'verified' ? 'current' : 'upcoming'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface">
      <p className="mb-6 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Progress Peserta</p>

      <Step title="Terdaftar sebagai Peserta" desc={p.is_member ? 'Status: IAPA Member.' : 'Status: Non-Member.'} state="done" />
      <Step
        title="Pembayaran"
        desc={
          p.payment_status === 'verified'
            ? 'Pembayaran sudah diverifikasi.'
            : p.total_amount != null
              ? `Menunggu pembayaran — Rp${p.total_amount.toLocaleString('id-ID')}.`
              : 'Nominal belum dihitung admin.'
        }
        state={paymentState}
      />
      <Step
        title="Sertifikat"
        desc={certState === 'current' ? 'Akan dikirim admin setelah acara selesai.' : 'Muncul setelah pembayaran diverifikasi.'}
        state={certState}
      />

      {p.payment_status !== 'verified' && (
        <Link to="/payment" className="btn btn-outline btn-sm mt-2">
          Ke Halaman Pembayaran
        </Link>
      )}
    </div>
  )
}
