// Saves your plan in this browser (localStorage), so a refresh doesn't lose it.
// No accounts, no database: it lives only on this device.
// Every read and write is wrapped in try/catch, because private browsing or full storage can make it fail,
// and the app should keep working either way.
import { roundUpTo5 } from './schedule.js'

const PLAN_KEY = 'brain-shuffle:plan:v1'
const DRAFT_KEY = 'brain-shuffle:draft:v1'

export function savePlan(plan) {
  try {
    if (plan) localStorage.setItem(PLAN_KEY, JSON.stringify(plan)) // Dates become text here
    else localStorage.removeItem(PLAN_KEY)
  } catch {
    /* storage unavailable: the plan just won't survive a refresh */
  }
}

export function loadPlan() {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAN_KEY))
    if (!raw || !Array.isArray(raw.tasks) || !Array.isArray(raw.notTasks)) return null

    // Keep only cards that still look like cards (protects against old or edited data).
    const tasks = raw.tasks.filter((t) => t && t.id && typeof t.title === 'string')
    const notTasks = raw.notTasks.filter((n) => n && n.id && typeof n.text === 'string')

    // Text back into Dates.
    let startAt = new Date(raw.startAt)
    let finishBy = raw.finishBy ? new Date(raw.finishBy) : null
    if (isNaN(startAt)) startAt = roundUpTo5()

    // Opened on a later day? Yesterday's times are wrong, so start fresh from now.
    if (startAt.toDateString() !== new Date().toDateString() && startAt < new Date()) {
      startAt = roundUpTo5()
      finishBy = null
    }

    return { ...raw, tasks, notTasks, startAt, finishBy }
  } catch {
    return null
  }
}

export function saveDraft(text) {
  try {
    if (text) localStorage.setItem(DRAFT_KEY, text)
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export function loadDraft() {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

// The chip bank: your record across rounds. { best, total, rounds }
const BANK_KEY = 'brain-shuffle:bank:v1'

export function loadBank() {
  try {
    const b = JSON.parse(localStorage.getItem(BANK_KEY))
    if (b && Number.isFinite(b.best) && Number.isFinite(b.total) && Number.isFinite(b.rounds)) return b
  } catch {
    /* fall through */
  }
  return { best: 0, total: 0, rounds: 0 }
}

// Called when a round ends (you cash out into a new round, or start a new dump with chips on the table).
export function bankRound(chips) {
  const b = loadBank()
  if (!chips) return b
  const next = { best: Math.max(b.best, chips), total: b.total + chips, rounds: b.rounds + 1 }
  try {
    localStorage.setItem(BANK_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}
