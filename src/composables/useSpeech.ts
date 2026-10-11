import { computed, ref } from 'vue'
import { useSettings } from './useSettings'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

const voices = ref<SpeechSynthesisVoice[]>([])
const speaking = ref(false)

function loadVoices() {
  if (!supported) return
  const list = speechSynthesis.getVoices()
  if (list.length) voices.value = list
}

if (supported) {
  loadVoices()
  speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

const englishVoices = computed(() =>
  voices.value
    .filter((v) => v.lang.toLowerCase().startsWith('en'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a)),
)

/** Heuristic ranking so the auto-picked voice sounds natural on most devices. */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const lang = v.lang.toLowerCase().replace('_', '-')
  const name = v.name.toLowerCase()
  let s = 0
  if (lang === 'en-us') s += 3
  else if (lang === 'en-gb') s += 2
  else if (lang.startsWith('en')) s += 1
  if (v.localService) s += 1
  if (/natural|enhanced|premium|neural/.test(name)) s += 2
  if (/samantha|google us english|microsoft (aria|jenny|guy)/.test(name)) s += 1
  return s
}

export function useSpeech() {
  const { settings } = useSettings()

  function pickVoice(): SpeechSynthesisVoice | undefined {
    const wanted = settings.value.voiceURI
    if (wanted) {
      const found = voices.value.find((v) => v.voiceURI === wanted)
      if (found) return found
    }
    return englishVoices.value[0]
  }

  function speak(text: string) {
    if (!supported || !text) return
    // Cancel anything in flight; iOS otherwise queues and sometimes stalls.
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickVoice()
    if (voice) {
      u.voice = voice
      u.lang = voice.lang
    } else {
      u.lang = 'en-US'
    }
    u.rate = settings.value.rate
    u.pitch = 1
    u.onstart = () => (speaking.value = true)
    u.onend = () => (speaking.value = false)
    u.onerror = () => (speaking.value = false)
    speechSynthesis.speak(u)
  }

  function stop() {
    if (!supported) return
    speechSynthesis.cancel()
    speaking.value = false
  }

  return { supported, voices, englishVoices, speaking, speak, stop, refreshVoices: loadVoices }
}
