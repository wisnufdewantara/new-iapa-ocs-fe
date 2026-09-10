import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { usePageTitle } from '../hooks/usePageTitle'
import { BongoCatSvg } from '../components/BongoCatSvg'

// Diadaptasi dari sigc-portal/resources/views/errors/404.blade.php —
// kucing ngetik, laptop menghilang, muncul tanda tanya. Kata-kata "SDC"
// diganti nama aplikasi kita. Halaman berdiri sendiri (bukan di dalam
// Layout dashboard), jadi aman full-page kayak aslinya.
export function NotFoundPage() {
  usePageTitle('404')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const s = (selector: string) => root.querySelectorAll(selector)

    const notes = root.querySelectorAll('.note')
    notes.forEach((note) => {
      note.parentElement?.appendChild(note.cloneNode(true))
      note.parentElement?.appendChild(note.cloneNode(true))
      note.parentElement?.appendChild(note.cloneNode(true))
    })

    const musicNotes = s('.music .note')
    const pawRight = { up: s('.paw-right .up'), down: s('.paw-right .down') }
    const pawLeft = { up: s('.paw-left .up'), down: s('.paw-left .down') }
    const laptop = s('#the-laptop')
    const questionMark = s('#question-mark')

    const style = getComputedStyle(root)
    const colors = [
      style.getPropertyValue('--primary'),
      style.getPropertyValue('--secondary'),
      style.getPropertyValue('--accent'),
      style.getPropertyValue('--success'),
      style.getPropertyValue('--warning'),
    ]

    const ctx = gsap.context(() => {
      gsap.set(musicNotes, { scale: 0, autoAlpha: 1, transformOrigin: 'center center' })

      const animateNotes = (els: Element[]) => {
        els.forEach((el) => {
          gsap.set(el, {
            stroke: gsap.utils.random(colors),
            rotation: gsap.utils.random(-30, 30),
            x: gsap.utils.random(-20, 20),
            y: gsap.utils.random(0, 50),
          })
        })
        gsap.to(els, {
          duration: 2.5,
          autoAlpha: 0,
          scale: 1.2,
          y: '-=150',
          rotation: gsap.utils.random(['-=', '+=']) + '50',
          ease: 'power1.out',
          stagger: { amount: 1.5, from: 'random' },
          onComplete: () => animateNotes(els),
        })
      }
      animateNotes(Array.from(musicNotes))

      const typePaw = (paw: { up: NodeListOf<Element>; down: NodeListOf<Element> }, delay = 0) => {
        const tl = gsap.timeline()
        tl.to(paw.down, { autoAlpha: 0, duration: 0.1 }, delay)
          .to(paw.up, { autoAlpha: 1, duration: 0.1 }, '<')
          .to(paw.up, { autoAlpha: 0, duration: 0.1 }, '>0.1')
          .to(paw.down, { autoAlpha: 1, duration: 0.1 }, '<')
        return tl
      }

      const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 1 })
      masterTl
        .set(laptop, { autoAlpha: 1 })
        .set(questionMark, { autoAlpha: 0, scale: 0.5, rotation: -20 })
        .set([pawLeft.up, pawRight.up], { autoAlpha: 0 })
        .set([pawLeft.down, pawRight.down], { autoAlpha: 1 })
        .add('typingStart')
        .add(typePaw(pawLeft), 'typingStart')
        .add(typePaw(pawRight, 0.15), 'typingStart')
        .add(typePaw(pawLeft, 0.3), 'typingStart')
        .add(typePaw(pawRight, 0.45), 'typingStart')
        .add(typePaw(pawLeft, 0.6), 'typingStart')
        .add(typePaw(pawRight, 0.75), 'typingStart')
        .to(laptop, { autoAlpha: 0, duration: 2, ease: 'power2.inOut' }, 'typingStart+=1')
        .to([pawLeft.up, pawRight.up], { autoAlpha: 0, duration: 0.2 }, '>-0.5')
        .to([pawLeft.down, pawRight.down], { autoAlpha: 1, duration: 0.2 }, '<')
        .to(questionMark, { autoAlpha: 1, scale: 1.2, rotation: 0, duration: 1, ease: 'elastic.out(1, 0.5)' }, '>')
        .to({}, { duration: 2 })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef} className="notfound-page flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <style>{`
        .notfound-page {
          --bg: #0f172a;
          --primary: #6366f1;
          --secondary: #8b5cf6;
          --accent: #3b82f6;
          --success: #10b981;
          --warning: #f59e0b;
          background: linear-gradient(135deg, var(--bg) 0%, #1e293b 100%);
          font-family: 'Fira Code', monospace;
        }
        .notfound-page .cat-container { width: 80vw; max-width: 800px; aspect-ratio: 783.55 / 354.91; }
        .notfound-page .cat-container svg { height: 100%; width: 100%; }
        .notfound-page .text-content { text-align: center; color: var(--secondary); margin-top: 20px; }
        .notfound-page .text-content h1 {
          font-size: 3rem; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 3px;
          background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: nfTextFlicker 3s infinite alternate;
        }
        .notfound-page .text-content p { font-size: 1.2rem; color: var(--accent); opacity: 0.9; margin-bottom: 20px; }
        .notfound-page .back-link {
          display: inline-block; margin-top: 10px; padding: 12px 30px;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          color: white; text-decoration: none; border-radius: 8px; font-weight: bold;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        .notfound-page .back-link:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5); }
        @keyframes nfTextFlicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0.7; }
        }
        #bongo-cat { fill: var(--bg); stroke-linecap: round; stroke-linejoin: round; stroke-width: 4; }
        #bongo-cat .laptop-cover, #bongo-cat .headphone .band, #question-mark path { fill: none; }
        #bongo-cat .paw, #bongo-cat .head { stroke: var(--warning); }
        #bongo-cat .laptop-keyboard { stroke-width: 2; }
        #bongo-cat .terminal-code { stroke-width: 5; }
        #bongo-cat .music .note, #bongo-cat .laptop-base, #bongo-cat .laptop-cover, #bongo-cat .paw .pads, #question-mark { stroke: var(--secondary); }
        #question-mark circle { fill: var(--secondary); stroke: none; }
        #question-mark { opacity: 0; transform-box: fill-box; transform-origin: center bottom; }
        .paw .up { opacity: 0; }
        #bongo-cat .table line, #bongo-cat .headphone .band, #bongo-cat .headphone .speaker path:nth-child(3) { stroke: var(--success); }
        #bongo-cat .terminal-frame, #bongo-cat .laptop-keyboard, #bongo-cat .headphone .speaker path:nth-child(2) { stroke: var(--accent); }
        #bongo-cat .terminal-code, #bongo-cat .headphone .speaker path:first-child { stroke: var(--primary); }
      `}</style>

      <div className="cat-container">
        <BongoCatSvg />
      </div>

      <div className="text-content">
        <h1>404 - Page Not Found</h1>
        <p>Oops! Si kucing nggak nemu halaman yang kamu cari.</p>
        <Link to="/" className="back-link">
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
