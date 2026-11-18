import { useState } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import DumpBox from './components/DumpBox.jsx'
import TaskList from './components/TaskList.jsx'
import Timeline from './components/Timeline.jsx'
import NotTasks from './components/NotTasks.jsx'
import { sortBrain } from './lib/sortBrain.js'

export default function App() {
  const [dump, setDump] = useState('')
  const [sorting, setSorting] = useState(false)
  const [plan, setPlan] = useState(null) // { tasks, notTasks, source, startedAt }

  async function handleSort() {
    setSorting(true)
    const { plan, source } = await sortBrain(dump)
    setPlan({ ...plan, source, startedAt: new Date() })
    setSorting(false)
  }

  function startOver() {
    setPlan(null)
    setDump('')
  }

  return (
    // reducedMotion="user": people who turn off animations in their OS get no dealing animation
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh px-4 py-8 sm:px-8 sm:py-12">
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
              <div key="plan" className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
                <div className="space-y-12">
                  <TaskList tasks={plan.tasks} />
                  <NotTasks notTasks={plan.notTasks} />
                </div>
                <Timeline tasks={plan.tasks} startedAt={plan.startedAt} />
                {plan.source === 'mock' && (
                  <p className="text-sm text-white/55 lg:col-span-2">
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
