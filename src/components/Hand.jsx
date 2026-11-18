import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import PlayingCard, { SUITS, RANKS } from './PlayingCard.jsx'
import * as sfx from '../lib/sfx.js'

function useViewportWidth() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

/**
 * Your hand, held at the bottom of the screen like in a card game.
 * Cards peek up from the edge; hover to lift one, tap to look at it,
 * drag it onto the table's play zone to play it.
 * Each card's spot is plain math: spread out, tilted a little, outer ones lower so the hand curves.
 */
export default function Hand({ tasks, selectedId, onSelect, onPlay, playZoneRef, onDragChange }) {
  const vw = useViewportWidth()
  const [dealt, setDealt] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const seen = useRef(0)

  const n = tasks.length
  const cardW = vw < 640 ? 84 : vw < 1024 ? 108 : 128
  const cardH = cardW * 1.4
  const room = Math.min(vw, 1152) - 32
  const spacing = n > 1 ? Math.min(cardW * 0.62, (room - cardW * 1.65) / (n - 1)) : 0
  const spread = Math.min(5 * (n - 1), 36) // total tilt across the hand, in degrees
  const sink = cardH * 0.4 // how far resting cards sit below the screen edge

  // Deal sound for new cards (on the first sort, and when "Add more" brings more).
  useEffect(() => {
    if (n > seen.current) sfx.deal(n - seen.current)
    seen.current = n
  }, [n])

  // After the deal, picking a card should move instantly, not wait its turn.
  useEffect(() => {
    const t = setTimeout(() => setDealt(true), n * 90 + 900)
    return () => clearTimeout(t)
  }, [n])

  // Was the card let go over the play zone?
  function droppedOnZone(point) {
    const zone = playZoneRef.current?.getBoundingClientRect()
    if (!zone) return false
    const x = point.x - window.scrollX
    const y = point.y - window.scrollY
    return x > zone.left && x < zone.right && y > zone.top && y < zone.bottom
  }

  function onKeyDown(e) {
    const i = tasks.findIndex((t) => t.id === selectedId)
    if (e.key === 'ArrowRight' && i < n - 1) onSelect(tasks[i + 1].id)
    if (e.key === 'ArrowLeft' && i > 0) onSelect(tasks[i - 1].id)
  }

  return (
    <div
      role="group"
      aria-label="Your hand. Pick a card to look at it; drag one onto the table to play it."
      onKeyDown={onKeyDown}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-felt-deep/90 via-felt-deep/40 to-transparent"
      style={{ height: cardH * 0.95 }}
    >
      {n === 0 && (
        <p className="absolute inset-x-0 bottom-6 text-center font-display text-xl italic text-white/80">
          Every card is played. Nice work.
        </p>
      )}
      <AnimatePresence>
        {tasks.map((task, i) => {
          const t = n > 1 ? i / (n - 1) - 0.5 : 0 // -0.5 (left) … 0.5 (right)
          const selected = task.id === selectedId
          const x = (i - (n - 1) / 2) * spacing
          const y = sink + t * t * cardW * 0.45 - (selected ? sink + 10 : 0)
          const suit = SUITS[task.category]
          const rank = RANKS[task.priority]

          return (
            <motion.div
              key={task.id}
              className="pointer-events-auto absolute bottom-0 left-1/2"
              style={{
                marginLeft: -cardW / 2,
                zIndex: draggingId === task.id ? 100 : i,
                transformOrigin: '50% 130%',
              }}
              initial={{ x: 0, y: -window.innerHeight * 0.5, rotate: 0, opacity: 0 }}
              animate={{ x, y, rotate: t * spread, opacity: 1 }}
              exit={{ y: -cardH, opacity: 0, transition: { duration: 0.35 } }}
              whileHover={selected || draggingId ? undefined : { y: y - sink * 0.6 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28, delay: dealt ? 0 : 0.09 * i }}
            >
              <motion.button
                type="button"
                aria-pressed={selected}
                aria-label={`${rank.name} of ${suit.name}: ${task.title}`}
                className="block cursor-grab rounded-[10px] focus-visible:outline-offset-4 active:cursor-grabbing"
                style={{ touchAction: 'none' }}
                drag
                dragSnapToOrigin
                dragElastic={0.6}
                whileDrag={{ scale: 1.08 }}
                onTap={() => onSelect(task.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(task.id)}
                onDragStart={() => {
                  setDraggingId(task.id)
                  onDragChange(true)
                  sfx.flick()
                }}
                onDragEnd={(e, info) => {
                  setDraggingId(null)
                  onDragChange(false)
                  if (droppedOnZone(info.point)) onPlay(task.id)
                }}
              >
                <PlayingCard task={task} width={cardW} flipDelay={0.09 * i + 0.35} />
              </motion.button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
