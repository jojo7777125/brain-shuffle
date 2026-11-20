import { AnimatePresence, motion } from 'motion/react'
import PlayingCard from './PlayingCard.jsx'
import Capybara from './Capybara.jsx'

// Each played card's resting angle on the pile, from its position, so the pile looks tossed.
const tilt = (i) => ((i * 53) % 29) - 14

/**
 * The middle of the table: the betting circle where you play cards.
 * Drag a card here from your hand. Played cards stay face-up on the pile,
 * and the chips you just won float up.
 */
export default function PlayZone({ zoneRef, dragging, played, chips, lastWin, onSelect, onPutBack }) {
  const pile = played.slice(-5)

  return (
    <section aria-labelledby="table-title" className="flex flex-col items-center">
      <h2 id="table-title" className="sr-only">
        The table
      </h2>
      <div
        ref={zoneRef}
        className={`relative grid h-72 w-full max-w-md place-items-center rounded-[999px] border-2 transition-colors duration-200 ${
          dragging ? 'border-white/80 bg-white/[0.07]' : 'border-white/25'
        }`}
      >
        {/* the inner ring, like the line on a real betting circle */}
        <div className="pointer-events-none absolute inset-3 rounded-[999px] border border-white/10" />

        {pile.length === 0 ? (
          <p className="px-8 text-center font-display text-xl italic text-white/70">
            {dragging ? 'Let go to play it' : 'Drag a card here to play it'}
          </p>
        ) : (
          <div className="relative h-44 w-32">
            <AnimatePresence>
              {pile.map((t, k) => (
                <motion.button
                  key={t.id}
                  type="button"
                  onClick={() => onSelect(t.id)}
                  aria-label={`Played: ${t.title}`}
                  className="absolute inset-0"
                  initial={{ y: 120, scale: 1.15, opacity: 0, rotate: 0 }}
                  animate={{ y: 0, scale: 1, opacity: k === pile.length - 1 ? 1 : 0.9, rotate: tilt(played.length - pile.length + k) }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                >
                  <PlayingCard task={t} width={128} />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* The hidden capybara, peeking over the edge of the circle */}
        <Capybara />

        {/* "+3 chips" floats up from the pile when you play a card */}
        <AnimatePresence>
          {lastWin && (
            <motion.p
              key={lastWin.key}
              aria-hidden
              className="pointer-events-none absolute top-6 font-display text-2xl font-semibold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0, 1, 1, 0], y: -30 }}
              transition={{ duration: 1.4, times: [0, 0.15, 0.7, 1] }}
            >
              +{lastWin.chips} {lastWin.chips === 1 ? 'chip' : 'chips'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-3 text-sm text-white/70">
        {played.length
          ? `${played.length} played, ${chips} ${chips === 1 ? 'chip' : 'chips'} won`
          : 'Aces win 3 chips, Kings 2, Queens 1.'}
      </p>
      {/* Keyboard shortcuts (hidden on phones, where there's no keyboard) */}
      <p className="mt-1 hidden text-xs text-white/50 sm:block">
        Keys: <kbd>←</kbd> <kbd>→</kbd> pick a card · <kbd>P</kbd> play it · <kbd>N</kbd> draw next
      </p>

      {played.length > 0 && (
        <ul className="mt-3 flex max-w-md flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
          {played.map((t) => (
            <li key={t.id} className="flex items-baseline gap-2">
              <span className="text-white/65 line-through decoration-white/40">{t.title}</span>
              <button
                type="button"
                onClick={() => onPutBack(t.id)}
                className="text-white/85 underline decoration-white/35 underline-offset-4 hover:text-white"
              >
                Put back
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
