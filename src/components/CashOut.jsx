import { useEffect } from 'react'
import { motion } from 'motion/react'
import PlayingCard from './PlayingCard.jsx'
import { formatMinutes } from '../lib/schedule.js'
import * as sfx from '../lib/sfx.js'

/**
 * End-of-day recap. Like cashing out at a casino: count your chips,
 * see every card you played, and what's still in your hand for tomorrow.
 */
export default function CashOut({ played, left, chips, bank, onClose, onNewDump, onCarryOver }) {
  const minutes = played.reduce((sum, t) => sum + t.minutes, 0)
  const aces = played.filter((t) => t.priority === 'now').length

  // One chip clink per card played (up to 6), as the chips get counted.
  useEffect(() => {
    played.slice(0, 6).forEach((_, i) => setTimeout(() => sfx.clink(), 300 + i * 160))
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // only once, when the recap opens

  const verdict =
    left.length === 0
      ? 'You cleared the table. Nothing left in your hand.'
      : aces > 0
        ? `You played ${aces === 1 ? 'an Ace' : `${aces} Aces`}. The ${left.length === 1 ? 'card' : `${left.length} cards`} left can wait for tomorrow.`
        : `${left.length === 1 ? 'One card stays' : `${left.length} cards stay`} in your hand for tomorrow.`

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cashout-title"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-felt-deep/95 px-4 py-10 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-2xl text-center">
        <p className="text-sm font-medium tracking-wide text-white/60 uppercase">Cashing out</p>
        <h2 id="cashout-title" className="mt-2 font-display text-7xl font-semibold tabular-nums sm:text-8xl">
          {chips}
          <span className="ml-3 text-3xl font-normal text-white/75 sm:text-4xl">{chips === 1 ? 'chip' : 'chips'}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md font-display text-xl italic text-white/85">{verdict}</p>
        {/* Your record from earlier rounds, kept in this browser */}
        {bank.rounds > 0 ? (
          <p className="mt-3 text-sm text-white/70">
            {chips > bank.best ? (
              <span className="mr-2 rounded-[4px] bg-[#ffd76a] px-2 py-0.5 font-semibold text-ink">New best round</span>
            ) : (
              <span className="mr-2">Best round: {bank.best}.</span>
            )}
            Bank: {bank.total + chips} chips over {bank.rounds + 1} rounds.
          </p>
        ) : (
          <p className="mt-3 text-sm text-white/70">Your first round. Every round after this goes in the bank.</p>
        )}

        {/* The cards you played, dealt out one by one */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {played.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ y: 40, opacity: 0, rotate: -8 }}
              animate={{ y: 0, opacity: 1, rotate: ((i * 7) % 9) - 4 }}
              transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
            >
              <PlayingCard task={t} width={80} />
            </motion.div>
          ))}
        </div>

        <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4 border-y border-white/15 py-5">
          <Stat label="Cards played" value={played.length} />
          <Stat label="Time of work" value={minutes ? formatMinutes(minutes) : '0 min'} />
          <Stat label="Left in hand" value={left.length} />
        </dl>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-[6px] bg-stock px-5 py-2.5 font-medium text-ink hover:bg-white/90"
          >
            Back to the table
          </button>
          {/* Cards you didn't play aren't thrown away: they start the next round. */}
          <button
            type="button"
            onClick={left.length ? onCarryOver : onNewDump}
            className="rounded-[6px] bg-pip px-5 py-2.5 font-medium text-white hover:bg-[#a50d26]"
          >
            {left.length ? `New round with my ${left.length === 1 ? 'last card' : `${left.length} cards`}` : 'Start a new dump'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-white/60">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold">{value}</dd>
    </div>
  )
}
