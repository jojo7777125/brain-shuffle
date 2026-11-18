import { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'motion/react'
import { formatTime, formatMinutes, toTimeValue, fromTimeValue, roundUpTo5 } from '../lib/schedule.js'
import { SUITS } from './PlayingCard.jsx'

// The current time, refreshed every 20 seconds.
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000)
    return () => clearInterval(t)
  }, [])
  return now
}

const timeInput =
  'mt-1 block rounded-[6px] border border-rule bg-white px-2 py-1.5 text-ink tabular-nums outline-none focus:border-ink'

/**
 * Today's plan, written out on a slip of paper like a score sheet.
 * You choose when you start and when you need to be done; the times follow.
 * Check a box to mark a task done, drag the handle (or use arrow keys) to reorder.
 */
export default function Timeline({
  blocks,
  tasks,
  startAt,
  finishBy,
  onStartChange,
  onFinishChange,
  selectedId,
  onSelect,
  onToggleDone,
  onReorder,
  onMove,
}) {
  const now = useNow()
  const taskBlocks = blocks.filter((b) => b.type === 'task')
  const last = blocks.at(-1)
  const late = taskBlocks.filter((b) => b.late && !b.task.done)

  return (
    <section
      aria-labelledby="today"
      className="self-start rounded-[10px] bg-stock px-5 py-6 text-ink shadow-[0_1px_0_rgb(0_0_0/0.3),0_18px_40px_-12px_rgb(0_0_0/0.45)] sm:px-7"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="today" className="font-display text-3xl font-semibold">
          Today
        </h2>
        <p className="text-sm text-ink/60">
          It’s <time className="font-medium text-ink tabular-nums">{formatTime(now)}</time>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3 text-sm text-ink/70">
        <label>
          Start at
          <input
            type="time"
            value={toTimeValue(startAt)}
            onChange={(e) => e.target.value && onStartChange(fromTimeValue(e.target.value, startAt))}
            className={timeInput}
          />
        </label>
        <label>
          Done by <span className="text-ink/45">(optional)</span>
          <input
            type="time"
            value={finishBy ? toTimeValue(finishBy) : ''}
            onChange={(e) =>
              onFinishChange(e.target.value ? fromTimeValue(e.target.value, startAt, startAt) : null)
            }
            className={timeInput}
          />
        </label>
        <button
          type="button"
          onClick={() => onStartChange(roundUpTo5(new Date()))}
          className="pb-2 text-ink/70 underline decoration-ink/25 underline-offset-4 hover:text-ink"
        >
          Start now
        </button>
      </div>

      {last ? (
        <p className="mt-4 text-sm text-ink/65">
          {formatTime(blocks[0].start)} to {formatTime(last.end)}, breaks included.
          {late.length > 0 && (
            <span className="mt-1 block text-pip">
              {late.length === 1 ? '1 task runs' : `${late.length} tasks run`} past {formatTime(finishBy)}. Move
              {late.length === 1 ? ' it' : ' them'} down, make {late.length === 1 ? 'it a Queen' : 'them Queens'}, or
              start earlier.
            </span>
          )}
        </p>
      ) : (
        <p className="mt-4 text-sm text-ink/65">
          Nothing needs doing today. Aces and Kings you add will show up here.
        </p>
      )}

      {taskBlocks.length > 0 && (
        <Reorder.Group as="ol" axis="y" values={tasks} onReorder={onReorder} className="mt-4 border-t border-ink">
          {taskBlocks.map((b) => {
            const next = blocks[blocks.indexOf(b) + 1]
            return (
              <Row
                key={b.task.id}
                block={b}
                breakAfter={next?.type === 'break' ? next : null}
                selected={b.task.id === selectedId}
                onSelect={onSelect}
                onToggleDone={onToggleDone}
                onMove={onMove}
              />
            )
          })}
        </Reorder.Group>
      )}
    </section>
  )
}

function Row({ block, breakAfter, selected, onSelect, onToggleDone, onMove }) {
  const controls = useDragControls()
  const { task, start, late } = block
  const suit = SUITS[task.category]

  return (
    <Reorder.Item value={task} as="li" dragListener={false} dragControls={controls} className="relative bg-stock">
      <div
        className={`grid grid-cols-[1.25rem_4.25rem_1rem_1fr_auto_1.5rem] items-center gap-x-2 border-b border-rule py-2.5 ${
          selected ? 'bg-ink/[0.05]' : ''
        }`}
      >
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggleDone(task.id)}
          aria-label={`Mark “${task.title}” as done`}
          className="size-4 accent-ink"
        />
        <time className={`text-sm tabular-nums ${late && !task.done ? 'text-pip' : 'text-ink/60'}`}>
          {formatTime(start)}
        </time>
        <span aria-hidden className={suit.color}>
          {suit.symbol}
        </span>
        <button
          type="button"
          onClick={() => onSelect(task.id)}
          className={`text-left leading-snug font-medium hover:underline hover:decoration-ink/30 hover:underline-offset-4 ${
            task.done ? 'text-ink/40 line-through' : ''
          }`}
        >
          {task.title}
        </button>
        <span className="font-display text-sm italic text-ink/70">{formatMinutes(task.minutes)}</span>
        <button
          type="button"
          aria-label={`Move “${task.title}”. Drag, or use the up and down arrow keys.`}
          onPointerDown={(e) => controls.start(e)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              onMove(task.id, e.key === 'ArrowUp' ? -1 : 1)
            }
          }}
          className="grid h-8 w-6 cursor-grab touch-none place-items-center rounded text-ink/35 hover:text-ink active:cursor-grabbing"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden fill="currentColor">
            {[2, 8, 14].map((y) => (
              <g key={y}>
                <circle cx="2.5" cy={y} r="1.5" />
                <circle cx="7.5" cy={y} r="1.5" />
              </g>
            ))}
          </svg>
        </button>
      </div>
      {breakAfter && (
        <div className="grid grid-cols-[1.25rem_4.25rem_1fr] gap-x-2 border-b border-rule py-2 text-sm text-ink/55">
          <span />
          <time className="tabular-nums">{formatTime(breakAfter.start)}</time>
          <span className="font-display italic">{formatMinutes(breakAfter.minutes)} break. Stand up, drink water.</span>
        </div>
      )}
    </Reorder.Item>
  )
}
