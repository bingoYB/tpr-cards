export type AgeGroup = '1' | '2' | '3' | '4-6'

export interface TprCard {
  id: string
  /** Emoji (or short visual hint) displayed on the card */
  emoji: string
  /** The English command, e.g. "Stand up" */
  en: string
  /** Chinese translation / teacher hint */
  zh: string
  /** Parent demonstration hint; not spoken aloud */
  tip?: string
  /** Image index in the one-year standalone illustrations (0–11) */
  illustration?: number
  /** Blob key in the local IndexedDB image store */
  imageId?: string
}

export interface TprDeck {
  id: string
  name: string
  emoji: string
  /** Accent color (any CSS color) */
  color: string
  description?: string
  ageGroup?: AgeGroup
  cards: TprCard[]
  /** Built-in decks are read-only; custom decks live in localStorage */
  builtIn?: boolean
}

/** Shape of the JSON produced by "export my decks" */
export interface DeckExport {
  version: 1
  exportedAt: string
  decks: TprDeck[]
  /** Uploaded image data included only in portable backups, never in localStorage. */
  images?: Record<string, string>
}
