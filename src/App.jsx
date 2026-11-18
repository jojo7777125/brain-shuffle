import { useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import DumpBox from './components/DumpBox.jsx'
import Hand from './components/Hand.jsx'
import Spotlight from './components/Spotlight.jsx'
import Timeline from './components/Timeline.jsx'
import NotTasks from './components/NotTasks.jsx'
import { sortBrain } from './lib/sortBrain.js'
import { buildTimeline } from './lib/schedule.js'

const ORDER = { now: 0, today: 1, later: 2 }

export default function App() {
  const [dump, setDump] = useState('')
  const [sorting, setSorting] = useState(false)
  const [plan, setPlan] = useState(null) // { tasks, notTasks, source, startedAt }
  const [selectedId, setSelectedId] = useState(null)

  // Hold the hand in rank order: Aces, then Kings, then Queens.
  const hand = useMemo(
    () => (plan ? [...plan.tasks].sort((a, b) => ORDER[a.priority] - ORDER[b.priority]) : []),
    [plan],
  )
  const blocks = useMemo(() => (plan ? buildTimeline(hand, plan.startedAt) : []), [plan, hand])
  const selected = hand.find((t) => t.id === selectedId) ?? hand[0]
  const startsAt = blocks.find((b) => b.type === 'task' && b.task.id === selected?.id)?.start

  async function handleSort() {
    setSorting(true)
    const { plan, source } = await sortBrain(dump)
    setPlan({ ...plan, source, startedAt: new Date() })
    setSelectedId(null)
    setSorting(false)
  }

  function startOver() {
    setPlan(null)
    setDump('')
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
                  <Spotlight task={selected} startsAt={startsAt} />
                  <div className="order-3 lg:order-2">
                    <Timeline blocks={blocks} selectedId={selected?.id} onSelect={setSelectedId} />
                  </div>
                  {hand.length > 0 && (
                    <div className="order-2 lg:order-3 lg:col-span-2">
                      <Hand tasks={hand} selectedId={selected?.id} onSelect={setSelectedId} />
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
      </div>
    </MotionConfig>
  )
}
