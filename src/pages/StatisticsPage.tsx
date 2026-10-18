import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { errorMessage } from '../lib/toast'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatNumber, monthLabel, percent, spansYears, weekLabel } from '../lib/format'
import type { OverviewStats } from '../types/stats'
import { ConferenceFilter } from '../components/dashboard/ConferenceFilter'
import { useConferenceFilter } from '../components/dashboard/useConferenceFilter'
import { StatTile } from '../components/dashboard/StatTile'
import { Meter } from '../components/dashboard/Meter'
import { ChartCard } from '../components/dashboard/ChartCard'
import { HBarList } from '../components/dashboard/HBarList'
import { StackedBar, type StackSeries } from '../components/dashboard/StackedBar'
import { WeeklyColumns } from '../components/dashboard/WeeklyColumns'

// Keputusan paper memang status (baik/buruk/menunggu), jadi pakai warna
// status + ikon — bukan warna kategorikal — dan legendanya selalu ada.
// Ditolak pakai warna 'serious' (merah spec), bukan 'critical': di dark
// mode critical (#f49a9a) kedempetan sama oranye Menunggu (ΔE 12, gagal
// validator); grafik ini nggak punya segmen "belum bayar" jadi merahnya
// nggak bentrok. Ikonnya tetap 'critical'.
const DECISION_SERIES: StackSeries[] = [
  { key: 'accepted', label: 'Diterima', color: 'good', icon: 'good' },
  { key: 'waiting', label: 'Menunggu', color: 'warning', icon: 'warning' },
  { key: 'rejected', label: 'Ditolak', color: 'serious', icon: 'critical' },
]

// Statistik conference — pengganti Conference Dashboard ocs2, plus
// kesehatan review, tren mingguan, afiliasi/negara, presensi, dan akun.
// Endpoint-nya cuma balikin agregat (nggak ada nama/email), jadi aman
// dibuka role Manager yang nggak boleh lihat data keuangan.
export function StatisticsPage() {
  usePageTitle('Statistik')
  const filter = useConferenceFilter()

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['stats-overview', filter.conferenceId],
    queryFn: async () =>
      (
        await api.get<OverviewStats>('/stats/overview', {
          params: filter.conferenceId ? { conferenceId: filter.conferenceId } : undefined,
        })
      ).data,
    enabled: filter.ready,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

  return (
    <div className="viz-root">
      <h1 className="mb-1 text-xl font-bold text-iapa-navy dark:text-gray-100">Statistik</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Paper, review, peserta, dan presensi. Angka agregat saja — detail per orang ada di halaman masing-masing.
      </p>

      <ConferenceFilter value={filter.conferenceId} onChange={filter.setConferenceId} updatedAt={data?.generatedAt} />

      {!data && (isLoading || !filter.ready) && <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>}
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          {errorMessage(error, 'Gagal memuat data dari server.')}
        </p>
      )}

      {data && (
        <div
          className="flex flex-col gap-6 transition-opacity duration-200"
          style={{ opacity: isFetching ? 0.55 : 1 }}
          aria-busy={isFetching}
        >
          <StatisticsBody data={data} />
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{children}</h2>
  )
}

// Di atas ini grafik paper masuk dirangkum per bulan — tanpa filter
// conference rentangnya dari upload paling lama (data sistem lama) sampai
// terbaru, bisa ratusan minggu: batangnya jadi setipis 1px dan tabelnya
// ratusan baris.
const MAX_WEEKS = 60

interface PaperPoint {
  key: string
  count: number
  axisLabel: string
  fullLabel: string
  tableLabel: string
}

function paperSeries(weeks: OverviewStats['weekly']['papers']): { byMonth: boolean; points: PaperPoint[] } {
  if (weeks.length <= MAX_WEEKS) {
    const withYear = spansYears(weeks.map((w) => w.weekStart))
    return {
      byMonth: false,
      points: weeks.map((w) => ({
        key: w.weekStart,
        count: w.count,
        axisLabel: weekLabel(w.weekStart, withYear),
        fullLabel: `Minggu ${weekLabel(w.weekStart, true)}`,
        tableLabel: weekLabel(w.weekStart, true),
      })),
    }
  }
  // Minggu masuk ke bulan hari Senin-nya — cukup buat lihat tren, selisih
  // beberapa hari di batas bulan nggak ngaruh. Backend udah ngisi minggu
  // kosong, jadi bulan kosong tetap muncul (nol), nggak bolong.
  const months = new Map<string, number>()
  for (const w of weeks) {
    const m = w.weekStart.slice(0, 7)
    months.set(m, (months.get(m) ?? 0) + w.count)
  }
  return {
    byMonth: true,
    points: [...months].map(([m, count]) => {
      const label = monthLabel(m)
      return { key: m, count, axisLabel: label, fullLabel: label, tableLabel: label }
    }),
  }
}

