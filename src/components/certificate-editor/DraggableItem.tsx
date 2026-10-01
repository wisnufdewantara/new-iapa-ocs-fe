import type { ReactNode } from 'react'
import type { ElementId } from './types'

interface Props {
  id: ElementId
  pos: { x: number; y: number }
  selected: boolean
  onSelect: (id: ElementId) => void
  onPointerDown: (e: React.PointerEvent, id: ElementId, pos: { x: number; y: number }) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onKeyDown: (e: React.KeyboardEvent, id: ElementId, pos: { x: number; y: number }) => void
  children: ReactNode
}

// Elemen draggable di atas DesignCanvas — posisi x/y (fraksi 0..1) jadi
// left/top persen, translate(-50%,-50%) biar titik anchor di TENGAH
// elemen (match konvensi posisi di backend).
export function DraggableItem({ id, pos, selected, onSelect, onPointerDown, onPointerMove, onPointerUp, onKeyDown, children }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`absolute cursor-move touch-none select-none outline-none ${selected ? 'ring-2 ring-brand-orange ring-offset-1' : ''}`}
      style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: 'translate(-50%, -50%)' }}
      onPointerDown={(e) => onPointerDown(e, id, pos)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onKeyDown={(e) => onKeyDown(e, id, pos)}
    >
      {children}
    </div>
  )
}
