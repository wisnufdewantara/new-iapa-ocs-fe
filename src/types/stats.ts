// Kontrak response modul stats di backend (newocs-be src/stats). Semua
// nominal = angka Rupiah biasa TANPA kode unik transfer; semua tanggal
// string ISO. Ubah di sini = ubah juga di backend.

export type PaymentStatusKey =
  | 'verified'
  | 'waiting for verification'
  | 'waiting for payment'
  | 'rejected'
  | 'waiting for calculation'
  | 'other'

export interface ConferenceRef {
  id: string
  name: string
}

export interface FinanceStats {
  conference: ConferenceRef | null
  generatedAt: string
  totals: {
    billed: number
    collected: number
    awaitingVerification: number
    outstanding: number
    billedCount: number
    collectedCount: number
    awaitingCount: number
    outstandingCount: number
    uncalculatedCount: number
    uncalculatedEstimate: number
    zeroAmountCount: number
    otherStatusCount: number
    collectionRate: number
  }
  segments: Array<{
    key: 'presenter' | 'participant'
    label: string
    billed: number
    collected: number
    awaitingVerification: number
    outstanding: number
    count: number
    collectedCount: number
  }>
  statusBreakdown: Array<{
    status: PaymentStatusKey
    label: string
    presenterCount: number
    participantCount: number
    presenterAmount: number
    participantAmount: number
  }>
  membership: Array<{
    segment: 'presenter' | 'participant'
    member: { count: number; billed: number; collected: number }
    nonMember: { count: number; billed: number; collected: number }
  }>
  weeklyVerified: Array<{ weekStart: string; count: number; amount: number }>
  awaitingVerification: Array<{
    kind: 'presenter' | 'participant'
    id: string
    name: string
    email: string
    phone: string | null
    title: string | null
    amount: number
    proofUploadedAt: string | null
    detailPath: string
  }>
  unpaid: Array<{
    kind: 'presenter' | 'participant'
    id: string
    name: string
    email: string
    phone: string | null
    title: string | null
    amount: number
    status: string | null
    sentInvoice: boolean
    since: string | null
    detailPath: string
  }>
  nonAcceptedVerifiedCount: number
}

export interface OverviewStats {
  conference: ConferenceRef | null
  generatedAt: string
  papers: {
    total: number
    accepted: number
    rejected: number
    waiting: number
    loaSent: number
    bySubTheme: Array<{ subTheme: string; accepted: number; rejected: number; waiting: number }>
    byType: Array<{ type: string; count: number }>
  }
  review: {
    unassignedWaiting: number
    overdueAssignments: number
    feedbackAwaitingReply: number
  }
  weekly: {
    papers: Array<{ weekStart: string; count: number }>
    accounts: Array<{ weekStart: string; count: number }>
  }
  people: {
    presenters: number
    participants: number
    presenterMembers: number
    participantMembers: number
    topAffiliations: Array<{ affiliation: string; count: number }>
    countries: Array<{ country: string; count: number }>
  }
  attendance: {
    presenterTotal: number
    presenterPresent: number
    participantTotal: number
    participantPresent: number
    certificatesSent: number
  }
  accounts: { total: number; byRole: Array<{ role: string; count: number }> }
}

export interface SummaryStats {
  items: Array<{ key: string; label: string; count: number; path: string }>
}
