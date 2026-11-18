import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import PlayingCard, { SUITS, RANKS } from './PlayingCard.jsx'
import { formatMinutes, formatTime } from '../lib/schedule.js'

const DURATIONS = [5, 10, 15, 30, 45, 60, 90, 120, 180, 240]

// The card you picked, shown large with what it means, plus done / edit / delete.
export default function Spotlight({ task, startsAt, onToggleDone, onUpdate, onDelete, onFocus }) {
  const [editing, setEditing] = useState(false)
  useEffect(() => setEditing(false), [task.id]) // picking another card closes the editor

  const suit = SUITS[task.category]
  const rank = RANKS[task.priority]

  return (
    <section aria-live="polite" className="flex flex-col items-center gap-6 sm:flex-row sm:items-start lg:flex-col lg:items-start">
      <AnimatePresence mode="wait">
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 16, rotate: -2 }}
          animate={{ opacity: task.done ? 0.55 : 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <Tilt>
            <PlayingCard task={task} width={176} />
          </Tilt>
        </motion.div>
      </AnimatePresence>

      <div className="w-full max-w-sm">
        <p className="font-display text-lg italic text-white/75">
          {rank.name} of {suit.name.toLowerCase()}
          {task.done && ', played'}
        </p>

        {editing ? (
          <EditForm
            task={task}
            onCancel={() => setEditing(false)}
            onSave={(patch) => {
              onUpdate(task.id, patch)
              setEditing(false)
            }}
          />
        ) : (
          <>
            <h2
              className={`mt-1 font-display text-3xl leading-tight font-semibold ${
                task.done ? 'text-white/60 line-through decoration-2' : ''
              }`}
            >
              {task.title}
            </h2>
            <dl className="mt-5 grid grid-cols-[6.5rem_1fr] gap-y-2 border-t border-white/20 pt-4 text-[15px]">
              <dt className="text-white/65">When</dt>
              <dd>{rank.meaning}</dd>
              <dt className="text-white/65">Category</dt>
              <dd className="capitalize">{task.category}</dd>
              <dt className="text-white/65">Takes about</dt>
              <dd>{formatMinutes(task.minutes)}</dd>
              <dt className="text-white/65">Scheduled</dt>
              <dd>{startsAt ? formatTime(startsAt) : 'Not on today’s plan'}</dd>
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              {!task.done && (
                <button
                  type="button"
                  onClick={() => onFocus(task.id)}
                  className="rounded-[6px] bg-pip px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#a50d26]"
                >
                  Focus
                </button>
              )}
              <button
                type="button"
                onClick={() => onToggleDone(task.id)}
                className="rounded-[6px] bg-stock px-4 py-2.5 font-medium text-ink transition-colors hover:bg-white/90"
              >
                {task.done ? 'Put back in hand' : 'Mark as done'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm text-white/85 underline decoration-white/35 underline-offset-4 hover:text-white"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="text-sm text-white/85 underline decoration-white/35 underline-offset-4 hover:text-white"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

const field =
  'mt-1 w-full rounded-[6px] border border-white/25 bg-black/15 px-3 py-2 text-white outline-none focus:border-white/70'

function EditForm({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title)
  const [minutes, setMinutes] = useState(task.minutes)
  const [priority, setPriority] = useState(task.priority)
  const [category, setCategory] = useState(task.category)
  const durations = DURATIONS.includes(task.minutes) ? DURATIONS : [...DURATIONS, task.minutes].sort((a, b) => a - b)

  return (
    <form
      className="mt-3 space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSave({ title: title.trim(), minutes: Number(minutes), priority, category })
      }}
    >
      <label className="block text-sm text-white/75">
        Task
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-white/75">
          When
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={field}>
            {Object.entries(RANKS).map(([key, r]) => (
              <option key={key} value={key} className="text-ink">
                {r.name}: {r.meaning.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-white/75">
          Takes
          <select value={minutes} onChange={(e) => setMinutes(e.target.value)} className={field}>
            {durations.map((m) => (
              <option key={m} value={m} className="text-ink">
                {formatMinutes(m)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm text-white/75">
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
          {Object.entries(SUITS).map(([key, s]) => (
            <option key={key} value={key} className="text-ink">
              {s.symbol} {key}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-5 pt-1">
        <button type="submit" className="rounded-[6px] bg-stock px-4 py-2.5 font-medium text-ink hover:bg-white/90">
          Save changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-white/85 underline decoration-white/35 underline-offset-4 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// Tilts the card toward your mouse in 3D, with a soft light that follows the pointer,
// like holding a real card up under a lamp.
function Tilt({ children }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const shine = useMotionValue(0)
  const rotateX = useSpring(rx, { stiffness: 220, damping: 18 })
  const rotateY = useSpring(ry, { stiffness: 220, damping: 18 })
  const opacity = useSpring(shine, { stiffness: 200, damping: 25 })
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgb(255 255 255 / 0.55), transparent 55%)`

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * 18)
    rx.set(-(py - 0.5) * 18)
    gx.set(px * 100)
    gy.set(py * 100)
    shine.set(1)
  }
  function onLeave() {
    rx.set(0)
    ry.set(0)
    shine.set(0)
  }

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 700 }}
      className="relative"
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[13px] mix-blend-soft-light"
        style={{ background: glare, opacity }}
      />
    </motion.div>
  )
}
