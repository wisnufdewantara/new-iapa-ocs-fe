import { useRef, useState } from 'react'
import type { ElementId } from './types'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const SNAP_THRESHOLD = 0.006
const KEY_NUDGE = 0.001
const KEY_NUDGE_SHIFT = 0.01

interface DragState {
  id: ElementId
  startX: number
  startY: number
  x0: number
  y0: number
  rectW: number
  rectH: number
}

// Drag posisi elemen (nama/label/signer/QR) di atas gambar desain, native
// pakai Pointer Events (mouse + touch tanpa library tambahan) — posisi
// disimpan sebagai FRAKSI 0..1, match 1:1 ke konvensi koordinat PDF di
// backend (lihat komentar di prisma/schema.prisma model certificate_templates).
export function useCanvasDrag(
  canvasRef: React.RefObject<HTMLElement | null>,
  onMove: (id: ElementId, pos: { x: number; y: number }) => void,
) {
  const dragRef = useRef<DragState | null>(null)
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false })

  const onPointerDown = (e: React.PointerEvent, id: ElementId, pos: { x: number; y: number }) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, x0: pos.x, y0: pos.y, rectW: rect.width, rectH: rect.height }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    let nx = clamp(d.x0 + (e.clientX - d.startX) / d.rectW, 0, 1)
    let ny = clamp(d.y0 + (e.clientY - d.startY) / d.rectH, 0, 1)
    const snapX = Math.abs(nx - 0.5) < SNAP_THRESHOLD
    const snapY = Math.abs(ny - 0.5) < SNAP_THRESHOLD
    if (snapX) nx = 0.5
    if (snapY) ny = 0.5
    setSnapGuides({ x: snapX, y: snapY })
    onMove(d.id, { x: nx, y: ny })
  }

  const onPointerUp = () => {
    dragRef.current = null
    setSnapGuides({ x: false, y: false })
  }

  const onKeyDown = (e: React.KeyboardEvent, id: ElementId, pos: { x: number; y: number }) => {
    const step = e.shiftKey ? KEY_NUDGE_SHIFT : KEY_NUDGE
    let { x, y } = pos
    if (e.key === 'ArrowLeft') x = clamp(x - step, 0, 1)
    else if (e.key === 'ArrowRight') x = clamp(x + step, 0, 1)
    else if (e.key === 'ArrowUp') y = clamp(y - step, 0, 1)
    else if (e.key === 'ArrowDown') y = clamp(y + step, 0, 1)
    else return
    e.preventDefault()
    onMove(id, { x, y })
  }

  return { onPointerDown, onPointerMove, onPointerUp, onKeyDown, snapGuides }
}
