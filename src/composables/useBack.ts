import { useRouter } from 'vue-router'

/**
 * Go back in history when the previous entry belongs to this app,
 * otherwise replace with a fallback route (deep links / fresh PWA launch).
 */
export function useBack() {
  const router = useRouter()
  function back(fallback = '/') {
    const state = router.options.history.state as { back?: string | null } | undefined
    if (state?.back) router.back()
    else router.replace(fallback)
  }
  return { back }
}
