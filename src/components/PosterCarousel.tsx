import { useEffect, useState } from 'react'

interface Poster {
  id: string
  image_url: string
}

interface PosterCarouselProps {
  posters: Poster[]
}

const AUTO_ADVANCE_MS = 4000

// Bikin manual, TIDAK pakai library slider baru — cuma auto-geser +
// titik indikator + tombol prev/next kecil pas di-hover. Kalau 0 poster
// (belum ada yang diupload admin), fallback ke kotak placeholder yang
// sudah ada dari awal, biar homepage nggak kosong.
export function PosterCarousel({ posters }: PosterCarouselProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [posters])

  useEffect(() => {
    if (posters.length <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % posters.length), AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [posters.length])

  if (posters.length === 0) {
    return (
      <div className="relative flex aspect-[3/4] w-full items-center justify-center border border-[#ddd6c8] bg-[#e7e2d6] dark:border-white/15 dark:bg-white/5">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.2">
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span className="absolute bottom-6 font-sans text-[11px] tracking-[0.1em] text-[#a8a29e] uppercase">
          Poster Acara
        </span>
      </div>
    )
  }

  const apiBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '')

  return (
    <div className="group relative aspect-[3/4] w-full overflow-hidden border border-[#ddd6c8] bg-[#e7e2d6] dark:border-white/15 dark:bg-white/5">
      {posters.map((p, i) => (
        <img
          key={p.id}
          src={`${apiBase}${p.image_url}`}
          alt="Poster acara"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {posters.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + posters.length) % posters.length)}
            aria-label="Sebelumnya"
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/40 px-2.5 py-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % posters.length)}
            aria-label="Selanjutnya"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/40 px-2.5 py-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {posters.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setIndex(i)}
                aria-label={`Poster ${i + 1}`}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
