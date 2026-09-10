import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { MENU } from '../config/menu'
import { usePageTitle } from '../hooks/usePageTitle'
import { BongoCatSvg } from '../components/BongoCatSvg'

// Diadaptasi dari sigc-portal/public/under-construction.html (kucing
// bongo ngetik + not musik ngambang) — kata-kata "SIGC" diganti nama
// aplikasi kita. Dipasang di dalam Layout (bukan halaman penuh berdiri
// sendiri kayak 404), jadi dikontain dalam kartu, bukan overlay 100vh,
// biar sidebar/header tetap kelihatan.
export function ComingSoonPage() {
  const { pathname } = useLocation()
  const label = MENU.flatMap((g) => g.items).find((i) => i.path === pathname)?.label ?? pathname
  usePageTitle(label)

  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const s = (selector: string) => root.querySelectorAll(selector)

    const notes = root.querySelectorAll('.note')
    notes.forEach((note) => {
      note.parentElement?.appendChild(note.cloneNode(true))
      note.parentElement?.appendChild(note.cloneNode(true))
    })

    const musicNotes = s('.music .note')
    const pawRightUp = s('.paw-right .up')
    const pawRightDown = s('.paw-right .down')
    const pawLeftUp = s('.paw-left .up')
    const pawLeftDown = s('.paw-left .down')

    const style = getComputedStyle(root)
    const colors = [
      style.getPropertyValue('--primary'),
      style.getPropertyValue('--secondary'),
      style.getPropertyValue('--accent'),
      style.getPropertyValue('--success'),
      style.getPropertyValue('--warning'),
    ]

    const ctx = gsap.context(() => {
      gsap.set(musicNotes, { scale: 0, autoAlpha: 1 })

      const animatePawState = (selector: NodeListOf<Element>) =>
        gsap.fromTo(
          selector,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.01, repeatDelay: 0.19, yoyo: true, repeat: -1 },
        )

      const tl = gsap.timeline()
      tl.add(animatePawState(pawLeftUp), 'start')
        .add(animatePawState(pawRightDown), 'start')
        .add(animatePawState(pawLeftDown), 'start+=0.19')
        .add(animatePawState(pawRightUp), 'start+=0.19')
        .timeScale(1.6)

      const noteEls = gsap.utils.shuffle(Array.from(musicNotes))
      const numNotes = Math.floor(noteEls.length / 3)
      const notesG1 = noteEls.splice(0, numNotes)
      const notesG2 = noteEls.splice(0, numNotes)
      const notesG3 = noteEls

      const colorizer = gsap.utils.random(colors, true)
      const rotator = gsap.utils.random(-50, 50, 1, true)
      const dir = (amt: number) => `${gsap.utils.random(['-', '+'])}=${amt}`

      const animateNotes = (els: Element[]) => {
        els.forEach((el) => {
          gsap.set(el, { stroke: colorizer(), rotation: rotator(), x: gsap.utils.random(-25, 25, 1) })
        })
        return gsap.fromTo(
          els,
          { autoAlpha: 1, y: 0, scale: 0 },
          {
            duration: 2,
            autoAlpha: 0,
            scale: 1,
            ease: 'none',
            stagger: { from: 'random', each: 0.5 },
            rotation: dir(gsap.utils.random(20, 30, 1)),
            x: dir(gsap.utils.random(40, 60, 1)),
            y: gsap.utils.random(-200, -220, 1),
            onComplete: () => animateNotes(els),
          },
        )
      }

      tl.add(animateNotes(notesG1)).add(animateNotes(notesG2), '>0.05').add(animateNotes(notesG3), '>0.25')
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      className="under-construction-card relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden rounded-lg p-8 text-center"
    >
      <style>{`
        .under-construction-card {
          --bg: #0f172a;
          --primary: #6366f1;
          --secondary: #8b5cf6;
          --accent: #3b82f6;
          --success: #10b981;
          --warning: #f59e0b;
          --text-glow: #a78bfa;
          background: linear-gradient(135deg, var(--bg) 0%, #1e293b 100%);
          font-family: 'Fira Code', monospace;
        }
        .under-construction-card .cat-container { width: 80%; max-width: 560px; aspect-ratio: 783.55 / 354.91; }
        .under-construction-card .cat-container svg { height: 100%; width: 100%; }
        .under-construction-card .text-content h1 {
          font-size: 1.75rem; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;
          background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: ucTextFlicker 3s infinite alternate;
        }
        .under-construction-card .subtitle { font-size: 1.05rem; color: var(--accent); opacity: 0.9; margin: 0 0 4px 0; }
        .under-construction-card .module-info { font-size: 0.85rem; color: var(--text-glow); opacity: 0.75; margin-top: 10px; }
        @keyframes ucTextFlicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0.7; }
        }
        #bongo-cat { fill: var(--bg); stroke-linecap: round; stroke-linejoin: round; stroke-width: 4; }
        #bongo-cat .laptop-cover, #bongo-cat .headphone .band, #question-mark { fill: none; }
        #bongo-cat .paw, #bongo-cat .head { stroke: var(--warning); }
        #bongo-cat .laptop-keyboard { stroke-width: 2; }
        #bongo-cat .terminal-code { stroke-width: 5; }
        #bongo-cat .music .note, #bongo-cat .laptop-base, #bongo-cat .laptop-cover, #bongo-cat .paw .pads { stroke: var(--secondary); }
        #bongo-cat .table line, #bongo-cat .headphone .band, #bongo-cat .headphone .speaker path:nth-child(3) { stroke: var(--success); }
        #bongo-cat .terminal-frame, #bongo-cat .laptop-keyboard, #bongo-cat .headphone .speaker path:nth-child(2) { stroke: var(--accent); }
        #bongo-cat .terminal-code, #bongo-cat .headphone .speaker path:first-child { stroke: var(--primary); }
        #question-mark { opacity: 0; }
      `}</style>

      <div className="cat-container">
        <BongoCatSvg />
      </div>

      <div className="text-content">
        <h1>Under Construction</h1>
        <p className="subtitle">{label}</p>
        <p className="module-info">
          Modul ini masih dikerjakan.
          <br />
          Kucing developer kami lagi kerja keras. Balik lagi nanti, ya!
        </p>
      </div>
    </div>
  )
}
