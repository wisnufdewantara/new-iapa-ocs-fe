// Parser SAMA PERSIS dengan backend (src/certificate-templates/page2-layout.ts
// parsePage2Content) — format baris: "- "/"* " = bullet, baris kosong =
// spasi, lainnya = paragraf. Dipakai buat preview HTML di editor (exact
// pagination/word-wrap tetap diverifikasi lewat tombol Preview PDF).
export type Page2Block = { type: 'bullet' | 'paragraph' | 'space'; text: string }

export function parsePage2Content(content: string): Page2Block[] {
  return content.split('\n').map((line): Page2Block => {
    const trimmed = line.trim()
    if (trimmed === '') return { type: 'space', text: '' }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return { type: 'bullet', text: trimmed.slice(2) }
    }
    return { type: 'paragraph', text: trimmed }
  })
}
