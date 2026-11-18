import { motion } from 'motion/react'
import MicButton from './MicButton.jsx'

// Feature 4: a small writing slip for new thoughts, shuffled into your current hand.
export default function AddMore({ value, onChange, onSubmit, onCancel, busy }) {
  const canAdd = value.trim().length > 0 && !busy

  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-[10px] bg-stock text-ink shadow-[0_1px_0_rgb(0_0_0/0.3),0_18px_40px_-12px_rgb(0_0_0/0.45)]"
      onKeyDown={(e) => e.key === 'Escape' && !busy && onCancel()}
    >
      <div className="px-6 pt-5">
        <label htmlFor="more" className="font-display text-2xl font-semibold">
          Add more
        </label>
        <p className="mt-1 text-sm text-ink/65">
          Anything new on your mind. It gets shuffled into your hand, and nothing you already have is repeated.
        </p>
      </div>
      <textarea
        id="more"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canAdd) onSubmit()
        }}
        disabled={busy}
        placeholder="Oh, and I also need to…"
        className="mt-2 block h-32 w-full resize-none bg-transparent px-6 py-2 text-lg leading-relaxed outline-none"
      />
      <div className="flex flex-wrap items-center justify-end gap-5 border-t border-rule px-6 py-4">
        <span className="mr-auto">
          <MicButton value={value} onChange={onChange} disabled={busy} />
        </span>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-sm text-ink/60 underline decoration-ink/25 underline-offset-4 hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canAdd}
          className="rounded-[6px] bg-pip px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#a50d26] disabled:cursor-not-allowed disabled:bg-ink/20"
        >
          {busy ? 'Shuffling in…' : 'Add to my hand'}
        </button>
      </div>
    </motion.section>
  )
}
