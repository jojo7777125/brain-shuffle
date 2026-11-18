import { motion } from 'motion/react'
import { SAMPLE_DUMP, splitThoughts } from '../lib/mockSort.js'
import ThoughtPile from './ThoughtPile.jsx'
import MicButton from './MicButton.jsx'

const STEPS = [
  { suit: '♠', red: false, title: 'Dump it', text: 'Type everything on your mind. Messy is fine.' },
  { suit: '♥', red: true, title: 'Shuffle it', text: 'AI pulls out the tasks, ranks them, and sets worries aside.' },
  { suit: '♦', red: true, title: 'Play it', text: 'A plan for today, a focus timer, and chips for every card you finish.' },
]

// The landing screen. Desktop: words and the writing pad on the left, the card pile on the right.
// Phones: title, pad, pile, then the three steps (so you can start typing without scrolling).
export default function DumpBox({ value, onChange, onSort, sorting }) {
  const canSort = value.trim().length > 0 && !sorting
  const thoughts = splitThoughts(value)

  return (
    <motion.section
      exit={{ opacity: 0 }}
      className="mx-auto grid w-full max-w-6xl gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]"
    >
      <div className="order-1 lg:order-none lg:col-start-1 lg:row-start-1">
        <h1 className="font-display text-6xl leading-[0.92] font-semibold sm:text-8xl">
          Brain
          <br />
          Shuffle
        </h1>
        <p className="mt-5 max-w-md text-lg text-white/80">
          Empty your head onto the table. Get it dealt back as a hand you can actually play.
        </p>
      </div>

      <div className="order-3 lg:order-none lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-center">
        <ThoughtPile thoughts={thoughts} shuffling={sorting} />
      </div>

      <div className="order-2 lg:order-none lg:col-start-1 lg:row-start-2">
        <div className="rounded-[10px] bg-stock text-ink shadow-[0_1px_0_rgb(0_0_0/0.3),0_18px_40px_-12px_rgb(0_0_0/0.45)]">
          <label htmlFor="dump" className="sr-only">
            Everything on your mind
          </label>
          <textarea
            id="dump"
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSort) onSort()
            }}
            disabled={sorting}
            placeholder="What's on your mind? Dump it all here."
            className="block h-56 w-full resize-none rounded-t-[10px] bg-transparent px-6 pt-6 pb-4 text-lg leading-relaxed outline-none sm:h-64"
          />
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule px-6 py-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <MicButton value={value} onChange={onChange} disabled={sorting} />
              <button
                type="button"
                onClick={() => onChange(SAMPLE_DUMP)}
                disabled={sorting}
                className="text-sm text-ink/60 underline decoration-ink/25 underline-offset-4 hover:text-ink"
              >
                Fill in an example
              </button>
            </div>
            <button
              type="button"
              onClick={onSort}
              disabled={!canSort}
              className="rounded-[6px] bg-pip px-6 py-3 font-medium text-white transition-colors hover:bg-[#a50d26] focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-ink/20"
            >
              {sorting ? 'Shuffling…' : 'Sort my brain'}
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-white/55">Tip: Ctrl + Enter sorts from the text box.</p>
      </div>

      <ol className="order-4 grid gap-5 border-t border-white/20 pt-6 sm:grid-cols-3 lg:order-none lg:col-start-1 lg:row-start-3">
        {STEPS.map((s) => (
          <li key={s.title}>
            <p className="font-display text-xl font-semibold">
              <span aria-hidden className={`mr-2 ${s.red ? 'text-[#ff9aa8]' : 'text-white'}`}>
                {s.suit}
              </span>
              {s.title}
            </p>
            <p className="mt-1 text-sm leading-snug text-white/70">{s.text}</p>
          </li>
        ))}
      </ol>
    </motion.section>
  )
}
