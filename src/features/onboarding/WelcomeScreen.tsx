import { useEffect, useRef, useState, type UIEvent } from 'react'
import { PromotionCard } from '../../components/PromotionCard/PromotionCard'
import { listWelcomeCarousel } from '../../api/promotions'
import type { PromotionListItem, Wallet } from '../../api/types'
import styles from './WelcomeScreen.module.css'

interface WelcomeSlide {
  wallet: Wallet
  promotion: PromotionListItem
}

interface WelcomeScreenProps {
  onSeeOffers: () => void
}

const AUTOPLAY_INTERVAL_MS = 4000

export function WelcomeScreen({ onSeeOffers }: WelcomeScreenProps) {
  const [slides, setSlides] = useState<WelcomeSlide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  const slideRefs = useRef<Array<HTMLDivElement | null>>([])
  const hasUserInteractedRef = useRef(false)

  // A single backend call already returns the best deal per wallet — no
  // more fetching every wallet's promotions separately and ranking them
  // here, which used to make this screen slow to load.
  useEffect(() => {
    let cancelled = false

    listWelcomeCarousel()
      .then((promotions) => {
        if (!cancelled) {
          setSlides(
            promotions
              .filter((promotion): promotion is PromotionListItem & { wallet: Wallet } => promotion.wallet !== null)
              .map((promotion) => ({ wallet: promotion.wallet, promotion })),
          )
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlides([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Auto-advance the carousel; stops for good the moment the visitor swipes
  // or drags it themselves, instead of fighting their scroll position.
  useEffect(() => {
    if (slides.length < 2) {
      return
    }

    const interval = setInterval(() => {
      if (hasUserInteractedRef.current) {
        return
      }

      setCurrentIndex((current) => {
        const nextIndex = (current + 1) % slides.length
        slideRefs.current[nextIndex]?.scrollIntoView({ inline: 'start', block: 'nearest' })

        return nextIndex
      })
    }, AUTOPLAY_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [slides.length])

  function handleUserInteraction() {
    hasUserInteractedRef.current = true
  }

  // Keeps the dot indicator honest when the visitor swipes/drags manually
  // instead of only reacting to the autoplay timer.
  function handleCarouselScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget
    let closestIndex = 0
    let closestDistance = Infinity

    slideRefs.current.forEach((slide, index) => {
      if (!slide) {
        return
      }

      const distance = Math.abs(slide.offsetLeft - container.scrollLeft)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    setCurrentIndex(closestIndex)
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <img src="/pwa-192x192.png" alt="" width={80} height={80} className={styles.logo} />
        <h1 className={styles.title}>Beneficio Virtual</h1>
        <p className={styles.subtitle}>Los mejores descuentos de tus billeteras favoritas, todos en un solo lugar.</p>

        {!isLoading && slides.length > 0 && (
          <>
            <div
              className={styles.carousel}
              onPointerDown={handleUserInteraction}
              onScroll={handleCarouselScroll}
            >
              {slides.map(({ wallet, promotion }, index) => (
                <div
                  key={wallet.id}
                  className={styles.slide}
                  ref={(el) => {
                    slideRefs.current[index] = el
                  }}
                >
                  <PromotionCard promotion={promotion} onSelect={() => {}} />
                </div>
              ))}
            </div>

            {slides.length > 1 && (
              <div className={styles.dots}>
                {slides.map((slide, index) => (
                  <span
                    key={slide.wallet.id}
                    className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <button type="button" className={styles.ctaButton} onClick={onSeeOffers}>
          Ver ofertas
        </button>
        <p className={styles.disclaimer}>Gratis, sin publicidad y sin registro obligatorio.</p>
      </div>
    </div>
  )
}
