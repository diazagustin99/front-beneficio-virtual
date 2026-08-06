import { useEffect } from 'react'

/**
 * Locks background scroll while a modal/bottom-sheet is open. Plain
 * `overflow: hidden` on `<body>` isn't enough on iOS Safari — touch-scroll
 * can still rubber-band the page underneath a `position: fixed` overlay,
 * which let other fixed/sticky elements (e.g. the bottom nav) render
 * through a sheet while scrolling long content inside it (confirmed with a
 * promotion's own long "Términos y condiciones" text). Pinning the body in
 * place with `position: fixed` — not just hiding its overflow — is the
 * standard fix; the exact scroll offset is restored on close so the page
 * doesn't jump.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return
    }

    const scrollY = window.scrollY
    const { position, top, left, right, overflow } = document.body.style

    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = position
      document.body.style.top = top
      document.body.style.left = left
      document.body.style.right = right
      document.body.style.overflow = overflow
      window.scrollTo(0, scrollY)
    }
  }, [active])
}
