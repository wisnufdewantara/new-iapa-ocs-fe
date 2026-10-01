import { useEffect, useRef, useState } from 'react'

// ResizeObserver, bukan window resize — canvas bisa berubah ukuran
// karena layout (buka/tutup inspector panel), bukan cuma resize browser.
export function useCanvasSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}
