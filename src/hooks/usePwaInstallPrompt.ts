import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-level, not component state: `beforeinstallprompt` fires at most
// once per page load, and only listeners already attached at that instant
// receive it. Whichever page happens to mount first (the merchant list,
// since it's the home route) would otherwise capture it in its own local
// state, and a hook instance mounted later on a different page (e.g.
// navigating to the profile page) would never see an event that already
// fired — wrongly showing "not installable" even though it is. Captured
// once here and broadcast to every hook instance, mounted before or after
// the fact.
let capturedPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>()

function notifyListeners(prompt: BeforeInstallPromptEvent | null) {
  listeners.forEach((listener) => listener(prompt))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    capturedPrompt = event as BeforeInstallPromptEvent
    notifyListeners(capturedPrompt)
  })

  window.addEventListener('appinstalled', () => {
    capturedPrompt = null
    notifyListeners(null)
  })
}

/**
 * Wraps the browser's native "install this app" flow. The prompt event only
 * fires once per load and only in browsers that support installable PWAs
 * (no Safari/Firefox) — on any other browser `canInstall` just stays
 * `false` forever, which is the correct "nothing to offer here" state, not
 * an error.
 */
export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(capturedPrompt)

  useEffect(() => {
    listeners.add(setDeferredPrompt)

    return () => {
      listeners.delete(setDeferredPrompt)
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
    capturedPrompt = null
    notifyListeners(null)

    return choice.outcome === 'accepted'
  }

  return { canInstall: deferredPrompt !== null, promptInstall }
}
