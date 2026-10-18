import { useState } from 'react'
import { useActiveConferences } from '../../hooks/useActiveConferences'

// State filter conference dashboard. Default = conference aktif pertama
// (ongoing diprioritaskan backend); kalau nggak ada yang aktif, "Semua
// conference". Default-nya DITURUNKAN tiap render (bukan disalin ke state
// lewat useEffect) — jadi nggak ada render ganda / fetch "semua" sesaat
// sebelum conference aktif kebaca.
export function useConferenceFilter() {
  const [choice, setChoice] = useState<string | null>(null)
  const active = useActiveConferences()
  const fallback = active.data?.[0]?.conference_id ?? ''
  return {
    // '' = semua conference
    conferenceId: choice ?? fallback,
    setConferenceId: (id: string) => setChoice(id),
    // Tunggu daftar aktif kebaca dulu (atau gagal → semua) sebelum fetch
    ready: choice !== null || !active.isLoading,
  }
}
