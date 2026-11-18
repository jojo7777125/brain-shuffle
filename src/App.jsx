import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import DumpBox from './components/DumpBox.jsx'
import Hand from './components/Hand.jsx'
import Spotlight from './components/Spotlight.jsx'
import Timeline from './components/Timeline.jsx'
import NotTasks from './components/NotTasks.jsx'
import { sortBrain } from './lib/sortBrain.js'
import { buildTimeline, roundUpTo5 } from './lib/schedule.js'
import { loadPlan, savePlan, loadDraft, saveDraft } from './lib/storage.js'

const ORDER = { now: 0, today: 1, later: 2 }
const byRank = (a, b) => ORDER[a.priority] - ORDER[b.priority]

export default function App() {
  // Feature 3: start from whatever was saved in this browser last time.
  const [dump, setDump] = useState(loadDraft)
  const [sorting, setSorting] = useState(false)
  const [plan, setPlan] = useState(loadPlan) // { tasks, notTasks, source, startAt, finishBy }
  const [selectedId, setSelectedId] = useState(null)
  const [deleted, setDeleted] = useState(null) // { task, index } for "Undo"

  // Everything below is derived from the plan: plan.tasks is the single list we change.
  const tasks = useMemo(() => plan?.tasks ?? [], [plan])
  const hand = useMemo(() => tasks.filter((t) => !t.done).sort(byRank), [tasks]) // Aces, Kings, Queens
  const played = tasks.filter((t) => t.done)
  const scheduled = useMemo(() => tasks.filter((t) => t.priority !== 'later'), [tasks])
  const blocks = useMemo(
    () => (plan ? buildTimeline(scheduled, plan.startAt, plan.finishBy) : []),
    [plan, scheduled],
  )
  const selected = tasks.find((t) => t.id === selectedId) ?? hand[0] ?? tasks[0]
  const startsAt = blocks.find((b) => b.type === 'task' && b.task.id === selected?.id)?.start

  // Feature 3: save automatically whenever the plan or the unsorted text changes.
  useEffect(() => savePlan(plan), [plan])
  useEffect(() => saveDraft(dump), [dump])

  // The "Deleted … Undo" note disappears after a few seconds.
  useEffect(() => {
    if (!deleted) return
    const t = setTimeout(() => setDeleted(null), 6000)
    return () => clearTimeout(t)
  }, [deleted])

  async function handleSort() {
    setSorting(true)
    const { plan, source } = await sortBrain(dump)
    setPlan({
      ...plan,
      tasks: [...plan.tasks].sort(byRank),
      source,
      startAt: roundUpTo5(new Date()), // you can change this on the Today sheet
      finishBy: null, // optional "I need to be done by" time
    })
    setSelectedId(null)
    setDump('') // it's sorted now, so the draft isn't needed
    setSorting(false)
  }

  function startOver() {
    setPlan(null)
    setDump('')
    setDeleted(null)
  }

  // ---- Feature 2: change the plan ----
  const setTasks = (fn) => setPlan((p) => ({ ...p, tasks: fn(p.tasks) }))

  const updateTask = (id, patch) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  function toggleDone(id) {
    const task = tasks.find((t) => t.id === id)
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
    // Playing the card you're looking at moves you on to your next most important card.
    if (!task.done && selected?.id === id) setSelectedId(null)
  }

  function deleteTask(id) {
    const index = tasks.findIndex((t) => t.id === id)
    setDeleted({ task: tasks[index], index })
    setTasks((ts) => ts.filter((t) => t.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function undoDelete() {
    const { task, index } = deleted
    setTasks((ts) => [...ts.slice(0, index), task, ...ts.slice(index)])
    setSelectedId(task.id)
    setDeleted(null)
  }

  // Dragging on the Today sheet hands us the new order of the scheduled tasks.
  const reorderToday = (newOrder) =>
    setTasks((ts) => [...newOrder, ...ts.filter((t) => t.priority === 'later')])

  // Same thing from the keyboard: move one row up (-1) or down (+1).
  function moveToday(id, dir) {
    const list = [...scheduled]
    const i = list.findIndex((t) => t.id === id)
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    reorderToday(list)
  }

  return (
    // reducedMotion="user": people who turn off animations in their OS get no dealing animation
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh overflow-x-hidden px-4 py-8 sm:px-8 sm:py-12">
        {plan && (
          <header className="mx-auto mb-10 flex max-w-6xl items-baseline justify-between">
            <span className="font-display text-2xl font-semibold">Brain Shuffle</span>
            <button
              onClick={startOver}
              className="text-sm text-white/75 underline decoration-white/30 underline-offset-4 hover:text-white"
            >
              Start a new dump
            </button>
          </header>
        )}

        <main className={`mx-auto max-w-6xl ${plan ? '' : 'pt-[8vh]'}`}>
          <AnimatePresence mode="wait">
            {!plan ? (
              <DumpBox
                key="dump"
                value={dump}
                onChange={setDump}
                onSort={handleSort}
                sorting={sorting}
              />
            ) : (
              // Phones: card, hand, then the day. Wide screens: card beside the day, hand underneath.
              <div key="plan" className="space-y-14">
                <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-x-14 lg:gap-y-16">
                  {selected ? (
                    <Spotlight
                      task={selected}
                      startsAt={startsAt}
                      onToggleDone={toggleDone}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                    />
                  ) : (
                    <p className="font-display text-2xl italic text-white/80">
                      Your hand is empty. Start a new dump when you’re ready.
                    </p>
                  )}
                  <div className="order-3 lg:order-2">
                    <Timeline
                      blocks={blocks}
                      tasks={scheduled}
                      startAt={plan.startAt}
                      finishBy={plan.finishBy}
                      onStartChange={(startAt) => setPlan((p) => ({ ...p, startAt }))}
                      onFinishChange={(finishBy) => setPlan((p) => ({ ...p, finishBy }))}
                      selectedId={selected?.id}
                      onSelect={setSelectedId}
                      onToggleDone={toggleDone}
                      onReorder={reorderToday}
                      onMove={moveToday}
                    />
                  </div>
                  {tasks.length > 0 && (
                    <div className="order-2 lg:order-3 lg:col-span-2">
                      <Hand
                        tasks={hand}
                        played={played}
                        selectedId={selected?.id}
                        onSelect={setSelectedId}
                        onToggleDone={toggleDone}
                      />
                    </div>
                  )}
                </div>
                <NotTasks notTasks={plan.notTasks} />
                {plan.source === 'mock' && (
                  <p className="text-sm text-white/55">
                    Sorted offline, without AI. Add an Anthropic API key to use Claude.
                  </p>
                )}
              </div>
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {deleted && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-4 rounded-[8px] bg-stock px-4 py-3 text-ink shadow-[0_12px_32px_-8px_rgb(0_0_0/0.5)]"
            >
              <span className="truncate text-sm">Deleted “{deleted.task.title}”.</span>
              <button onClick={undoDelete} className="shrink-0 text-sm font-semibold text-pip underline underline-offset-4">
                Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
