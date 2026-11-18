import { useEffect, useRef, useState } from 'react'

// The browser's built-in speech-to-text (Chrome, Edge and Safari have it; Firefox doesn't).
const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

/**
 * Talk instead of type. While the mic is on, everything you say is added to the end of the text.
 * If the browser has no speech-to-text, the button doesn't show at all.
 */
export default function MicButton({ value, onChange, disabled }) {
  const [listening, setListening] = useState(false)
  const rec = useRef(null)
  // The latest text, so words get added to what's in the box right now (not when the mic started).
  const latest = useRef(value)
  latest.current = value

  // Turn the mic off if this button goes away (for example, after sorting).
  useEffect(() => () => rec.current?.stop(), [])

  if (!Recognition) return null

  function toggle() {
    if (listening) {
      rec.current?.stop()
      return
    }
    const r = new Recognition()
    r.continuous = true // keep listening through pauses
    r.interimResults = false // only add finished phrases
    r.lang = navigator.language || 'en-US'
    r.onresult = (e) => {
      // Each finished phrase becomes its own line, so it turns into its own card on the pile.
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue
        const said = e.results[i][0].transcript.trim()
        if (!said) continue
        const text = latest.current.trimEnd()
        onChange(text ? `${text}\n${said}` : said)
      }
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    r.start()
    setListening(true)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={listening}
      className={`flex items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
        listening ? 'bg-pip text-white' : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
      }`}
    >
      <span className="relative grid h-4 w-4 place-items-center">
        {listening && <span className="absolute inset-0 animate-ping rounded-full bg-white/60" />}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </span>
      {listening ? 'Listening… tap to stop' : 'Talk it out'}
    </button>
  )
}
