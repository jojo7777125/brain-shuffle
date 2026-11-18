// The one function the UI calls. It tries the real AI (through OUR server, never directly),
// and falls back to the mock if anything goes wrong. Returns { plan, source }.
import { normalizePlan } from './schema.js'
import { mockSort } from './mockSort.js'

const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export async function sortBrain(dump) {
  if (!FORCE_MOCK) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 25000)
      const res = await fetch('/api/sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Your local day and time, so the AI can judge what "tonight" or "tomorrow" means for you.
        body: JSON.stringify({
          dump,
          localTime: new Date().toLocaleString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `Server said ${res.status}`)
      return { plan: normalizePlan(body), source: 'ai' }
    } catch (err) {
      console.warn('[Brain Shuffle] AI failed, using offline sorter:', err.message)
    }
  }
  await wait(900) // a short pause so the "sorting" moment still feels real
  return { plan: mockSort(dump), source: 'mock' }
}
