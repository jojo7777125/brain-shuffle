// Turns "now" + "today" tasks into time blocks, starting at `start`,
// in the order the tasks are given. Pure function: same input, same output.

const BREAK_MIN = 5 // short break after every task
const LONG_BREAK_MIN = 15 // longer break after ~90 minutes of focus
const LONG_BREAK_EVERY = 90

export function buildTimeline(tasks, start, finishBy = null) {
  const t = new Date(start)
  t.setSeconds(0, 0)

  // Keeps the order it's given, so dragging rows on the Today sheet changes the plan.
  const todays = tasks.filter((task) => task.priority === 'now' || task.priority === 'today')

  const blocks = []
  let focusStreak = 0
  todays.forEach((task, i) => {
    const begin = new Date(t)
    t.setMinutes(t.getMinutes() + task.minutes)
    const end = new Date(t)
    // Flag anything that runs past the time you said you need to be done.
    blocks.push({ type: 'task', task, start: begin, end, late: !!finishBy && end > finishBy })
    focusStreak += task.minutes

    if (i < todays.length - 1) {
      const len = focusStreak >= LONG_BREAK_EVERY ? LONG_BREAK_MIN : BREAK_MIN
      if (len === LONG_BREAK_MIN) focusStreak = 0
      const bStart = new Date(t)
      t.setMinutes(t.getMinutes() + len)
      blocks.push({ type: 'break', minutes: len, start: bStart, end: new Date(t) })
    }
  })
  return blocks
}

// Next 5-minute mark, e.g. 10:47 → 10:50. Used as the default start time.
export function roundUpTo5(date = new Date()) {
  const d = new Date(date)
  d.setSeconds(0, 0)
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5)
  return d
}

// Date ⇄ the "HH:MM" text an <input type="time"> uses.
export const toTimeValue = (d) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

// "16:30" on the same day as `base`. If it's earlier than `after`, it means tomorrow (e.g. past midnight).
export function fromTimeValue(value, base, after = null) {
  const [h, m] = value.split(':').map(Number)
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  if (after && d <= after) d.setDate(d.getDate() + 1)
  return d
}

export const formatTime = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export const formatMinutes = (m) =>
  m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} hr` : `${Math.floor(m / 60)} hr ${m % 60} min`
