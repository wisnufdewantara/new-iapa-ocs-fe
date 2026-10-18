import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { errorMessage } from '../lib/toast'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  dateShort,
  formatNumber,
  percent,
  rupiah,
  rupiahCompact,
  rupiahTick,
  spansYears,
  weekLabel,
} from '../lib/format'
import type { FinanceStats } from '../types/stats'
import { ConferenceFilter } from '../components/dashboard/ConferenceFilter'
import { useConferenceFilter } from '../components/dashboard/useConferenceFilter'
import { HeroFigure } from '../components/dashboard/HeroFigure'
import { Meter } from '../components/dashboard/Meter'
import { StatTile } from '../components/dashboard/StatTile'
import { ChartCard } from '../components/dashboard/ChartCard'
import { StackedBar, type StackSeries } from '../components/dashboard/StackedBar'
import { WeeklyColumns } from '../components/dashboard/WeeklyColumns'
import { StatusLabel } from '../components/dashboard/viz'
import { paymentStatusMeta } from '../components/dashboard/vizTokens'

const SEGMENT_LABEL: Record<string, string> = { presenter: 'Presenter', participant: 'Peserta' }

// Posisi uang per tagihan. Warna status (bukan kategorikal) karena tiap
// seri memang berarti baik/perlu tindakan; "belum dihitung" abu-abu
// karena itu estimasi, bukan status bayar.
const MONEY_SERIES: StackSeries[] = [
  { key: 'collected', label: 'Terkumpul', color: 'good', icon: 'good' },
  { key: 'awaiting', label: 'Menunggu verifikasi', color: 'warning', icon: 'warning' },
  { key: 'outstanding', label: 'Belum bayar', color: 'serious', icon: 'serious' },
  { key: 'estimate', label: 'Belum dihitung (estimasi)', color: 'neutral', icon: 'neutral' },
]

const MEMBERSHIP_SERIES: StackSeries[] = [
  { key: 'collected', label: 'Terkumpul', color: 'good', icon: 'good' },
  { key: 'rest', label: 'Belum terkumpul', color: 'neutral' },
]

// Dashboard Keuangan — pengganti Payment Dashboard ocs2, tapi ngitung
// DUA sumber tagihan (presenter di payments + peserta di participant;
// ocs2 cuma presenter), dan "lunas" = verified saja (ocs2 dulu ngitung
// bukti ditolak/menunggu verifikasi sebagai "Paid"). Nominal tanpa kode
// unik transfer — kode unik itu global per tipe, nggak tersimpan per
// tagihan, jadi nggak bisa direkonstruksi buat tagihan lama.
export function FinanceDashboardPage() {
  usePageTitle('Dashboard Keuangan')
  const filter = useConferenceFilter()

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['stats-finance', filter.conferenceId],
    queryFn: async () =>
      (
        await api.get<FinanceStats>('/stats/finance', {
          params: filter.conferenceId ? { conferenceId: filter.conferenceId } : undefined,
        })
      ).data,
    enabled: filter.ready,
    // Ganti conference: render lama tetap tampil (diredupkan), bukan skeleton
    placeholderData: keepPreviousData,
    // Agregat berat — jangan refetch tiap pindah tab browser
    staleTime: 60_000,
  })

  return (
    <div className="viz-root">
      <h1 className="mb-1 text-xl font-bold text-iapa-navy dark:text-gray-100">Dashboard Keuangan</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Tagihan presenter (per paper) dan peserta. Semua nominal tanpa kode unik transfer.
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
          <FinanceBody data={data} />
        </div>
      )}
    </div>
  )
}

