import { useEffect, useRef, useState } from 'react'
import { listPromotionCategories } from '../../api/categories'
import { searchMerchants } from '../../api/merchants'
import { savePushSubscription, updateNotificationPreference } from '../../api/preferences'
import type { Merchant, PromotionCategory } from '../../api/types'
import { CategoryTabs } from '../../components/CategoryTabs/CategoryTabs'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { usePreference } from '../../context/PreferenceContext'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt'
import { pushErrorMessage, subscribeToPush } from '../../utils/pushSubscription'
import { MerchantListItem } from './MerchantListItem'
import styles from './MerchantsListPage.module.css'

const NOTIF_BANNER_DISMISSED_KEY = 'bv_notif_banner_dismissed'
const INSTALL_BANNER_DISMISSED_KEY = 'bv_install_banner_dismissed'
const PAGE_SIZE = 20
const LOAD_MORE_THRESHOLD_PX = 300

export function MerchantsListPage() {
  const { preference, token, refresh } = usePreference()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [categories, setCategories] = useState<PromotionCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [onlyPreferred, setOnlyPreferred] = useState(false)
  const preferredMerchantIds = preference.merchants.map((merchant) => merchant.id)

  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const isFetchingMoreRef = useRef(false)

  const [isBannerDismissed, setIsBannerDismissed] = useState(
    () => localStorage.getItem(NOTIF_BANNER_DISMISSED_KEY) === '1',
  )
  const [isActivatingPush, setIsActivatingPush] = useState(false)
  const [notifError, setNotifError] = useState<string | null>(null)

  const { canInstall, promptInstall } = usePwaInstallPrompt()
  const [isInstallBannerDismissed, setIsInstallBannerDismissed] = useState(
    () => localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === '1',
  )
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    listPromotionCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let cancelled = false

    // "Mis Preferencias" with nothing saved yet is a real empty state, not a
    // search against the API — there's no id to filter by, and omitting the
    // filter entirely would wrongly fall back to showing every merchant.
    if (onlyPreferred && preferredMerchantIds.length === 0) {
      setMerchants([])
      setPage(1)
      setTotalPages(1)
      setTotal(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    searchMerchants({
      search: debouncedSearch,
      withDiscounts: true,
      withLogoFirst: true,
      categoryId: selectedCategoryId,
      merchantIds: onlyPreferred ? preferredMerchantIds : undefined,
      page: 1,
      perPage: PAGE_SIZE,
    })
      .then((result) => {
        if (!cancelled) {
          setMerchants(result.items)
          setPage(result.currentPage)
          setTotalPages(result.totalPages)
          setTotal(result.total)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMerchants([])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preferredMerchantIds is derived fresh every render; only its membership (driven by onlyPreferred) should retrigger the fetch.
  }, [debouncedSearch, selectedCategoryId, onlyPreferred])

  function loadMore() {
    if (isFetchingMoreRef.current || page >= totalPages) {
      return
    }

    isFetchingMoreRef.current = true
    setIsLoadingMore(true)

    searchMerchants({
      search: debouncedSearch,
      withDiscounts: true,
      withLogoFirst: true,
      categoryId: selectedCategoryId,
      merchantIds: onlyPreferred ? preferredMerchantIds : undefined,
      page: page + 1,
      perPage: PAGE_SIZE,
    })
      .then((result) => {
        setMerchants((current) => [...current, ...result.items])
        setPage(result.currentPage)
        setTotalPages(result.totalPages)
        setTotal(result.total)
      })
      .catch(() => {})
      .finally(() => {
        isFetchingMoreRef.current = false
        setIsLoadingMore(false)
      })
  }

  // The whole page scrolls (this is the home screen, not a boxed picker),
  // so lazy-loading listens on the window instead of an inner container.
  useEffect(() => {
    function handleWindowScroll() {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - LOAD_MORE_THRESHOLD_PX) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleWindowScroll)

    return () => window.removeEventListener('scroll', handleWindowScroll)
  }, [page, totalPages, debouncedSearch, selectedCategoryId, onlyPreferred])

  async function handleActivateNotifications() {
    setIsActivatingPush(true)
    setNotifError(null)

    try {
      const result = await subscribeToPush()

      if (result.status !== 'subscribed') {
        setNotifError(pushErrorMessage(result.status))
        return
      }

      await savePushSubscription(token, result.subscription)
      await updateNotificationPreference(token, true)
      await refresh()
    } catch {
      setNotifError('No pudimos activar las notificaciones. Probá de nuevo.')
    } finally {
      setIsActivatingPush(false)
    }
  }

  function handleDismissBanner() {
    localStorage.setItem(NOTIF_BANNER_DISMISSED_KEY, '1')
    setIsBannerDismissed(true)
  }

  async function handleInstall() {
    setIsInstalling(true)

    try {
      await promptInstall()
    } finally {
      setIsInstalling(false)
    }
  }

  function handleDismissInstallBanner() {
    localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, '1')
    setIsInstallBannerDismissed(true)
  }

  const showNotifBanner = !preference.wants_notifications && !isBannerDismissed
  const showInstallBanner = canInstall && !isInstallBannerDismissed

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Comercios</h1>

      <input
        type="text"
        className={styles.searchInput}
        placeholder="Buscar comercio..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <CategoryTabs
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        leadingChip={{
          label: 'Mis Preferencias',
          active: onlyPreferred,
          onClick: () => setOnlyPreferred((current) => !current),
        }}
        maxVisible={5}
      />

      {showInstallBanner && (
        <div className={styles.banner}>
          <span className={styles.bannerIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
              <path d="M12 3a1 1 0 0 1 1 1v9.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1ZM5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z" />
            </svg>
          </span>
          <div className={styles.bannerText}>
            <p className={styles.bannerTitle}>Instalá la app</p>
            <p className={styles.bannerSubtitle}>Accedé más rápido desde tu pantalla de inicio, sin el navegador.</p>
            <button type="button" className={styles.bannerAction} onClick={handleInstall} disabled={isInstalling}>
              {isInstalling ? 'Instalando...' : 'Instalar'}
            </button>
          </div>
          <button
            type="button"
            className={styles.bannerClose}
            onClick={handleDismissInstallBanner}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}

      {showNotifBanner && (
        <div className={styles.banner}>
          <span className={styles.bannerIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
              <path d="M12 2a6 6 0 0 0-6 6v3.09c0 .55-.16 1.09-.46 1.55L4.2 15.1a1 1 0 0 0 .84 1.55h13.92a1 1 0 0 0 .84-1.55l-1.34-2.46a3 3 0 0 1-.46-1.55V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.83-2H9.17A3 3 0 0 0 12 22Z" />
            </svg>
          </span>
          <div className={styles.bannerText}>
            <p className={styles.bannerTitle}>Activá las notificaciones</p>
            <p className={styles.bannerSubtitle}>
              Te avisamos cuando hay nuevos descuentos en tus comercios favoritos.
            </p>
            <button
              type="button"
              className={styles.bannerAction}
              onClick={handleActivateNotifications}
              disabled={isActivatingPush}
            >
              {isActivatingPush ? 'Activando...' : 'Activar ahora'}
            </button>
            {notifError && <p className={styles.bannerError}>{notifError}</p>}
          </div>
          <button
            type="button"
            className={styles.bannerClose}
            onClick={handleDismissBanner}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}

      {isLoading && <EmptyState message="Cargando comercios..." />}
      {!isLoading && merchants.length === 0 && onlyPreferred && preferredMerchantIds.length === 0 && (
        <EmptyState message="Todavía no guardaste comercios. Abrí uno y tocá 'Guardar' para verlo acá." />
      )}
      {!isLoading && merchants.length === 0 && !(onlyPreferred && preferredMerchantIds.length === 0) && (
        <EmptyState message="No encontramos comercios con descuentos activos para esta búsqueda." />
      )}

      {!isLoading && merchants.length > 0 && (
        <>
          <p className={styles.count}>{total} comercios</p>
          <div className={styles.list}>
            {merchants.map((merchant) => (
              <MerchantListItem key={merchant.id} merchant={merchant} />
            ))}
          </div>
          {isLoadingMore && <p className={styles.status}>Cargando más...</p>}
        </>
      )}
    </main>
  )
}
