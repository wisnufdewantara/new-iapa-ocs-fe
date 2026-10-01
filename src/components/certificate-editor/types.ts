export type ElementId = 'name' | 'label' | 'qr' | 'signer-1' | 'signer-2' | 'signer-3'

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
  nameFontKey: string
  nameFontSize: number
  nameColor: string
  namePosX: number
  namePosY: number
  nameMaxWidth: number
  labelEnabled: boolean
  labelFontSize: number
  labelPosX: number
  labelPosY: number
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
}

export interface FontOption {
  key: string
  label: string
}
