import { motion } from 'motion/react'
import { formatMinutes } from '../lib/schedule.js'

// The deck rules (great for the pitch):
//   suit = category    ♠ school   ♣ work   ♥ personal   ♦ errands
//   rank = priority    A = now (play these first)   K = today   Q = later
export const SUITS = {
  school: { symbol: '♠', color: 'text-ink' },
  work: { symbol: '♣', color: 'text-ink' },
  personal: { symbol: '♥', color: 'text-pip' },
  errands: { symbol: '♦', color: 'text-pip' },
}
const RANK = { now: 'A', today: 'K', later: 'Q' }

const ROWS = [
  { key: 'now', title: 'Aces', note: 'Do these now.' },
  { key: 'today', title: 'Kings', note: 'The rest of today.' },
  { key: 'later', title: 'Queens', note: 'Not today, and that’s fine.' },
]

// The one big moment: cards are dealt onto the table, one after another.
const deal = (i) => ({
  initial: { opacity: 0, y: -40, rotate: i % 2 ? 6 : -6 },
  animate: { opacity: 1, y: 0, rotate: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 26, delay: 0.08 * i },
})

export default function TaskList({ tasks }) {
  let i = 0
  return (
    <section aria-labelledby="hand">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="hand" className="font-display text-3xl font-semibold">
          Your hand
        </h2>
        <dl className="flex gap-4 text-sm text-white/75">
          {Object.entries(SUITS).map(([name, s]) => (
            <div key={name} className="flex items-center gap-1.5">
              <dt className={`text-base ${s.color === 'text-pip' ? 'text-[#ff8a9a]' : 'text-white'}`}>
                {s.symbol}
              </dt>
              <dd>{name}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 space-y-8">
        {ROWS.map((row) => {
          const items = tasks.filter((t) => t.priority === row.key)
          if (!items.length) return null
          return (
            <div key={row.key}>
              <h3 className="font-display text-xl font-semibold">
                {row.title}{' '}
                <span className="font-sans text-sm font-normal text-white/65">{row.note}</span>
              </h3>
              <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3 sm:gap-4">
                {items.map((t) => (
                  <motion.li key={t.id} {...deal(i++)}>
                    <PlayingCard task={t} />
                  </motion.li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function PlayingCard({ task }) {
  const suit = SUITS[task.category]
  const rank = RANK[task.priority]
  const isAce = rank === 'A'

  const Index = ({ flip }) => (
    <div
      aria-hidden
      className={`absolute flex flex-col items-center leading-none ${suit.color} ${
        flip ? 'right-2 bottom-2 rotate-180' : 'top-2 left-2'
      }`}
    >
      <span className="font-display text-[22px] font-bold">{rank}</span>
      <span className="text-[15px]">{suit.symbol}</span>
    </div>
  )

  return (
    <article
      aria-label={`${task.title}, ${formatMinutes(task.minutes)}, ${task.category}`}
      className="relative aspect-[5/7] rounded-[10px] bg-stock text-ink shadow-[0_1px_0_rgb(0_0_0/0.35),0_10px_22px_-8px_rgb(0_0_0/0.5)]"
    >
      <Index />
      <Index flip />

      {isAce ? (
        // Aces: one big pip in the middle, like a real ace
        <div className="absolute inset-x-6 inset-y-8 flex flex-col items-center justify-center text-center">
          <span aria-hidden className={`text-5xl leading-none ${suit.color}`}>
            {suit.symbol}
          </span>
          <p className="mt-3 text-[13px] leading-snug font-semibold">{task.title}</p>
          <p className="mt-1 font-display text-[13px] italic">{formatMinutes(task.minutes)}</p>
        </div>
      ) : (
        // Kings and Queens: a framed panel, like the picture on a court card
        <div
          className={`absolute inset-x-6 inset-y-8 flex flex-col items-center justify-center rounded-[3px] border px-2 text-center ${
            suit.color === 'text-pip' ? 'border-pip/35' : 'border-ink/30'
          }`}
        >
          <p className="text-[13px] leading-snug font-semibold">{task.title}</p>
          <p className="mt-1.5 font-display text-[13px] italic text-ink/70">
            {formatMinutes(task.minutes)}
          </p>
        </div>
      )}
    </article>
  )
}
