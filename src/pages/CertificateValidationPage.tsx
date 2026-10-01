import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { ThemeToggle } from '../components/ThemeToggle'
import logo from '../assets/logo-iapa.png'

interface ValidationResult {
  recipientName: string
  certType: 'participant' | 'presenter' | 'best_paper' | 'best_presenter'
  eventTitle: string
  conferenceName: string
  eventDate: string
  issuedAt: string
}

const CERT_TYPE_LABEL: Record<ValidationResult['certType'], string> = {
  participant: 'Peserta',
  presenter: 'Presenter',
  best_paper: 'Best Paper',
  best_presenter: 'Best Presenter',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildStatement(data: ValidationResult) {
  const date = formatDate(data.eventDate)
  if (data.certType === 'participant') {
    return (
      <>
        Dengan ini menyatakan bahwa <strong>{data.recipientName}</strong> benar adanya telah mengikuti{' '}
        <strong>{data.conferenceName}</strong> sebagai Peserta pada tanggal {date}.
      </>
    )
  }
  if (data.certType === 'presenter') {
    return (
      <>
        Dengan ini menyatakan bahwa <strong>{data.recipientName}</strong> benar adanya telah mengikuti{' '}
        <strong>{data.conferenceName}</strong> sebagai Presenter dengan judul paper "<strong>{data.eventTitle}</strong>" pada
        tanggal {date}.
      </>
    )
  }
  return (
    <>
      Dengan ini menyatakan bahwa <strong>{data.recipientName}</strong> benar adanya telah meraih penghargaan{' '}
      <strong>{CERT_TYPE_LABEL[data.certType]}</strong> pada <strong>{data.conferenceName}</strong> dengan judul paper "
      <strong>{data.eventTitle}</strong>" pada tanggal {date}.
    </>
  )
}

export function CertificateValidationPage() {
  usePageTitle('Validasi Sertifikat')
  const { code } = useParams<{ code: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['certificate-validation', code],
    queryFn: async () => (await api.get<ValidationResult>(`/certificate-validation/${code}`)).data,
    enabled: !!code,
    retry: false,
  })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-brand-dark">
      <header className="flex items-center justify-end p-4">
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-brand-dark-surface">
          <div className="mb-6 flex justify-center">
            <img src={logo} alt="IAPA" className="h-10 w-auto" />
          </div>

          {isLoading && <p className="text-center text-sm text-gray-500 dark:text-gray-400">Memeriksa sertifikat...</p>}

          {isError && (
            <div className="text-center">
              <p className="mb-1 text-lg font-bold text-red-600 dark:text-red-400">Sertifikat Tidak Ditemukan</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kode sertifikat ini nggak valid, atau sertifikatnya sudah dicabut.
              </p>
            </div>
          )}

          {data && (
            <div>
              <div className="mb-4 flex justify-center">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  Sertifikat Valid
                </span>
              </div>
              <p className="mb-4 text-center text-xs font-semibold tracking-wide text-gray-400 uppercase">
                {CERT_TYPE_LABEL[data.certType]}
              </p>
              <p className="mb-6 text-center text-sm leading-relaxed text-gray-700 dark:text-gray-200">{buildStatement(data)}</p>
              <div className="flex flex-col items-end gap-1 text-sm text-gray-700 dark:text-gray-200">
                <span>Hormat kami,</span>
                <span className="font-bold">IAPA</span>
                <img src={logo} alt="IAPA" className="mt-1 h-8 w-auto" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