function FinanceBody({ data }: { data: FinanceStats }) {
  const t = data.totals
  const segLabel = (key: string) => data.segments.find((s) => s.key === key)?.label ?? SEGMENT_LABEL[key] ?? key

  const notes: ReactNode[] = []
  if (t.zeroAmountCount > 0)
    notes.push(
      <>
        <strong>{formatNumber(t.zeroAmountCount)}</strong> tagihan peserta bernominal 0/kosong dan belum terverifikasi
        — perlu dicek (umumnya sisa data sistem lama). Tidak ikut dihitung di angka uang.
      </>,
    )
  if (t.otherStatusCount > 0)
    notes.push(
      <>
        <strong>{formatNumber(t.otherStatusCount)}</strong> tagihan punya status yang tidak dikenal — ditampilkan
        sebagai "Status lain".
      </>,
    )
  if (data.nonAcceptedVerifiedCount > 0)
    notes.push(
      <>
        <strong>{formatNumber(data.nonAcceptedVerifiedCount)}</strong> pembayaran presenter sudah terverifikasi tapi
        paper-nya tidak lagi berstatus Accepted — tetap dihitung sebagai dana terkumpul.
      </>,
    )

  const statusRows = data.statusBreakdown.filter(
    (s) => s.presenterCount + s.participantCount > 0 || s.status !== 'other',
  )
  const statusSeries: StackSeries[] = statusRows.map((s) => {
    const meta = paymentStatusMeta(s.status)
    return { key: s.status, label: s.label || meta.label, color: meta.color, icon: meta.icon }
  })

  // Backend naruh estimasi tagihan presenter yang belum dihitung (status
  // 'waiting for calculation') di dalam `outstanding`, dan estimasi cuma
  // ada di presenter — jadi dipecah di sini biar nggak kegambar sebagai
  // utang pasti. Dibatasi outstanding segmennya buat jaga-jaga kalau ada
  // tagihan NULL yang statusnya bukan 'waiting for calculation'.
  const estimateOf = (s: FinanceStats['segments'][number]) =>
    s.key === 'presenter' ? Math.min(t.uncalculatedEstimate, s.outstanding) : 0
  const weeklyWithYear = spansYears(data.weeklyVerified.map((w) => w.weekStart))

  const membershipRows = data.membership.flatMap((m) => [
    { key: `${m.segment}-member`, label: `${segLabel(m.segment)} · Member`, ...m.member },
    { key: `${m.segment}-non`, label: `${segLabel(m.segment)} · Non-member`, ...m.nonMember },
  ])

  return (
    <>
      <HeroFigure label="Total Dana Terkumpul" value={rupiah(t.collected)}>
        <Meter
          value={t.collectionRate}
          color="good"
          trackColor="var(--viz-meter-track)"
          label="Dana terkumpul dibanding total tagihan"
          className="h-3"
        />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          <strong className="font-semibold text-gray-800 dark:text-gray-100">{percent(t.collectionRate)}</strong> dari
          total tagihan <span title={rupiah(t.billed)}>{rupiah(t.billed)}</span> · {formatNumber(t.collectedCount)}{' '}
          tagihan lunas (terverifikasi)
        </p>
      </HeroFigure>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatTile
          label="Total tagihan"
          illustration="documentText"
          value={rupiahCompact(t.billed)}
          title={rupiah(t.billed)}
          sub={`${formatNumber(t.billedCount)} tagihan`}
          hint={t.uncalculatedEstimate > 0 ? `Termasuk estimasi ${rupiahCompact(t.uncalculatedEstimate)}` : undefined}
        />
        <StatTile
          label="Terkumpul"
          icon="good"
          illustration="handshake"
          value={rupiahCompact(t.collected)}
          title={rupiah(t.collected)}
          sub={`${formatNumber(t.collectedCount)} tagihan`}
        />
        <StatTile
          label="Menunggu verifikasi"
          icon="warning"
          illustration="clock"
          value={rupiahCompact(t.awaitingVerification)}
          title={rupiah(t.awaitingVerification)}
          sub={`${formatNumber(t.awaitingCount)} bukti transfer`}
        />
        <StatTile
          label="Belum bayar"
          icon="serious"
          illustration="warning"
          value={rupiahCompact(t.outstanding)}
          title={rupiah(t.outstanding)}
          sub={`${formatNumber(t.outstandingCount)} tagihan`}
          hint={
            t.uncalculatedEstimate > 0
              ? `Termasuk bukti ditolak & estimasi ${rupiahCompact(t.uncalculatedEstimate)} yang belum dihitung`
              : 'Termasuk yang buktinya ditolak'
          }
        />
        <StatTile
          label="Belum dihitung"
          icon="neutral"
          illustration="flag"
          value={formatNumber(t.uncalculatedCount)}
          sub="tagihan presenter"
          hint={
            t.uncalculatedCount > 0
              ? `Estimasi ${rupiahCompact(t.uncalculatedEstimate)} sudah masuk total tagihan`
              : 'Semua tagihan sudah dihitung'
          }
        />
      </div>

      {notes.length > 0 && (
        <ul className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Presenter vs peserta"
          caption="Panjang batang = total tagihan, dibagi menurut posisi uangnya."
          table={{
            columns: [
              { label: 'Kelompok' },
              { label: 'Tagihan', numeric: true },
              { label: 'Total tagihan', numeric: true },
              { label: 'Terkumpul', numeric: true },
              { label: 'Menunggu verifikasi', numeric: true },
              { label: 'Belum bayar', numeric: true },
              { label: 'Belum dihitung (estimasi)', numeric: true },
            ],
            rows: data.segments.map((s) => {
              const est = estimateOf(s)
              return {
                key: s.key,
                cells: [
                  s.label,
                  formatNumber(s.count),
                  rupiah(s.billed),
                  `${rupiah(s.collected)} (${formatNumber(s.collectedCount)})`,
                  rupiah(s.awaitingVerification),
                  rupiah(s.outstanding - est),
                  rupiah(est),
                ],
              }
            }),
          }}
        >
          <StackedBar
            series={MONEY_SERIES}
            scale="absolute"
            formatValue={rupiah}
            rows={data.segments.map((s) => {
              const est = estimateOf(s)
              return {
                key: s.key,
                label: `${s.label} · ${formatNumber(s.count)} tagihan`,
                values: [s.collected, s.awaitingVerification, s.outstanding - est, est],
              }
            })}
          />
        </ChartCard>

        <ChartCard
          title="Status tagihan"
          caption="Jumlah tagihan per status (bukan nominal). Bukti ditolak tetap terhitung tagihan."
          table={{
            columns: [{ label: 'Status' }, { label: 'Presenter', numeric: true }, { label: 'Peserta', numeric: true }],
            rows: statusRows.map((s, i) => ({
              key: s.status,
              cells: [statusSeries[i].label, formatNumber(s.presenterCount), formatNumber(s.participantCount)],
            })),
          }}
          footer={<StatusAmountTable rows={statusRows} labels={statusSeries.map((s) => s.label)} />}
        >
          <StackedBar
            series={statusSeries}
            scale="share"
            legendTotals
            formatValue={formatNumber}
            rows={[
              { key: 'presenter', label: segLabel('presenter'), values: statusRows.map((s) => s.presenterCount) },
              { key: 'participant', label: segLabel('participant'), values: statusRows.map((s) => s.participantCount) },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Member vs non-member"
          caption="Total tagihan dan yang sudah terkumpul, per keanggotaan."
          table={{
            columns: [
              { label: 'Kelompok' },
              { label: 'Tagihan', numeric: true },
              { label: 'Total tagihan', numeric: true },
              { label: 'Terkumpul', numeric: true },
            ],
            rows: membershipRows.map((r) => ({
              key: r.key,
              cells: [r.label, formatNumber(r.count), rupiah(r.billed), rupiah(r.collected)],
            })),
          }}
        >
          <StackedBar
            series={MEMBERSHIP_SERIES}
            scale="absolute"
            formatValue={rupiah}
            rows={membershipRows.map((r) => ({
              key: r.key,
              label: `${r.label} · ${formatNumber(r.count)}`,
              values: [r.collected, Math.max(0, r.billed - r.collected)],
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Verifikasi per minggu"
          caption="Sejak OCS baru — verifikasi sebelum migrasi tidak tercatat"
          table={{
            columns: [
              { label: 'Minggu (mulai Senin)' },
              { label: 'Diverifikasi', numeric: true },
              { label: 'Nominal', numeric: true },
            ],
            rows: data.weeklyVerified.map((w) => ({
              key: w.weekStart,
              cells: [weekLabel(w.weekStart, true), formatNumber(w.count), rupiah(w.amount)],
            })),
          }}
        >
          <WeeklyColumns
            ariaLabel="Nominal tagihan yang diverifikasi per minggu"
            valueLabel="diverifikasi"
            formatValue={rupiah}
            formatTick={rupiahTick}
            points={data.weeklyVerified.map((w) => ({
              key: w.weekStart,
              axisLabel: weekLabel(w.weekStart, weeklyWithYear),
              fullLabel: `Minggu ${weekLabel(w.weekStart, true)}`,
              value: w.amount,
              extra: `${formatNumber(w.count)} tagihan`,
            }))}
          />
        </ChartCard>
      </div>

      <ActionTable
        title="Menunggu verifikasi"
        caption="Bukti transfer yang belum dicek — paling lama diunggah di atas."
        emptyMessage="Tidak ada bukti transfer yang menunggu verifikasi."
        whenHeader="Bukti diunggah"
        rows={data.awaitingVerification.map((r) => ({
          ...r,
          status: 'waiting for verification',
          when: r.proofUploadedAt ? dateShort(r.proofUploadedAt) : '-',
        }))}
      />

      <ActionTable
        title="Belum bayar"
        caption="Tagihan yang belum lunas dan belum ada bukti baru — nominal terbesar di atas."
        emptyMessage="Tidak ada tagihan yang belum dibayar."
        whenHeader="Accepted sejak"
        showInvoice
        rows={data.unpaid.map((r) => ({ ...r, when: r.since ? dateShort(r.since) : '-' }))}
      />
    </>
  )
}

function StatusAmountTable({ rows, labels }: { rows: FinanceStats['statusBreakdown']; labels: string[] }) {
  return (
    <div className="relative overflow-x-auto border-t border-gray-100 pt-3 dark:border-white/5">
      <table className="w-full text-sm">
        <caption className="mb-1 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
          Nominal per status
        </caption>
        <thead>
          <tr className="text-xs text-gray-500 dark:text-gray-400">
            <th scope="col" className="px-2 py-1 text-left font-medium">
              Status
            </th>
            <th scope="col" className="px-2 py-1 text-right font-medium">
              Presenter
            </th>
            <th scope="col" className="px-2 py-1 text-right font-medium">
              Peserta
            </th>
            <th scope="col" className="px-2 py-1 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-700 dark:text-gray-300">
          {rows.map((s, i) => (
            <tr key={s.status}>
              <th scope="row" className="px-2 py-1 text-left font-normal">
                <StatusLabel status={s.status} label={labels[i]} />
              </th>
              <td className="px-2 py-1 text-right whitespace-nowrap tabular-nums">{rupiah(s.presenterAmount)}</td>
              <td className="px-2 py-1 text-right whitespace-nowrap tabular-nums">{rupiah(s.participantAmount)}</td>
              <td className="px-2 py-1 text-right whitespace-nowrap tabular-nums">
                {rupiah(s.presenterAmount + s.participantAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ActionRow {
  kind: 'presenter' | 'participant'
  id: string
  name: string
  email: string
  phone: string | null
  title: string | null
  amount: number
  status: string | null
  sentInvoice?: boolean
  when: string
  detailPath: string
}

// Nomor HP lokal (08xx) -> format internasional buat wa.me (628xx).
// Nomor yang kependekan dianggap bukan nomor HP valid, nggak dikasih link.
function waLink(phone: string | null): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  return digits.length >= 9 ? `https://wa.me/${digits}` : null
}

const PAGE = 25

// Tabel tindak lanjut (siapa yang perlu dicek / ditagih). Pencarian di
// sisi klien — datanya sudah utuh dari endpoint, nggak perlu round-trip.
function ActionTable({
  title,
  caption,
  emptyMessage,
  whenHeader,
  showInvoice = false,
  rows,
}: {
  title: string
  caption: string
  emptyMessage: string
  whenHeader: string
  showInvoice?: boolean
  rows: ActionRow[]
}) {
  const [q, setQ] = useState('')
  const [showAll, setShowAll] = useState(false)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) =>
      [r.name, r.email, r.phone ?? '', r.title ?? ''].some((v) => v.toLowerCase().includes(needle)),
    )
  }, [rows, q])
  const visible = showAll ? filtered : filtered.slice(0, PAGE)
  const total = rows.reduce((a, r) => a + r.amount, 0)

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-brand-dark-surface">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-iapa-navy dark:text-gray-100">
            {title}{' '}
            <span className="font-normal text-gray-500 dark:text-gray-400">
              · {formatNumber(rows.length)} tagihan · {rupiah(total)}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{caption}</p>
        </div>
        {rows.length > 0 && (
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, email, HP, judul..."
            aria-label={`Cari di tabel ${title}`}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:w-64 dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          />
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      ) : (
        <>
          {/* relative: span sr-only di header itu position:absolute — tanpa ini
              dia lolos dari scroller dan bikin satu halaman geser ke samping di HP */}
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
                  <th scope="col" className="px-2 py-2 font-medium">Nama</th>
                  <th scope="col" className="px-2 py-2 font-medium">Kontak</th>
                  <th scope="col" className="px-2 py-2 font-medium">Judul paper</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Nominal</th>
                  <th scope="col" className="px-2 py-2 font-medium">Status</th>
                  <th scope="col" className="px-2 py-2 font-medium">{whenHeader}</th>
                  <th scope="col" className="px-2 py-2 font-medium">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {visible.map((r) => {
                  const wa = waLink(r.phone)
                  return (
                    <tr key={`${r.kind}-${r.id}`} className="border-b border-gray-100 align-top last:border-0 dark:border-white/5">
                      <td className="px-2 py-2">
                        <div className="font-medium text-gray-800 dark:text-gray-100">{r.name || '-'}</div>
                        <span className="mt-0.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-white/10 dark:text-gray-300">
                          {r.kind === 'presenter' ? 'Presenter' : 'Peserta'}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="break-all">{r.email}</div>
                        {r.phone && (
                          <div className="mt-0.5 text-xs">
                            {wa ? (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-navy hover:underline dark:text-brand-orange"
                              >
                                {r.phone} · WhatsApp
                              </a>
                            ) : (
                              r.phone
                            )}
                          </div>
                        )}
                      </td>
                      <td className="max-w-xs px-2 py-2">{r.title ?? '-'}</td>
                      <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">{rupiah(r.amount)}</td>
                      <td className="px-2 py-2">
                        <StatusLabel status={r.status} />
                        {showInvoice && (
                          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {r.sentInvoice ? 'Invoice terkirim' : 'Invoice belum dikirim'}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">{r.when}</td>
                      <td className="px-2 py-2 text-right">
                        <Link to={r.detailPath} className="btn btn-ghost btn-sm">
                          Buka
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-3 text-gray-500 dark:text-gray-400">
                      Tidak ada yang cocok dengan "{q}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > PAGE && (
            <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${formatNumber(filtered.length)})`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
