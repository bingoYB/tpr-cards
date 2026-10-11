import { computed, ref } from 'vue'

const deferred = ref<BeforeInstallPromptEvent | null>(null)
const installed = ref(false)

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred.value = e as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    deferred.value = null
    installed.value = true
  })
}

export function useInstallPrompt() {
  const isStandalone = computed(
    () =>
      installed.value ||
      (typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone === true)),
  )
  const canInstall = computed(() => !!deferred.value && !isStandalone.value)
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  async function install() {
    const evt = deferred.value
    if (!evt) return
    await evt.prompt()
    const { outcome } = await evt.userChoice
    if (outcome === 'accepted') deferred.value = null
  }

  return { canInstall, isStandalone, isIOS, install }
}
