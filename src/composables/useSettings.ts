import { useLocalStorage } from '@vueuse/core'

export type Theme = 'auto' | 'light' | 'dark'

export interface Settings {
  /** Preferred TTS voice URI; empty string = auto-pick an English voice */
  voiceURI: string
  /** TTS speaking rate (0.5 – 1.5) */
  rate: number
  /** Seconds between cards in auto-play mode */
  autoPlayInterval: number
  /** Show the Chinese hint by default in the player */
  showZh: boolean
  /** Speak the command automatically when a card is shown */
  autoSpeak: boolean
  /** "Simon says" game mode: randomly prefix commands */
  simonSays: boolean
  /** Probability (0 – 1) that a card gets the "Simon says" prefix */
  simonChance: number
  /** Keep the screen awake while playing (Screen Wake Lock API) */
  keepAwake: boolean
  theme: Theme
}

export const defaultSettings: Settings = {
  voiceURI: '',
  rate: 0.9,
  autoPlayInterval: 5,
  showZh: true,
  autoSpeak: true,
  simonSays: false,
  simonChance: 0.6,
  keepAwake: true,
  theme: 'auto',
}

const settings = useLocalStorage<Settings>('tpr.settings', defaultSettings, {
  mergeDefaults: true,
})

export function useSettings() {
  function reset() {
    settings.value = { ...defaultSettings }
  }
  return { settings, reset }
}
