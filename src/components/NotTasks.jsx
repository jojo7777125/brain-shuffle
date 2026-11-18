const KIND = { worry: 'Worry', idea: 'Idea', note: 'Note' }

// Worries and ideas: written down so they're out of your head, but kept off the to-do list.
export default function NotTasks({ notTasks }) {
  if (!notTasks.length) return null
  return (
    <section aria-labelledby="aside">
      <h2 id="aside" className="font-display text-3xl font-semibold">
        Set aside
      </h2>
      <p className="mt-1 text-sm text-white/70">Out of your head, and off your list.</p>
      <ul className="mt-4 divide-y divide-white/15 border-y border-white/15">
        {notTasks.map((n) => (
          <li key={n.id} className="flex items-baseline gap-4 py-3">
            <span className="w-12 shrink-0 font-display text-sm text-white/60 italic">
              {KIND[n.kind]}
            </span>
            <span className="leading-snug">{n.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
