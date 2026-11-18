import { motion } from 'motion/react'
import { SAMPLE_DUMP } from '../lib/mockSort.js'

export default function DumpBox({ value, onChange, onSort, sorting }) {
  const canSort = value.trim().length > 0 && !sorting

  return (
    <motion.section exit={{ opacity: 0 }} className="mx-auto w-full max-w-2xl">
      <h1 className="font-display text-5xl leading-[1.05] font-semibold sm:text-6xl">Brain Shuffle</h1>
      <p className="mt-3 max-w-md text-lg text-white/80">
        Write down everything you&rsquo;re carrying. It gets dealt back as a plan for today.
      </p>

      <div className="mt-8 rounded-[10px] bg-stock text-ink shadow-[0_1px_0_rgb(0_0_0/0.3),0_18px_40px_-12px_rgb(0_0_0/0.45)]">
        <label htmlFor="dump" className="sr-only">
          Everything on your mind
        </label>
        <textarea
          id="dump"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSort) onSort()
          }}
          disabled={sorting}
          placeholder="What's on your mind? Dump it all here."
          className="block h-64 w-full resize-none rounded-t-[10px] bg-transparent px-6 pt-6 pb-4 text-lg leading-relaxed outline-none sm:h-80"
        />
        <div className="flex items-center justify-between gap-4 border-t border-rule px-6 py-4">
          <button
            type="button"
            onClick={() => onChange(SAMPLE_DUMP)}
            disabled={sorting}
            className="text-sm text-ink/60 underline decoration-ink/25 underline-offset-4 hover:text-ink"
          >
            Fill in an example
          </button>
          <button
            type="button"
            onClick={onSort}
            disabled={!canSort}
            className="rounded-[6px] bg-pip px-6 py-3 font-medium text-white transition-colors hover:bg-[#a50d26] focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-ink/20"
          >
            {sorting ? 'Shuffling…' : 'Sort my brain'}
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm text-white/55">Tip: Ctrl + Enter sorts from the text box.</p>
    </motion.section>
  )
}
