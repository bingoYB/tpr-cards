import type { TprCard } from '@/types'
import { responsiveImages } from './responsiveImages'

/** Order matches the stable one-year card IDs and generated card numbers. */
export const oneYearIllustrations = [
  { name: 'clap', en: 'Clap your hands' },
  { name: 'wave', en: 'Wave hello' },
  { name: 'arms-up', en: 'Arms up' },
  { name: 'head', en: 'Touch your head' },
  { name: 'nose', en: 'Touch your nose' },
  { name: 'ear', en: 'Touch your ear' },
  { name: 'teddy', en: 'Give me the teddy' },
  { name: 'put-in', en: 'Put it in' },
  { name: 'roll', en: 'Roll the ball' },
  { name: 'peekaboo', en: 'Peekaboo' },
  { name: 'page', en: 'Turn the page' },
  { name: 'hug', en: 'Give me a hug' },
]

/** Match by exact command so edited cards never show a different caption. */
export function getCardImage(card: TprCard): string | undefined {
  return Object.hasOwn(responsiveImages, card.en) ? responsiveImages[card.en]?.[320] : undefined
}
