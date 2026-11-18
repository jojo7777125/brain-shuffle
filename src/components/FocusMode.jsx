import { useEffect, useRef, useState } from 'react'
import { motion, useIsPresent } from 'motion/react'
import PlayingCard, { SUITS, RANKS } from './PlayingCard.jsx'

// "24:59" from milliseconds.
const clock = (ms) => {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// A soft two-note chime, made in the browser (no sound file needed).
function chime(ctx) {
  if (!ctx) return
  try {
    ;[
      [0, 660],
      [0.2, 880],
    ].forEach(([at, freq]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + at
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.75)
    })
  } catch {
    /* no sound available: the screen still says time's up */
  }
}

/**
 * Stretch feature: one card, full screen, with a countdown timer.
 * The timer stores *when it will end* rather than counting down tick by tick,
 * so it stays accurate even if the tab is in the background.
 */
export default function FocusMode({ task, onDone, onClose }) {
  const startMs = task.minutes * 60 * 1000
  const [total, setTotal] = useState(startMs) // full length, for the progress bar
  const [remaining, setRemaining] = useState(startMs) // time left while paused
  const [endAt, setEndAt] = useState(null) // timestamp the timer hits 0:00 (null = paused)
  const [now, setNow] = useState(Date.now())
  const audio = useRef(null)
  const startButton = useRef(null)
  // False as soon as you close focus (while the screen is still fading out).
  // Everything below lets go at that moment instead of waiting for the fade.
  const isPresent = useIsPresent()

  const running = endAt !== null && isPresent
  const left = running ? Math.max(0, endAt - now) : remaining
  const timeUp = left === 0
  const suit = SUITS[task.category]
  const rank = RANKS[task.priority]

  // Tick 4 times a second while running.
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [running])

  // Hitting 0:00: stop and chime.
  useEffect(() => {
    if (running && left === 0) {
      setEndAt(null)
      setRemaining(0)
      chime(audio.current)
    }
  }, [running, left])

  // Show the countdown in the browser tab, so you can see it from other tabs.
  useEffect(() => {
    document.title = !isPresent
      ? 'Brain Shuffle'
      : timeUp
        ? `Time’s up · ${task.title}`
        : `${clock(left)} · ${task.title}`
  }, [left, timeUp, task.title, isPresent])

  // While the timer runs, ask the browser to keep the screen awake (if it supports it).
  useEffect(() => {
    if (!running || !navigator.wakeLock) return
    let lock
    navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {})
    return () => lock?.release().catch(() => {})
  }, [running])

  // Full-screen: stop the page behind from scrolling, and put keyboard focus on Start.
  useEffect(() => {
    if (!isPresent) return
    document.body.style.overflow = 'hidden'
    return () => (document.body.style.overflow = '')
  }, [isPresent])
  useEffect(() => startButton.current?.focus(), [])

  function start() {
    // Sound can only start after a click, so set it up here and reuse it at 0:00.
    try {
      audio.current ??= new (window.AudioContext || window.webkitAudioContext)()
      audio.current.resume?.()
    } catch {
      /* ignore */
    }
    const base = timeUp ? 5 * 60 * 1000 : remaining // starting from 0:00 gives you 5 more minutes
    if (timeUp) setTotal((t) => t + base)
    setNow(Date.now())
    setEndAt(Date.now() + base)
  }
  const pause = () => {
    setRemaining(Math.max(0, endAt - Date.now()))
    setEndAt(null)
  }
  const toggle = () => (running ? pause() : start())
  function addFive() {
    const five = 5 * 60 * 1000
    setTotal((t) => t + five)
    if (running) setEndAt((e) => e + five)
    else setRemaining((r) => r + five)
  }
  function reset() {
    setEndAt(null)
    setRemaining(startMs)
    setTotal(startMs)
  }

  // Keyboard: Space starts or pauses, Esc leaves.
  useEffect(() => {
    function onKey(e) {
      if (!isPresent) return
      if (e.key === 'Escape') onClose()
      if (e.code === 'Space' && e.target.tagName !== 'BUTTON') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const btn = 'rounded-[6px] px-5 py-3 font-medium transition-colors'
  const quiet = 'text-sm text-white/85 underline decoration-white/35 underline-offset-4 hover:text-white'

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Focus: ${task.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 overflow-y-auto bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,#1d7a4b_0%,var(--color-felt)_45%,var(--color-felt-deep)_100%)] px-4 py-6 sm:px-8"
    >
      <div className="mx-auto flex min-h-full max-w-xl flex-col">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-xl italic text-white/80">Focus</span>
          <button type="button" onClick={onClose} className={quiet}>
            Exit focus
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <motion.div
            initial={{ y: 30, scale: 0.85, rotate: -3 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            <PlayingCard task={task} width={180} />
          </motion.div>

          <p className="mt-8 font-display text-lg italic text-white/75">
            {rank.name} of {suit.name.toLowerCase()}
          </p>
          <h1 className="mt-1 font-display text-3xl leading-tight font-semibold sm:text-4xl">{task.title}</h1>

          <p
            aria-live="polite"
            className={`mt-6 font-display text-7xl font-semibold tabular-nums sm:text-8xl ${
              timeUp ? 'text-[#ffb3be]' : ''
            }`}
          >
            {clock(left)}
          </p>
          <div className="mt-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/20" aria-hidden>
            <div
              className="h-full bg-white transition-[width] duration-300 ease-linear"
              style={{ width: `${(1 - left / total) * 100}%` }}
            />
          </div>
          <p className="mt-3 h-5 text-sm text-white/75">
            {timeUp
              ? 'Time’s up. Wrap it up, or give yourself 5 more minutes.'
              : running
                ? 'Space to pause.'
                : 'Space to start.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              ref={startButton}
              type="button"
              onClick={toggle}
              className={`${btn} min-w-32 bg-stock text-ink hover:bg-white/90`}
            >
              {running ? 'Pause' : timeUp ? 'Start 5 more min' : left < total ? 'Resume' : 'Start'}
            </button>
            <button type="button" onClick={addFive} className={`${btn} border border-white/35 text-white hover:bg-white/10`}>
              +5 min
            </button>
            <button type="button" onClick={reset} className={quiet}>
              Reset
            </button>
          </div>

          <button
            type="button"
            onClick={onDone}
            className={`${btn} mt-10 bg-pip text-white hover:bg-[#a50d26]`}
          >
            Done: play this card
          </button>
        </div>
      </div>
    </motion.div>
  )
}
