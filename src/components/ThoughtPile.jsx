import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { BACK_PATTERN } from './PlayingCard.jsx'

// Each card's messy spot in the pile, worked out from its number so it never jumps around while you type.
const spot = (i) => ({
  x: ((i * 29) % 71) - 35,
  y: ((i * 17) % 41) - 20,
  rotate: ((i * 47) % 37) - 18,
})

/**
 * The landing screen's table: every thought you type drops onto the felt as a card.
 * Older ones lie face-down in a messy pile; the newest is face-up so you can see it.
 * While the AI sorts, the pile shuffles.
 */
export default function ThoughtPile({ thoughts, shuffling }) {
  const ref = useRef(null)
  const [small, setSmall] = useState(false)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setSmall(e.contentRect.width < 420))
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const width = small ? 96 : 172
  const n = thoughts.length
  const first = Math.max(0, n - 12) // only the top 12 are drawn; the rest are underneath

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative w-full" style={{ height: width * 1.4 + 70 }} aria-hidden>
        {/* The spot on the table where cards land, like a marked place on a real felt */}
        <div
          className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[10px] border border-dashed border-white/30 px-3 text-center"
          style={{ width, height: width * 1.4 }}
        >
          {n === 0 && <span className="font-display text-sm italic text-white/60">Your thoughts land here</span>}
        </div>

        {thoughts.slice(first).map((text, k) => {
          const i = first + k
          const s = spot(i)
          const isTop = i === n - 1
          return (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2"
              style={{ width, height: width * 1.4, marginLeft: -width / 2, marginTop: (-width * 1.4) / 2, zIndex: i }}
              initial={{ x: s.x, y: -260, rotate: s.rotate - 25, opacity: 0 }}
              animate={
                shuffling
                  ? {
                      // riffle: the two halves of the pile slide apart and back together
                      x: [s.x, s.x + (i % 2 ? 70 : -70), s.x],
                      y: s.y,
                      rotate: [s.rotate, i % 2 ? 8 : -8, s.rotate],
                      opacity: 1,
                      transition: { duration: 0.7, repeat: Infinity, delay: (i % 6) * 0.05 },
                    }
                  : { ...s, opacity: 1 }
              }
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              {isTop && !shuffling ? <BlankCard text={text} width={width} /> : <Back width={width} />}
            </motion.div>
          )
        })}
      </div>

      <p className="mt-2 font-display text-lg italic text-white/80" aria-live="polite">
        {shuffling
          ? `Shuffling ${n} thought${n === 1 ? '' : 's'}…`
          : n === 0
            ? 'An empty table. Start typing.'
            : `${n} thought${n === 1 ? '' : 's'} on the table`}
      </p>
    </div>
  )
}

const cardShadow = 'shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_0.7em_1.4em_-0.5em_rgb(0_0_0/0.55)]'

function Back({ width }) {
  return (
    <div className={`h-full w-full rounded-[0.6em] bg-stock p-[0.4em] ${cardShadow}`} style={{ fontSize: width / 8 }}>
      <div className={`h-full w-full ${BACK_PATTERN}`} />
    </div>
  )
}

// A card that isn't sorted yet: your words, with "?" where the rank and suit will go.
function BlankCard({ text, width }) {
  return (
    <div
      className={`relative h-full w-full rounded-[0.6em] bg-stock text-ink ${cardShadow}`}
      style={{ fontSize: width / 8 }}
    >
      <span className="absolute top-[0.4em] left-[0.55em] font-display text-[1.5em] font-bold text-ink/25">?</span>
      <span className="absolute right-[0.55em] bottom-[0.4em] rotate-180 font-display text-[1.5em] font-bold text-ink/25">
        ?
      </span>
      <p className="absolute inset-x-[1.2em] inset-y-[2.2em] flex items-center justify-center text-center font-display text-[0.95em] leading-snug italic">
        {text.length > 70 ? `${text.slice(0, 68)}…` : text}
      </p>
    </div>
  )
}
