import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Wraps the browser's native "install this app" flow. The prompt event only
 * fires once per load and only in browsers that support installable PWAs
 * (no Safari/Firefox) — on any other browser `canInstall` just stays
 * `false` forever, which is the correct "nothing to offer here" state, not
 * an error.
 */
export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt) {
      return false
    }

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice

    // The event object is single-use regardless of the outcome — spent
    // either way, so there's nothing left to offer until the next load.
    setDeferredPrompt(null)

    return choice.outcome === 'accepted'
  }

  return { canInstall: deferredPrompt !== null, promptInstall }
}
