// Turns "now" + "today" tasks into time blocks, starting at the next 5-minute mark.
// Pure function: same input → same output. Easy to explain, easy to test.

const BREAK_MIN = 5 // short break after every task
const LONG_BREAK_MIN = 15 // longer break after ~90 minutes of focus
const LONG_BREAK_EVERY = 90

export function buildTimeline(tasks, start = new Date()) {
  const t = new Date(start)
  t.setSeconds(0, 0)
  t.setMinutes(Math.ceil(t.getMinutes() / 5) * 5)

  const order = { now: 0, today: 1 }
  const todays = tasks
    .filter((task) => task.priority === 'now' || task.priority === 'today')
    .sort((a, b) => order[a.priority] - order[b.priority]) // stable: keeps list order within a group

  const blocks = []
  let focusStreak = 0
  todays.forEach((task, i) => {
    const begin = new Date(t)
    t.setMinutes(t.getMinutes() + task.minutes)
    blocks.push({ type: 'task', task, start: begin, end: new Date(t) })
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

export const formatTime = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export const formatMinutes = (m) =>
  m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} hr` : `${Math.floor(m / 60)} hr ${m % 60} min`
