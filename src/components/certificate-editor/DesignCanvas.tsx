import { useCanvasDrag } from './useCanvasDrag'
import { DraggableItem } from './DraggableItem'
import type { ElementId, TemplateDraft } from './types'

const apiOrigin = (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '')

interface Props {
  draft: TemplateDraft
  selectedId: ElementId | null
  onSelect: (id: ElementId | null) => void
  onMove: (id: ElementId, pos: { x: number; y: number }) => void
  sampleName: string
  canvasRef: React.RefObject<HTMLDivElement | null>
}

// Kanvas desain sertifikat — gambar desain full-bleed + elemen draggable
// (nama, label, sampai 3 signer, QR) di atasnya. aspect-ratio dikunci ke
// rasio gambar asli biar posisi fraksi 0..1 match 1:1 ke render PDF
// (lihat CertificateRendererService.render, page size ikut rasio desain).
export function DesignCanvas({ draft, selectedId, onSelect, onMove, sampleName, canvasRef }: Props) {
  const { onPointerDown, onPointerMove, onPointerUp, onKeyDown, snapGuides } = useCanvasDrag(canvasRef, onMove)

  return (
    <div
      ref={canvasRef}
      className="relative w-full max-w-[900px] select-none overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:border-white/10"
      style={{ aspectRatio: `${draft.designWidthPx} / ${draft.designHeightPx}` }}
      onClick={() => onSelect(null)}
    >
      <img src={`${apiOrigin}${draft.designImageUrl}`} alt="Desain sertifikat" className="pointer-events-none absolute inset-0 h-full w-full" draggable={false} />

      {snapGuides.x && <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-brand-orange/70" />}
      {snapGuides.y && <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-brand-orange/70" />}

      <DraggableItem
        id="name"
        pos={{ x: draft.namePosX, y: draft.namePosY }}
        selected={selectedId === 'name'}
        onSelect={() => onSelect('name')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div className="relative">
          {selectedId === 'name' && (
            <div
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-dashed border-brand-orange/60"
              style={{ width: `${draft.nameMaxWidth * 100}%`, height: '1px' }}
            />
          )}
          <span
            style={{
              fontFamily: `cert-${draft.nameFontKey}`,
              fontSize: draft.nameFontSize * (canvasRef.current?.clientHeight ?? 400),
              color: draft.nameColor,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {sampleName}
          </span>
        </div>
      </DraggableItem>

      {draft.labelEnabled && (
        <DraggableItem
          id="label"
          pos={{ x: draft.labelPosX, y: draft.labelPosY }}
          selected={selectedId === 'label'}
          onSelect={() => onSelect('label')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        >
          <span
            style={{
              fontFamily: `cert-${draft.bodyFontKey}`,
              fontSize: draft.labelFontSize * (canvasRef.current?.clientHeight ?? 400),
              color: draft.nameColor,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Presenter
          </span>
        </DraggableItem>
      )}

      {draft.signers.map((s) => {
        const id = `signer-${s.slot}` as ElementId
        return (
          <DraggableItem
            key={id}
            id={id}
            pos={{ x: s.posX, y: s.posY }}
            selected={selectedId === id}
            onSelect={() => onSelect(id)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={onKeyDown}
          >
            <div className="flex flex-col items-center">
              {s.signatureImageUrl ? (
                <img
                  src={`${apiOrigin}${s.signatureImageUrl}`}
                  alt="Tanda tangan"
                  className="pointer-events-none"
                  style={{ width: `${s.width * (canvasRef.current?.clientWidth ?? 900)}px` }}
                  draggable={false}
                />
              ) : (
                <div
                  className="flex items-center justify-center border border-dashed border-gray-400 bg-gray-100/70 text-[10px] text-gray-500 dark:bg-white/5"
                  style={{ width: `${s.width * (canvasRef.current?.clientWidth ?? 900)}px`, aspectRatio: '3 / 1' }}
                >
                  Tanda Tangan {s.slot}
                </div>
              )}
              <span className="whitespace-nowrap text-xs" style={{ fontFamily: `cert-${draft.bodyFontKey}`, color: draft.signerColor }}>
                {s.signerName || `(Nama Penandatangan ${s.slot})`}
              </span>
            </div>
          </DraggableItem>
        )
      })}

      {draft.qrEnabled && (
        <DraggableItem
          id="qr"
          pos={{ x: draft.qrPosX, y: draft.qrPosY }}
          selected={selectedId === 'qr'}
          onSelect={() => onSelect('qr')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        >
          <div
            className="flex items-center justify-center border border-dashed border-gray-500 bg-[repeating-conic-gradient(#ddd_0%_25%,white_0%_50%)] bg-[length:8px_8px] text-[10px] font-semibold text-gray-600"
            style={{ width: `${draft.qrSize * (canvasRef.current?.clientWidth ?? 900)}px`, aspectRatio: '1 / 1' }}
          >
            QR
          </div>
        </DraggableItem>
      )}
    </div>
  )
}
