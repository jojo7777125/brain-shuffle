import { AnimatePresence, motion } from 'motion/react'
import PlayingCard, { SUITS, RANKS } from './PlayingCard.jsx'
import { formatMinutes, formatTime } from '../lib/schedule.js'

// The card you picked, shown large with what it means.
export default function Spotlight({ task, startsAt }) {
  if (!task) return null
  const suit = SUITS[task.category]
  const rank = RANKS[task.priority]

  return (
    <section aria-live="polite" className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 16, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <PlayingCard task={task} width={176} />
        </motion.div>
      </AnimatePresence>

      <div className="w-full max-w-sm">
        <p className="font-display text-lg italic text-white/75">
          {rank.name} of {suit.name.toLowerCase()}
        </p>
        <h2 className="mt-1 font-display text-3xl leading-tight font-semibold">{task.title}</h2>
        <dl className="mt-5 grid grid-cols-[6.5rem_1fr] gap-y-2 border-t border-white/20 pt-4 text-[15px]">
          <dt className="text-white/60">When</dt>
          <dd>{rank.meaning}</dd>
          <dt className="text-white/60">Category</dt>
          <dd className="capitalize">{task.category}</dd>
          <dt className="text-white/60">Takes about</dt>
          <dd>{formatMinutes(task.minutes)}</dd>
          <dt className="text-white/60">Scheduled</dt>
          <dd>{startsAt ? formatTime(startsAt) : 'Not on today’s plan'}</dd>
        </dl>
      </div>
    </section>
  )
}
