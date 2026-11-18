// Table sounds, made in the browser with the Web Audio API (no sound files to download).
// A card "flick" is a tiny burst of filtered noise; a chip "clink" is two short high tones.
// Browsers only allow sound after you click something, which is fine: every sound follows a click.

const MUTE_KEY = 'brain-shuffle:muted'
let ctx = null
let noise = null
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
})()

export const isMuted = () => muted
export function setMuted(value) {
  muted = value
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function audio() {
  if (muted) return null
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    if (!noise) {
      // 80 ms of white noise, reused for every flick
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    return ctx
  } catch {
    return null
  }
}

// One card sliding or snapping.
export function flick(delay = 0, volume = 0.22) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + delay
  const src = a.createBufferSource()
  src.buffer = noise
  const filter = a.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1800 + Math.random() * 1400
  filter.Q.value = 0.9
  const gain = a.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
  src.connect(filter).connect(gain).connect(a.destination)
  src.start(t)
  src.stop(t + 0.08)
}

// A riffle: lots of quick flicks.
export function riffle(cards = 14) {
  for (let i = 0; i < cards; i++) flick(i * 0.035 + Math.random() * 0.01, 0.1 + Math.random() * 0.08)
}

// Cards dealt one at a time.
export function deal(count, gap = 0.09) {
  for (let i = 0; i < Math.min(count, 14); i++) flick(i * gap, 0.2)
}

// Chips landing on the table.
export function clink() {
  const a = audio()
  if (!a) return
  ;[
    [0, 2600],
    [0.06, 3300],
    [0.11, 2900],
  ].forEach(([at, freq]) => {
    const t = a.currentTime + at
    const osc = a.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const gain = a.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
    osc.connect(gain).connect(a.destination)
    osc.start(t)
    osc.stop(t + 0.16)
  })
}