function StatisticsBody({ data }: { data: OverviewStats }) {
  const { papers, review, people, attendance, accounts, weekly } = data
  const share = (n: number, of: number) => (of > 0 ? percent(n / of, 0) : '-')
  const paperTrend = paperSeries(weekly.papers)
  const accountsWithYear = spansYears(weekly.accounts.map((w) => w.weekStart))

  return (
    <>
      <section>
        <SectionTitle>Paper</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <StatTile label="Total paper" illustration="documentText" value={formatNumber(papers.total)} />
          <StatTile
            label="Diterima"
            icon="good"
            illustration="checkCircle"
            value={formatNumber(papers.accepted)}
            sub={`${share(papers.accepted, papers.total)} dari total`}
          />
          <StatTile
            label="Ditolak"
            icon="critical"
            illustration="xCircle"
            value={formatNumber(papers.rejected)}
            sub={`${share(papers.rejected, papers.total)} dari total`}
          />
          <StatTile
            label="Menunggu keputusan"
            icon="warning"
            illustration="clock"
            value={formatNumber(papers.waiting)}
            sub={`${share(papers.waiting, papers.total)} dari total`}
          />
          <StatTile
            label="LoA terkirim"
            illustration="paperAirplane"
            value={formatNumber(papers.loaSent)}
            sub={`${share(papers.loaSent, papers.accepted)} dari paper diterima`}
          />
        </div>
      </section>

      <section>
        <SectionTitle>Kesehatan review</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label="Paper belum punya reviewer"
            illustration="userPlus"
            value={formatNumber(review.unassignedWaiting)}
            muted={review.unassignedWaiting === 0}
            hint="Buka Assign Reviewer →"
            to="/papers/assign-reviewer"
          />
          <StatTile
            label="Penugasan lewat tenggat"
            illustration="calendar"
            value={formatNumber(review.overdueAssignments)}
            muted={review.overdueAssignments === 0}
            hint="Paper masih menunggu, deadline reviewer sudah lewat →"
            to="/papers/assign-reviewer"
          />
          <StatTile
            label="Balasan penulis belum dijawab"
            illustration="chat"
            value={formatNumber(review.feedbackAwaitingReply)}
            muted={review.feedbackAwaitingReply === 0}
            hint="Buka Review Paper →"
            to="/papers/review"
          />
        </div>
      </section>

      <section>
        <SectionTitle>Orang</SectionTitle>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatTile
            label="Presenter"
            illustration="presentation"
            value={formatNumber(people.presenters)}
            sub="penulis unik di paper diterima"
          />
          <StatTile
            label="Peserta"
            illustration="users"
            value={formatNumber(people.participants)}
            sub="terdaftar sebagai peserta"
          />
          <StatTile
            label="Presenter member"
            illustration="idCard"
            value={formatNumber(people.presenterMembers)}
            sub={`${share(people.presenterMembers, people.presenters)} dari presenter`}
          />
          <StatTile
            label="Peserta member"
            illustration="idCard"
            value={formatNumber(people.participantMembers)}
            sub={`${share(people.participantMembers, people.participants)} dari peserta`}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Keputusan per sub tema"
          caption="Panjang batang = jumlah paper di sub tema itu."
          table={{
            columns: [
              { label: 'Sub tema' },
              { label: 'Diterima', numeric: true },
              { label: 'Menunggu', numeric: true },
              { label: 'Ditolak', numeric: true },
              { label: 'Total', numeric: true },
            ],
            rows: papers.bySubTheme.map((s) => ({
              key: s.subTheme,
              cells: [
                s.subTheme,
                formatNumber(s.accepted),
                formatNumber(s.waiting),
                formatNumber(s.rejected),
                formatNumber(s.accepted + s.waiting + s.rejected),
              ],
            })),
          }}
        >
          <StackedBar
            series={DECISION_SERIES}
            scale="absolute"
            legendTotals
            formatValue={formatNumber}
            emptyMessage="Belum ada paper."
            rows={papers.bySubTheme.map((s) => ({
              key: s.subTheme,
              label: s.subTheme,
              values: [s.accepted, s.waiting, s.rejected],
            }))}
          />
        </ChartCard>

        <div className="flex flex-col gap-6">
          <ChartCard
            title="Tipe presentasi"
            table={{
              columns: [{ label: 'Tipe' }, { label: 'Paper', numeric: true }],
              rows: papers.byType.map((t) => ({ key: t.type, cells: [t.type, formatNumber(t.count)] })),
            }}
          >
            <HBarList
              formatValue={formatNumber}
              unitLabel="paper"
              items={papers.byType.map((t) => ({ key: t.type, label: t.type, value: t.count }))}
            />
          </ChartCard>

          <ChartCard
            title="Presensi"
            caption="Dari data presensi conference."
            table={{
              columns: [{ label: 'Kelompok' }, { label: 'Hadir', numeric: true }, { label: 'Terdaftar', numeric: true }],
              rows: [
                {
                  key: 'presenter',
                  cells: ['Presenter', formatNumber(attendance.presenterPresent), formatNumber(attendance.presenterTotal)],
                },
                {
                  key: 'participant',
                  cells: [
                    'Peserta',
                    formatNumber(attendance.participantPresent),
                    formatNumber(attendance.participantTotal),
                  ],
                },
              ],
            }}
            footer={
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Sertifikat terkirim:{' '}
                <strong className="font-semibold text-gray-800 dark:text-gray-100">
                  {formatNumber(attendance.certificatesSent)}
                </strong>
              </p>
            }
          >
            <div className="flex flex-col gap-4">
              <AttendanceMeter label="Presenter hadir" present={attendance.presenterPresent} total={attendance.presenterTotal} />
              <AttendanceMeter
                label="Peserta hadir"
                present={attendance.participantPresent}
                total={attendance.participantTotal}
              />
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title={paperTrend.byMonth ? 'Paper masuk per bulan' : 'Paper masuk per minggu'}
          caption={
            paperTrend.byMonth
              ? 'Berdasarkan tanggal unggah paper. Rentangnya panjang, jadi dirangkum per bulan.'
              : 'Berdasarkan tanggal unggah paper.'
          }
          table={{
            columns: [
              { label: paperTrend.byMonth ? 'Bulan' : 'Minggu (mulai Senin)' },
              { label: 'Paper', numeric: true },
            ],
            rows: paperTrend.points.map((p) => ({
              key: p.key,
              cells: [p.tableLabel, formatNumber(p.count)],
            })),
          }}
        >
          <WeeklyColumns
            ariaLabel={paperTrend.byMonth ? 'Jumlah paper masuk per bulan' : 'Jumlah paper masuk per minggu'}
            stepLabel={paperTrend.byMonth ? 'bulan' : 'minggu'}
            valueLabel="paper"
            integer
            formatValue={formatNumber}
            formatTick={formatNumber}
            points={paperTrend.points.map((p) => ({
              key: p.key,
              axisLabel: p.axisLabel,
              fullLabel: p.fullLabel,
              value: p.count,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Akun baru per minggu"
          caption="Semua conference, 26 minggu terakhir — tidak ikut filter conference."
          table={{
            columns: [{ label: 'Minggu (mulai Senin)' }, { label: 'Akun baru', numeric: true }],
            rows: weekly.accounts.map((w) => ({
              key: w.weekStart,
              cells: [weekLabel(w.weekStart, true), formatNumber(w.count)],
            })),
          }}
        >
          <WeeklyColumns
            ariaLabel="Jumlah akun baru per minggu"
            valueLabel="akun baru"
            integer
            formatValue={formatNumber}
            formatTick={formatNumber}
            points={weekly.accounts.map((w) => ({
              key: w.weekStart,
              axisLabel: weekLabel(w.weekStart, accountsWithYear),
              fullLabel: `Minggu ${weekLabel(w.weekStart, true)}`,
              value: w.count,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Afiliasi teratas"
          caption="Presenter (penulis paper diterima) + peserta, 10 teratas."
          table={{
            columns: [{ label: 'Afiliasi' }, { label: 'Orang', numeric: true }],
            rows: people.topAffiliations.map((a) => ({ key: a.affiliation, cells: [a.affiliation, formatNumber(a.count)] })),
          }}
        >
          <HBarList
            formatValue={formatNumber}
            unitLabel="orang"
            items={people.topAffiliations.map((a) => ({ key: a.affiliation, label: a.affiliation, value: a.count }))}
          />
        </ChartCard>

        <ChartCard
          title="Negara"
          caption="Peserta + pengunggah paper diterima, 10 teratas."
          table={{
            columns: [{ label: 'Negara' }, { label: 'Orang', numeric: true }],
            rows: people.countries.map((c) => ({ key: c.country, cells: [c.country, formatNumber(c.count)] })),
          }}
        >
          <HBarList
            formatValue={formatNumber}
            unitLabel="orang"
            items={people.countries.map((c) => ({ key: c.country, label: c.country, value: c.count }))}
          />
        </ChartCard>

        <ChartCard
          title={`Akun per role · total ${formatNumber(accounts.total)}`}
          caption="Semua akun di sistem — tidak ikut filter conference."
          table={{
            columns: [{ label: 'Role' }, { label: 'Akun', numeric: true }],
            rows: accounts.byRole.map((r) => ({ key: r.role, cells: [r.role, formatNumber(r.count)] })),
          }}
        >
          <HBarList
            formatValue={formatNumber}
            unitLabel="akun"
            items={accounts.byRole.map((r) => ({ key: r.role, label: r.role, value: r.count }))}
          />
        </ChartCard>
      </div>
    </>
  )
}

function AttendanceMeter({ label, present, total }: { label: string; present: number; total: number }) {
  const ratio = total > 0 ? present / total : 0
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="tabular-nums text-gray-800 dark:text-gray-100">
          <strong className="font-semibold">{formatNumber(present)}</strong>
          <span className="text-gray-500 dark:text-gray-400">
            {' '}
            / {formatNumber(total)} {total > 0 && `· ${percent(ratio, 0)}`}
          </span>
        </span>
      </div>
      <Meter value={ratio} label={`${label}: ${formatNumber(present)} dari ${formatNumber(total)}`} />
    </div>
  )
}
