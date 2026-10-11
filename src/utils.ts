/** Short, collision-resistant id that works without crypto.randomUUID (non-secure contexts). */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

const EMOJI_RE = /\p{Extended_Pictographic}/u

/** True when the string contains at least one pictographic (emoji) character. */
export function hasEmoji(s: string): boolean {
  return EMOJI_RE.test(s)
}

/** Trigger a browser download of a text blob. */
export function downloadText(filename: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
