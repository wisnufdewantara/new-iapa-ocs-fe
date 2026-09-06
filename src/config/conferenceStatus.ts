export type ConferenceStatus = 'coming_soon' | 'ongoing' | 'ended'

export const CONFERENCE_STATUS_LABEL: Record<ConferenceStatus, string> = {
  coming_soon: 'Coming Soon',
  ongoing: 'Sedang Berlangsung',
  ended: 'Sudah Berakhir',
}

export const CONFERENCE_STATUS_BADGE_CLASS: Record<ConferenceStatus, string> = {
  coming_soon: 'bg-amber-100 text-amber-800 border-amber-300',
  ongoing: 'bg-green-100 text-green-800 border-green-300',
  ended: 'bg-gray-200 text-gray-600 border-gray-300',
}
