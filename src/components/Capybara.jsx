import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import * as sfx from '../lib/sfx.js'

// Things the capybara says when you find it. Capybaras are famously calm.
const LINES = [
  'You found me. Stay calm and play your hand.',
  'One card at a time. That’s the capybara way.',
  'I’m not worried about anything. You shouldn’t be either.',
  'Nice chips. Want to share?',
]

/**
 * The hidden capybara (the hackathon's "secret criteria").
 * It peeks over the edge of the betting circle. Click it and it says something calm.
 * Drawn with plain SVG shapes, so there's no image file.
 */
export default function Capybara() {
  const [line, setLine] = useState(null)

  function sayHi() {
    sfx.flick()
    setLine(LINES[Math.floor(Math.random() * LINES.length)])
    setTimeout(() => setLine(null), 3000)
  }

  return (
    <div className="absolute -bottom-3 right-8">
      <AnimatePresence>
        {line && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 bottom-full mb-2 w-48 rounded-[8px] bg-stock px-3 py-2 text-sm leading-snug text-ink shadow-[0_8px_20px_-6px_rgb(0_0_0/0.5)]"
          >
            {line}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={sayHi}
        aria-label="A capybara is watching the table. Say hi."
        title="A capybara?"
        whileHover={{ y: -4 }}
        className="block opacity-80 hover:opacity-100"
      >
        <svg width="56" height="40" viewBox="0 0 56 40" aria-hidden>
          {/* body */}
          <ellipse cx="22" cy="30" rx="20" ry="11" fill="#8a5a36" />
          {/* head: capybaras have a big, square snout */}
          <rect x="30" y="10" width="22" height="18" rx="8" fill="#9b6840" />
          {/* ear */}
          <ellipse cx="34" cy="10" rx="3" ry="2.5" fill="#6e4528" />
          {/* eye, closed and relaxed */}
          <path d="M39 16.5 q2 1.6 4 0" stroke="#231f20" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          {/* nose */}
          <ellipse cx="49.5" cy="19" rx="1.4" ry="1" fill="#231f20" />
          {/* a tiny poker chip on its head, because it's at a card table */}
          <ellipse cx="41" cy="9" rx="5" ry="2" fill="#c8102e" stroke="#fff" strokeWidth="1" strokeDasharray="2 1.5" />
        </svg>
      </motion.button>
    </div>
  )
}
