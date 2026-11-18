import { formatTime, formatMinutes } from '../lib/schedule.js'
import { SUITS } from './PlayingCard.jsx'

// Today's plan, written out on a slip of paper like a score sheet.
// Picking a row picks that card in your hand.
export default function Timeline({ blocks, selectedId, onSelect }) {
  const first = blocks[0]
  const last = blocks.at(-1)

  return (
    <section
      aria-labelledby="today"
      className="self-start rounded-[10px] bg-stock px-5 py-6 text-ink shadow-[0_1px_0_rgb(0_0_0/0.3),0_18px_40px_-12px_rgb(0_0_0/0.45)] sm:px-7"
    >
      <h2 id="today" className="font-display text-3xl font-semibold">
        Today
      </h2>
      {last ? (
        <p className="mt-1 text-sm text-ink/65">
          From {formatTime(first.start)} to {formatTime(last.end)}, breaks included.
        </p>
      ) : (
        <p className="mt-2 text-sm text-ink/65">
          Nothing needs doing today. Aces and Kings you add will show up here.
        </p>
      )}

      {blocks.length > 0 && (
        <ol className="mt-5 border-t border-ink">
          {blocks.map((b, i) =>
            b.type === 'task' ? (
              <li key={b.task.id} className="border-b border-rule">
                <button
                  type="button"
                  onClick={() => onSelect(b.task.id)}
                  className={`grid w-full grid-cols-[4.5rem_1rem_1fr_auto] items-baseline gap-x-2 py-3 text-left transition-colors hover:bg-ink/[0.03] ${
                    b.task.id === selectedId ? 'bg-ink/[0.05]' : ''
                  }`}
                >
                  <time className="text-sm text-ink/60 tabular-nums">{formatTime(b.start)}</time>
                  <span aria-hidden className={SUITS[b.task.category].color}>
                    {SUITS[b.task.category].symbol}
                  </span>
                  <span className="leading-snug font-medium">{b.task.title}</span>
                  <span className="font-display text-sm italic text-ink/70">
                    {formatMinutes(b.task.minutes)}
                  </span>
                </button>
              </li>
            ) : (
              <li
                key={`break-${i}`}
                className="grid grid-cols-[4.5rem_1fr] gap-x-2 border-b border-rule py-2 text-sm text-ink/55"
              >
                <time className="tabular-nums">{formatTime(b.start)}</time>
                <span className="font-display italic">
                  {formatMinutes(b.minutes)} break. Stand up, drink water.
                </span>
              </li>
            ),
          )}
        </ol>
      )}
    </section>
  )
}
