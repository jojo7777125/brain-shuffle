// The "contract" between the AI and the app.
// Whatever comes back (real AI or mock), it goes through normalizePlan()
// so the UI can trust the shape. Used by BOTH the browser and the server.

export const PRIORITIES = ['now', 'today', 'later']
export const CATEGORIES = ['school', 'work', 'personal', 'errands']
export const NOTE_KINDS = ['worry', 'idea', 'note']

let counter = 0
export const makeId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

const clean = (s) => (typeof s === 'string' ? s.trim().replace(/\s+/g, ' ') : '')
const pick = (value, allowed, fallback) => {
  const v = clean(value).toLowerCase()
  return allowed.includes(v) ? v : fallback
}

// Accepts 30, "30", "30m", "1h", "1.5 h", "1h 30m" → minutes
export function toMinutes(value) {
  if (typeof value === 'number' && isFinite(value)) return value
  const s = clean(String(value ?? '')).toLowerCase()
  const h = s.match(/([\d.]+)\s*h/)
  const m = s.match(/([\d.]+)\s*m/)
  if (h || m) return (h ? parseFloat(h[1]) * 60 : 0) + (m ? parseFloat(m[1]) : 0)
  const n = parseFloat(s)
  return isFinite(n) ? n : 30
}

// Round to 5 minutes, keep between 5 min and 4 hours
const clampMinutes = (n) => Math.min(240, Math.max(5, Math.round(n / 5) * 5))

/**
 * Takes untrusted data and returns a safe plan:
 * { tasks: [{id,title,minutes,priority,category,done}], notTasks: [{id,text,kind}] }
 * Throws if there is nothing usable.
 */
export function normalizePlan(raw, { allowEmpty = false } = {}) {
  if (!raw || typeof raw !== 'object') throw new Error('AI response was not an object')

  const tasks = (Array.isArray(raw.tasks) ? raw.tasks : [])
    .map((t) => ({
      id: makeId('t'),
      title: clean(t?.title).slice(0, 140),
      minutes: clampMinutes(toMinutes(t?.minutes ?? t?.estimate ?? t?.time)),
      priority: pick(t?.priority, PRIORITIES, 'today'),
      category: pick(t?.category, CATEGORIES, 'personal'),
      done: false,
    }))
    .filter((t) => t.title)
    .slice(0, 40)

  const notTasks = (Array.isArray(raw.notTasks) ? raw.notTasks : [])
    .map((n) => ({
      id: makeId('n'),
      text: clean(typeof n === 'string' ? n : n?.text).slice(0, 280),
      kind: pick(n?.kind, NOTE_KINDS, 'note'),
    }))
    .filter((n) => n.text)
    .slice(0, 40)

  if (!tasks.length && !notTasks.length && !allowEmpty) throw new Error('AI response had no tasks or notes')
  // The dealer's one-line tip (optional).
  const dealerNote = clean(raw.dealerNote).slice(0, 180)
  return { tasks, notTasks, dealerNote }
}
