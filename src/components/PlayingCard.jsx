import { motion } from 'motion/react'
import { formatMinutes } from '../lib/schedule.js'

// The deck rules (great for the pitch):
//   suit = category    ♠ school   ♣ work   ♥ personal   ♦ errands
//   rank = priority    A = now (play these first)   K = today   Q = later
export const SUITS = {
  school: { symbol: '♠', name: 'Spades', color: 'text-ink' },
  work: { symbol: '♣', name: 'Clubs', color: 'text-ink' },
  personal: { symbol: '♥', name: 'Hearts', color: 'text-pip' },
  errands: { symbol: '♦', name: 'Diamonds', color: 'text-pip' },
}
export const RANKS = {
  now: { letter: 'A', name: 'Ace', meaning: 'Do it now' },
  today: { letter: 'K', name: 'King', meaning: 'Do it today' },
  later: { letter: 'Q', name: 'Queen', meaning: 'It can wait' },
}

/**
 * One playing card. Everything inside is sized in `em`, so the same card
 * works small in your hand and large in the spotlight: set `width` and it scales.
 * `flipDelay` makes it start face-down and turn over (used when cards are dealt).
 */
export default function PlayingCard({ task, width = 120, flipDelay = null }) {
  return (
    <div
      className="relative"
      style={{ width, height: width * 1.4, fontSize: width / 8, perspective: width * 6 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        initial={flipDelay === null ? false : { rotateY: 180 }}
        animate={{ rotateY: 0 }}
        transition={{ duration: 0.5, delay: flipDelay ?? 0, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <CardFace task={task} />
        <CardBack />
      </motion.div>
    </div>
  )
}

const sideStyle = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }

function CardFace({ task }) {
  const suit = SUITS[task.category]
  const rank = RANKS[task.priority]
  const isAce = rank.letter === 'A'
  const frame = suit.color === 'text-pip' ? 'border-pip/35' : 'border-ink/30'
  // Longer titles get smaller text so they stay inside the card's frame (and the time stays inside too).
  // A single long word (like "prescription") also needs smaller text, or it pokes out the sides.
  const len = task.title.length
  const longestWord = Math.max(...task.title.split(/\s+/).map((w) => w.length))
  const titleSize =
    len > 42 || longestWord > 12 ? 'text-[0.6em]' : len > 26 || longestWord > 9 ? 'text-[0.68em]' : 'text-[0.82em]'

  const Index = ({ flip }) => (
    <div
      aria-hidden
      className={`absolute flex w-[1.6em] flex-col items-center leading-none ${suit.color} ${
        flip ? 'right-[0.45em] bottom-[0.45em] rotate-180' : 'top-[0.45em] left-[0.45em]'
      }`}
    >
      {/* opsz 6 = Bodoni's sturdy small-print shapes, so the index stays readable at any size */}
      <span className="font-display text-[1.55em] font-bold" style={{ fontVariationSettings: '"opsz" 6' }}>
        {rank.letter}
      </span>
      <span className="mt-[0.1em] text-[1.05em]">{suit.symbol}</span>
    </div>
  )

  return (
    <div
      style={sideStyle}
      className="absolute inset-0 overflow-hidden rounded-[0.6em] bg-[linear-gradient(160deg,#ffffff_0%,#fbfaf7_100%)] text-ink shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_0.08em_0_rgb(0_0_0/0.3),0_0.7em_1.4em_-0.5em_rgb(0_0_0/0.55)]"
    >
      <Index />
      <Index flip />
      {isAce ? (
        <div className="absolute inset-x-[1.9em] inset-y-[2.2em] flex flex-col items-center justify-center text-center">
          <span aria-hidden className={`text-[3.4em] leading-none ${suit.color}`}>
            {suit.symbol}
          </span>
          <p className={`mt-[0.5em] line-clamp-2 w-full shrink-0 leading-snug font-semibold break-words hyphens-auto ${titleSize}`}>{task.title}</p>
          <p className="mt-[0.2em] shrink-0 font-display text-[0.82em] italic">
            {formatMinutes(task.minutes)}
          </p>
        </div>
      ) : (
        <div
          className={`absolute inset-x-[1.9em] inset-y-[2.2em] flex flex-col items-center justify-center overflow-hidden rounded-[0.25em] border px-[0.35em] py-[0.4em] text-center ${frame}`}
        >
          {/* faint giant rank letter, where a court card would have its portrait */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 grid place-items-center font-display text-[5em] leading-none font-bold opacity-[0.07] ${suit.color}`}
          >
            {rank.letter}
          </span>
          <p className={`relative line-clamp-5 w-full leading-snug font-semibold break-words hyphens-auto ${titleSize}`}>{task.title}</p>
          <p className="relative mt-[0.3em] shrink-0 font-display text-[0.82em] italic text-ink/70">
            {formatMinutes(task.minutes)}
          </p>
        </div>
      )}
    </div>
  )
}

// Classic red card back: a fine lattice inside a white border. Shared with the landing pile.
export const BACK_PATTERN =
  'rounded-[0.3em] bg-[#8e1b2a] bg-[repeating-linear-gradient(45deg,rgb(255_255_255/0.14)_0_1px,transparent_1px_0.5em),repeating-linear-gradient(-45deg,rgb(255_255_255/0.14)_0_1px,transparent_1px_0.5em)] ring-1 ring-[#8e1b2a] ring-offset-[0.15em] ring-offset-stock'

function CardBack() {
  return (
    <div
      aria-hidden
      style={{ ...sideStyle, transform: 'rotateY(180deg)' }}
      className="absolute inset-0 rounded-[0.6em] bg-stock p-[0.4em] shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_0.7em_1.4em_-0.5em_rgb(0_0_0/0.55)]"
    >
      <div className={`h-full w-full ${BACK_PATTERN}`} />
    </div>
  )
}
