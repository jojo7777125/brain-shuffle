import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import DumpBox from './components/DumpBox.jsx'
import AddMore from './components/AddMore.jsx'
import FocusMode from './components/FocusMode.jsx'
import Hand from './components/Hand.jsx'
import Spotlight from './components/Spotlight.jsx'
import Timeline from './components/Timeline.jsx'
import NotTasks from './components/NotTasks.jsx'
import PlayZone from './components/PlayZone.jsx'
import { SUITS } from './components/PlayingCard.jsx'
import * as sfx from './lib/sfx.js'
import { sortBrain } from './lib/sortBrain.js'
import { mergePlan } from './lib/merge.js'
import { buildTimeline, roundUpTo5 } from './lib/schedule.js'
import { loadPlan, savePlan, loadDraft, saveDraft } from './lib/storage.js'

const ORDER = { now: 0, today: 1, later: 2 }
// Chips you win for playing (finishing) a card. Bigger priorities pay more.
export const CHIPS = { now: 3, today: 2, later: 1 }
const byRank = (a, b) => ORDER[a.priority] - ORDER[b.priority]
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function App() {
  // Feature 3: start from whatever was saved in this browser last time.
  const [dump, setDump] = useState(loadDraft)
  const [sorting, setSorting] = useState(false)
  const [plan, setPlan] = useState(loadPlan) // { tasks, notTasks, source, startAt, finishBy }
  const [selectedId, setSelectedId] = useState(null)
  const [addingMore, setAddingMore] = useState(false)
  const [notice, setNotice] = useState(null) // { text, action?: { label, run } } shown at the bottom
  const [focusId, setFocusId] = useState(null) // the card open in focus mode
  const [dragging, setDragging] = useState(false) // a card is being dragged (lights up the play zone)
  const [lastWin, setLastWin] = useState(null) // the "+3 chips" that floats up after playing
  const [soundOn, setSoundOn] = useState(() => !sfx.isMuted())
  const playZoneRef = useRef(null)

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
  const focusTask = tasks.find((t) => t.id === focusId)
  const chips = played.reduce((sum, t) => sum + CHIPS[t.priority], 0)
  // "Draw next card": the first unfinished task on today's plan, or else your best card.
  const nextCard = scheduled.find((t) => !t.done) ?? hand[0]

  // Feature 3: save automatically whenever the plan or the unsorted text changes.
  useEffect(() => savePlan(plan), [plan])
  useEffect(() => saveDraft(dump), [dump])

  // The note at the bottom disappears after a few seconds.
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(t)
  }, [notice])

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

  // Feature 4: sort only the new text, then shuffle it into the current plan.
  async function handleAddMore() {
    setSorting(true)
    // Tell the AI everything already in the plan (cards and notes) so it doesn't repeat any of it.
    const { plan: addition, source } = await sortBrain(dump, [
      ...tasks.map((t) => t.title),
      ...plan.notTasks.map((n) => n.text),
    ])
    const { plan: merged, added } = mergePlan(plan, addition)
    setPlan({ ...merged, source: source === 'mock' ? 'mock' : plan.source })
    if (added.tasks[0]) setSelectedId(added.tasks[0].id) // show the first new card
    setNotice({
      text:
        added.tasks.length || added.notTasks.length
          ? `Added ${[
              added.tasks.length && plural(added.tasks.length, 'card'),
              added.notTasks.length && plural(added.notTasks.length, 'note'),
            ]
              .filter(Boolean)
              .join(' and ')}.`
          : 'Nothing new: all of that is already in your hand.',
    })
    setDump('')
    setAddingMore(false)
    setSorting(false)
  }

  function startOver() {
    setPlan(null)
    setDump('')
    setAddingMore(false)
    setNotice(null)
  }

  // ---- Feature 2: change the plan ----
  const setTasks = (fn) => setPlan((p) => ({ ...p, tasks: fn(p.tasks) }))

  const updateTask = (id, patch) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  function toggleDone(id) {
    const task = tasks.find((t) => t.id === id)
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
    if (!task.done) {
      // Playing a card: it lands on the table, chips clink, "+3 chips" floats up.
      sfx.flick()
      sfx.clink()
      setLastWin({ key: `${id}-${Date.now()}`, chips: CHIPS[task.priority] })
      // Playing the card you're looking at moves you on to your next most important card.
      if (selected?.id === id) setSelectedId(null)
    }
  }

  function deleteTask(id) {
    const index = tasks.findIndex((t) => t.id === id)
    const task = tasks[index]
    setTasks((ts) => ts.filter((t) => t.id !== id))
    if (selectedId === id) setSelectedId(null)
    setNotice({
      text: `Deleted “${task.title}”.`,
      action: {
        label: 'Undo',
        run: () => {
          setTasks((ts) => [...ts.slice(0, index), task, ...ts.slice(index)])
          setSelectedId(task.id)
        },
      },
    })
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

  const link = 'text-sm text-white/75 underline decoration-white/30 underline-offset-4 hover:text-white'

  return (
    // reducedMotion="user": people who turn off animations in their OS get no dealing animation
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh overflow-x-hidden px-4 py-8 sm:px-8 sm:py-12">
        {plan && (
          <header className="mx-auto mb-10 flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <span className="font-display text-2xl font-semibold">Brain Shuffle</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <ChipCount chips={chips} />
              <button
                type="button"
                aria-pressed={soundOn}
                aria-label={soundOn ? 'Sound on. Turn sound off.' : 'Sound off. Turn sound on.'}
                onClick={() => {
                  sfx.setMuted(soundOn)
                  setSoundOn(!soundOn)
                }}
                className="grid h-9 w-9 place-items-center rounded-[6px] text-white/80 hover:bg-white/10 hover:text-white"
              >
                <SoundIcon on={soundOn} />
              </button>
              {nextCard && (
                <button
                  onClick={() => {
                    sfx.flick()
                    setFocusId(nextCard.id)
                  }}
                  className="rounded-[6px] bg-pip px-4 py-2 text-sm font-medium text-white hover:bg-[#a50d26]"
                >
                  Draw next card
                </button>
              )}
              {!addingMore && (
                <button
                  onClick={() => setAddingMore(true)}
                  className="rounded-[6px] bg-stock px-4 py-2 text-sm font-medium text-ink hover:bg-white/90"
                >
                  Add more
                </button>
              )}
              <button onClick={startOver} className={link}>
                Start a new dump
              </button>
            </div>
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
              // Bottom padding leaves room for the hand, which stays fixed at the bottom of the screen.
              <div key="plan" className="space-y-10 pb-60">
                <AnimatePresence>
                  {addingMore && (
                    <AddMore
                      value={dump}
                      onChange={setDump}
                      onSubmit={handleAddMore}
                      onCancel={() => setAddingMore(false)}
                      busy={sorting}
                    />
                  )}
                </AnimatePresence>
                {/* The dealer (the AI) gives one line on what to play first */}
                <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-white/15 pb-5">
                  {plan.dealerNote && (
                    <p className="max-w-3xl font-display text-2xl leading-snug italic sm:text-[1.7rem]">
                      <span className="mr-2 font-sans text-sm font-medium tracking-normal text-white/60 not-italic">
                        Dealer
                      </span>
                      {plan.dealerNote}
                    </p>
                  )}
                  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
                    {Object.entries(SUITS).map(([category, s]) => (
                      <div key={category} className="flex items-center gap-1.5">
                        <dt className={s.color === 'text-pip' ? 'text-[#ff9aa8]' : 'text-white'}>{s.symbol}</dt>
                        <dd>{category}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* The table: the card you're looking at, the play zone, and today's plan */}
                <div className="grid gap-12 lg:grid-cols-[17rem_minmax(0,1fr)_minmax(0,24rem)] lg:gap-10">
                  {selected ? (
                    <Spotlight
                      task={selected}
                      startsAt={startsAt}
                      onToggleDone={toggleDone}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      onFocus={setFocusId}
                    />
                  ) : (
                    <p className="font-display text-2xl italic text-white/80">
                      Your hand is empty. Add more, or start a new dump.
                    </p>
                  )}
                  <PlayZone
                    zoneRef={playZoneRef}
                    dragging={dragging}
                    played={played}
                    chips={chips}
                    lastWin={lastWin}
                    onSelect={setSelectedId}
                    onPutBack={toggleDone}
                  />
                  <div>
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
                </div>
                {tasks.length > 0 && (
                  <Hand
                    tasks={hand}
                    selectedId={selected?.id}
                    onSelect={setSelectedId}
                    onPlay={toggleDone}
                    playZoneRef={playZoneRef}
                    onDragChange={setDragging}
                  />
                )}
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
          {focusTask && (
            <FocusMode
              key={focusTask.id}
              task={focusTask}
              onClose={() => setFocusId(null)}
              onDone={() => {
                toggleDone(focusTask.id)
                setFocusId(null)
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notice && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-center justify-between gap-4 rounded-[8px] bg-stock px-4 py-3 text-ink shadow-[0_12px_32px_-8px_rgb(0_0_0/0.5)]"
            >
              <span className="truncate text-sm">{notice.text}</span>
              {notice.action && (
                <button
                  onClick={() => {
                    notice.action.run()
                    setNotice(null)
                  }}
                  className="shrink-0 text-sm font-semibold text-pip underline underline-offset-4"
                >
                  {notice.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}

// A little stack of poker chips with your total. Each played card adds to it.
function ChipCount({ chips }) {
  return (
    <span className="flex items-center gap-2" aria-label={`${chips} chips won today`}>
      <span aria-hidden className="relative h-6 w-6">
        {[2, 1, 0].map((i) => (
          <span
            key={i}
            className="absolute left-0 h-5 w-5 rounded-full border-[3px] border-dashed border-white bg-pip shadow-[0_1px_0_rgb(0_0_0/0.35)]"
            style={{ top: i * 2 }}
          />
        ))}
      </span>
      <span className="font-display text-lg font-semibold tabular-nums">{chips}</span>
      <span className="text-sm text-white/70">chips</span>
    </span>
  )
}

function SoundIcon({ on }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      {on ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      ) : (
        <path d="m16 9 5 6m0-6-5 6" />
      )}
    </svg>
  )
}
