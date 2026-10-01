export type ElementId = 'qr' | 'signer-1' | 'signer-2' | 'signer-3' | `placeholder-${number}`

export interface SignerDraft {
  slot: number
  signerName: string
  signerTitle: string
  signatureImageUrl: string | null
  signatureWidthPx: number | null
  signatureHeightPx: number | null
  posX: number
  posY: number
  width: number
}

export type PlaceholderType = 'name' | 'cert_type' | 'custom'

// Nama Penerima & Label Tipe BUKAN field khusus lagi — satu list dengan
// teks custom, dibedain lewat `type`. 'name'/'cert_type' render otomatis
// dari data recipient (content diabaikan backend); 'custom' render dari
// `content`, boleh diselingi {{variabel}} (lihat PlaceholderVariable).
export interface PlaceholderDraft {
  slot: number
  type: PlaceholderType
  content: string
  fontKey: string
  fontSize: number
  color: string
  posX: number
  posY: number
  maxWidth: number
}

export interface PlaceholderVariable {
  key: string
  label: string
}

// Mirror camelCase dari response GET/PATCH /api/certificate-templates/:id —
// ini yang dipegang editor sebagai draft, dibandingkan ke `saved` buat
// dirty-check sebelum enable tombol Simpan/Preview.
export interface TemplateDraft {
  id: string
  name: string
  description: string | null
  designImageUrl: string
  designWidthPx: number
  designHeightPx: number
  isDefault: boolean
  bodyFontKey: string
  signerFontSize: number
  signerColor: string
  page2Enabled: boolean
  page2Title: string | null
  page2Content: string | null
  page2TotalJp: number | null
  page2FontSize: number
  qrEnabled: boolean
  qrPosX: number
  qrPosY: number
  qrSize: number
  updatedAt: string
  signers: SignerDraft[]
  placeholders: PlaceholderDraft[]
}

export interface FontOption {
  key: string
  label: string
}
