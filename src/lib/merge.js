// Feature 4: shuffle newly sorted cards into the hand you already have.
// Pure function: takes the current plan and the new sort, returns the merged plan plus what was added.

const ORDER = { now: 0, today: 1, later: 2 }

// "Buy milk!" and "buy  milk" count as the same thing.
const sameKey = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export function mergePlan(plan, addition) {
  const seenTasks = new Set(plan.tasks.map((t) => sameKey(t.title)))
  const seenNotes = new Set(plan.notTasks.map((n) => sameKey(n.text)))

  // Skip anything already in the hand (or repeated within the new batch).
  const newTasks = addition.tasks.filter((t) => {
    const k = sameKey(t.title)
    if (seenTasks.has(k)) return false
    seenTasks.add(k)
    return true
  })
  const newNotes = addition.notTasks.filter((n) => {
    const k = sameKey(n.text)
    if (seenNotes.has(k)) return false
    seenNotes.add(k)
    return true
  })

  // Slot each new card in by rank: a new Ace goes after your Aces but before your Kings,
  // so the Today schedule stays in a sensible order (you can still drag it anywhere).
  const tasks = [...plan.tasks]
  for (const task of newTasks) {
    let at = 0
    tasks.forEach((t, i) => {
      if (ORDER[t.priority] <= ORDER[task.priority]) at = i + 1
    })
    tasks.splice(at, 0, task)
  }

  return {
    // The dealer reacts to the new cards; if there were none, keep the old tip.
    plan: {
      ...plan,
      tasks,
      notTasks: [...plan.notTasks, ...newNotes],
      dealerNote: (newTasks.length && addition.dealerNote) || plan.dealerNote,
    },
    added: { tasks: newTasks, notTasks: newNotes },
  }
}
