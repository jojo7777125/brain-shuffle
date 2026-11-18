// Offline "fake AI". Used when the real API is off or fails, so the demo never breaks.
// It's a few keyword rules — not smart, but it reacts to what you actually typed.
import { normalizePlan } from './schema.js'

export const SAMPLE_DUMP = `finish history essay due tomorrow!!
buy milk and eggs
I'm worried I'm going to fail the chem test
email coach about practice
clean my room
idea: app that reminds you to drink water
call grandma this weekend
study for chem test
what if nobody likes my presentation
return library books`

const rules = {
  worry: /\b(worr|anxious|scared|stress|nervous|afraid|what if|freaking out|overwhelm)/i,
  idea: /\b(idea|someday|would be cool|could make|could build|maybe i should|dream)/i,
  now: /\b(asap|urgent|right now|due today|due tonight|due tomorrow|overdue|!!)/i,
  later: /\b(weekend|next week|eventually|someday|later|this month)/i,
  school: /\b(essay|homework|hw|study|test|exam|quiz|class|teacher|project|read|chapter|school|presentation|library)/i,
  work: /\b(work|shift|boss|coach|job|meeting|email|client|practice)/i,
  errands: /\b(buy|pick up|grocer|store|return|drop off|mail|bank|milk|eggs|pharmacy)/i,
}

function guessMinutes(text) {
  if (/\b(essay|project|study|presentation)/i.test(text)) return 60
  if (/\b(homework|hw|clean|grocer|test|exam)/i.test(text)) return 45
  if (/\b(email|text|call|reply|message|book)/i.test(text)) return 15
  return 30
}

function tidy(text) {
  const t = text
    .replace(/^(idea|todo|task)\s*:\s*/i, '')
    .replace(/^(i\s+)?(really\s+)?(need to|have to|gotta|got to|should|must|remember to|don'?t forget to)\s+/i, '')
    .replace(/!+$/, '')
    .trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// Breaks a dump into separate thoughts: one per line or sentence.
// Also used by the landing screen to drop one card per thought onto the table.
export const splitThoughts = (text) =>
  text
    .split(/\n|;|•|(?<=[.?!])\s+/)
    .map((s) => s.replace(/^[-*\d.)\s]+/, '').trim())
    .filter((s) => s.length > 2)

export function mockSort(dump) {
  const pieces = splitThoughts(dump.trim() || SAMPLE_DUMP)

  const tasks = []
  const notTasks = []
  for (const piece of pieces) {
    if (rules.worry.test(piece)) notTasks.push({ text: piece, kind: 'worry' })
    else if (rules.idea.test(piece)) notTasks.push({ text: tidy(piece), kind: 'idea' })
    else
      tasks.push({
        title: tidy(piece),
        minutes: guessMinutes(piece),
        priority: rules.now.test(piece) ? 'now' : rules.later.test(piece) ? 'later' : 'today',
        category: rules.errands.test(piece)
          ? 'errands'
          : rules.school.test(piece)
            ? 'school'
            : rules.work.test(piece)
              ? 'work'
              : 'personal',
      })
  }
  // The offline dealer is simple: point at your most urgent card.
  const first = tasks.find((t) => t.priority === 'now') ?? tasks.find((t) => t.priority === 'today') ?? tasks[0]
  const rankName = { now: 'Ace', today: 'King', later: 'Queen' }
  const dealerNote = first ? `Play your ${rankName[first.priority]} first: ${first.title.toLowerCase()}.` : ''
  return normalizePlan({ tasks, notTasks, dealerNote })
}
