import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'

// Dipakai di HomePage, SubmitPaperPage, JoinConferencePage — sebelumnya
// query yang sama disalin manual di 3 tempat. /active balikin SEMUA
// conference yang belum "ended" (bisa lebih dari satu, ongoing
// diprioritaskan backend), bukan cuma satu.
export function useActiveConferences<T = { conference_id: string; conference_name: string }>() {
  return useQuery({
    queryKey: ['conferences', 'active'],
    queryFn: async () => (await api.get<T[]>('/conferences/active')).data,
  })
}
