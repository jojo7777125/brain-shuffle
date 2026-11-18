import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import PlayingCard, { SUITS, RANKS } from './PlayingCard.jsx'

// Measures how wide the hand area is, so the fan fits any screen.
function useWidth(ref) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

/**
 * Your tasks held as a fanned hand of cards.
 * Each card's position is plain math: spread them out, tilt them a little,
 * and drop the outer ones slightly so the hand curves like a real one.
 */
export default function Hand({ tasks, selectedId, onSelect }) {
  const ref = useRef(null)
  const width = useWidth(ref)
  const [dealt, setDealt] = useState(false)

  const n = tasks.length
  const cardW = width < 480 ? 86 : width < 900 ? 108 : 126
  // tilted cards stick out wider than they are, so leave extra room at the edges
  const spacing = n > 1 ? Math.min(cardW * 0.66, (width - cardW * 1.65) / (n - 1)) : 0
  const spread = Math.min(5 * (n - 1), 40) // total tilt across the hand, in degrees
  const height = cardW * 1.4 + cardW * 0.45 + 24

  // After the deal finishes, card moves (like picking one) should be instant, not delayed.
  useEffect(() => {
    const t = setTimeout(() => setDealt(true), n * 90 + 900)
    return () => clearTimeout(t)
  }, [n])

  function onKeyDown(e) {
    const i = tasks.findIndex((t) => t.id === selectedId)
    if (e.key === 'ArrowRight' && i < n - 1) onSelect(tasks[i + 1].id)
    if (e.key === 'ArrowLeft' && i > 0) onSelect(tasks[i - 1].id)
  }

  return (
    <section aria-labelledby="hand">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="hand" className="font-display text-3xl font-semibold">
          Your hand
        </h2>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
          {Object.entries(SUITS).map(([category, s]) => (
            <div key={category} className="flex items-center gap-1.5">
              <dt className={s.color === 'text-pip' ? 'text-[#ff9aa8]' : 'text-white'}>{s.symbol}</dt>
              <dd>{category}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-1 text-sm text-white/65">
        Aces are for now, Kings for today, Queens for later. Pick a card to look at it.
      </p>

      <div ref={ref} className="relative mt-4" style={{ height }} onKeyDown={onKeyDown}>
        {width > 0 &&
          tasks.map((task, i) => {
            const t = n > 1 ? i / (n - 1) - 0.5 : 0 // -0.5 (left) … 0.5 (right)
            const selected = task.id === selectedId
            const x = (i - (n - 1) / 2) * spacing
            const y = t * t * cardW * 0.5 - (selected ? cardW * 0.3 : 0)
            const rotate = t * spread
            const suit = SUITS[task.category]
            const rank = RANKS[task.priority]

            return (
              <motion.button
                key={task.id}
                type="button"
                aria-pressed={selected}
                aria-label={`${rank.name} of ${suit.name}: ${task.title}`}
                onClick={() => onSelect(task.id)}
                className="absolute bottom-3 left-1/2 rounded-[10px] focus-visible:outline-offset-4"
                style={{ marginLeft: -cardW / 2, zIndex: i, transformOrigin: '50% 120%' }}
                initial={{ x: 0, y: -height, rotate: 0, opacity: 0 }}
                animate={{ x, y, rotate, opacity: 1 }}
                whileHover={selected ? undefined : { y: y - 10 }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 28,
                  delay: dealt ? 0 : 0.09 * i,
                }}
              >
                <PlayingCard task={task} width={cardW} flipDelay={0.09 * i + 0.35} />
              </motion.button>
            )
          })}
      </div>
    </section>
  )
}
