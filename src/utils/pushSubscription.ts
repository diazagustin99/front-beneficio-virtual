import type { PushSubscriptionPayload } from '../api/preferences'

const SERVICE_WORKER_READY_TIMEOUT_MS = 8000

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export type PushSubscribeResult =
  | { status: 'subscribed'; subscription: PushSubscriptionPayload }
  | { status: 'unsupported' }
  | { status: 'permission-denied' }
  | { status: 'error' }

/**
 * Requests browser permission and subscribes to push. Distinguishes *why*
 * it didn't work — permission actively blocked (only fixable from the
 * browser's own site settings, re-asking never helps) reads very
 * differently to the visitor than "this browser can't do push at all" or a
 * one-off technical failure, so callers can show a message that actually
 * explains what to do next instead of a generic "something went wrong".
 */
export async function subscribeToPush(): Promise<PushSubscribeResult> {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

  if (!vapidPublicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { status: 'unsupported' }
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    return { status: 'permission-denied' }
  }

  try {
    // `serviceWorker.ready` only resolves once a worker activates — with no
    // timeout, a registration that silently fails to activate (a stale
    // build, a network hiccup) would leave the caller waiting forever
    // instead of surfacing a failure.
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('service worker not ready')), SERVICE_WORKER_READY_TIMEOUT_MS),
      ),
    ])

    // A subscription tied to a *different* applicationServerKey than the
    // current one (e.g. left over from an earlier deploy that used a
    // different VAPID key) blocks `subscribe()` outright — the Push API
    // throws `InvalidStateError` instead of just replacing it. Clearing
    // whatever's there first makes this idempotent no matter what key an
    // earlier session subscribed with.
    const existingSubscription = await registration.pushManager.getSubscription()
    await existingSubscription?.unsubscribe()

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    const json = subscription.toJSON()

    if (!json.keys?.p256dh || !json.keys?.auth) {
      return { status: 'error' }
    }

    return {
      status: 'subscribed',
      subscription: { endpoint: subscription.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
    }
  } catch (error) {
    // Surfaced only to the console — the UI just shows the generic
    // `pushErrorMessage('error')` copy, but the actual DOMException name
    // (AbortError, NotSupportedError, etc.) is what actually explains *why*
    // to whoever's debugging this from the browser console.
    console.error('subscribeToPush failed', error)

    return { status: 'error' }
  }
}

/**
 * A human-readable explanation for each non-"subscribed" outcome above —
 * kept alongside `subscribeToPush` so every call site shows the same
 * message for the same cause instead of drifting apart over time.
 */
export function pushErrorMessage(status: Exclude<PushSubscribeResult['status'], 'subscribed'>): string {
  switch (status) {
    case 'permission-denied':
      return 'Bloqueaste las notificaciones para este sitio. Para activarlas, abrí la configuración del sitio en tu navegador (el ícono junto a la URL) y permitilas ahí.'
    case 'unsupported':
      return 'Tu navegador no admite notificaciones push.'
    case 'error':
      return 'No pudimos activar las notificaciones. Probá de nuevo en unos segundos.'
  }
}

/**
 * Best-effort: unsubscribes this browser from push. Safe to call even if
 * there's no active subscription or push isn't supported — the backend flag
 * is the source of truth for whether notifications are "on", this just
 * stops the browser from holding a subscription it shouldn't use anymore.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  await subscription?.unsubscribe()
}
