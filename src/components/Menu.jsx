import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

/**
 * The "Menu" button in the corner. It holds the things you don't need every second
 * (Add more, Cash out, sound, start over), so the table only shows the game.
 * items: [{ label, onClick }]. Clicking an item runs it and closes the menu.
 */
export default function Menu({ items }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  // Close when you click anywhere outside the menu, or press Esc.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => !box.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-[6px] border border-white/40 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
      >
        {/* Three lines: the usual "menu" icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Menu
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-[8px] bg-stock py-1 text-ink shadow-[0_16px_36px_-8px_rgb(0_0_0/0.55)]"
          >
            {items.map((item) => (
              <li key={item.label} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    item.onClick()
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm hover:bg-ink/5 focus:bg-ink/5 focus:outline-none"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
