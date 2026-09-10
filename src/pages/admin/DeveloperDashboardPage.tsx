import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { usePageTitle } from '../../hooks/usePageTitle'

interface DeveloperStatus {
  appVersion: string
  nodeVersion: string
  environment: string
  uptimeSeconds: number
  memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number }
  database: { connected: boolean; latencyMs: number }
  smtpConfigured: boolean
  counts: { users: number; conferences: number; papers: number; participants: number; payments: number }
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}j ${m}m ${s}d`
}

const ENV_STYLE: Record<string, string> = {
  production: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  staging: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  development: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-brand-dark-surface">
      <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  )
}

// Dashboard developer — admin-only (lihat DeveloperController, permission
// 'developer:view'). Cuma nampilin metrik agregat (angka, boolean,
// status) — TIDAK ADA data mentah/PII user atau secret apa pun.
export function DeveloperDashboardPage() {
  usePageTitle('Dashboard Developer')

  const { data, isLoading } = useQuery({
    queryKey: ['developer-status'],
    queryFn: async () => (await api.get<DeveloperStatus>('/developer/status')).data,
    refetchInterval: 15000,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dashboard Developer</h1>
        {data && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${ENV_STYLE[data.environment] ?? ENV_STYLE.development}`}>
            {data.environment}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Halaman ini cuma buat monitoring status sistem — tidak menampilkan data pribadi pengguna atau kredensial apa pun.
      </p>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>}

      {data && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card title="Aplikasi">
            <p className="text-sm text-gray-600 dark:text-gray-300">Versi: {data.appVersion}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Node.js: {data.nodeVersion}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Uptime: {formatUptime(data.uptimeSeconds)}</p>
          </Card>

          <Card title="Database">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Status:{' '}
              {data.database.connected ? (
                <span className="text-green-600 dark:text-green-400">Terhubung</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">Terputus</span>
              )}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Latency: {data.database.latencyMs}ms</p>
          </Card>

          <Card title="Memory">
            <p className="text-sm text-gray-600 dark:text-gray-300">RSS: {data.memory.rssMb} MB</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Heap: {data.memory.heapUsedMb} / {data.memory.heapTotalMb} MB
            </p>
          </Card>

          <Card title="SMTP">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {data.smtpConfigured ? (
                <span className="text-green-600 dark:text-green-400">Terkonfigurasi</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Belum diisi</span>
              )}
            </p>
          </Card>

          <Card title="Jumlah Data">
            <ul className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
              <li>Users: {data.counts.users}</li>
              <li>Conferences: {data.counts.conferences}</li>
              <li>Papers: {data.counts.papers}</li>
              <li>Participants: {data.counts.participants}</li>
              <li>Payments: {data.counts.payments}</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
