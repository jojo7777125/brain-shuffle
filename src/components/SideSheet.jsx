import { useEffect } from 'react'
import { motion } from 'motion/react'

/**
 * A panel that slides in from the right, over the table.
 * We use it for the Today schedule, so the table itself stays simple.
 * Click the dark area, press Esc, or press Close to put it away.
 */
export default function SideSheet({ title, onClose, children }) {
  // Esc closes the sheet.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      {/* The dark see-through layer over the table */}
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      {/* The panel itself */}
      <motion.div
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col gap-8 overflow-y-auto bg-felt-deep px-5 py-6 shadow-[-20px_0_40px_-10px_rgb(0_0_0/0.5)] sm:px-7"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="self-end rounded-[6px] border border-white/40 px-3 py-1.5 text-sm text-white hover:bg-white/10"
        >
          Close
        </button>
        {children}
      </motion.div>
    </div>
  )
}
