import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { listPromotionCategories } from '../../api/categories'
import { searchMerchants } from '../../api/merchants'
import { savePushSubscription, updateNotificationPreference } from '../../api/preferences'
import type { Merchant, PromotionCategory } from '../../api/types'
import { CategoryTabs, type CategorySelection } from '../../components/CategoryTabs/CategoryTabs'
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

interface CachedListState {
  search: string
  selectedFilter: CategorySelection
  merchants: Merchant[]
  page: number
  totalPages: number
  total: number
  scrollY: number
}

// Module-level, not component state — survives MerchantsListPage unmounting
// when the visitor opens a merchant's detail (or notifications) and comes
// back, so the search, filter, however many pages were already loaded, and
// the scroll position are exactly how they left them instead of restarting
// from page 1. Resets on a full page reload, which is fine: this is about
// in-app back-navigation, not persisting across sessions.
let cachedListState: CachedListState | null = null

export function MerchantsListPage() {
  const { preference, token, refresh } = usePreference()

  const [search, setSearch] = useState(() => cachedListState?.search ?? '')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [categories, setCategories] = useState<PromotionCategory[]>([])
  // "Mis Preferencias" is selected by default and lives in the same
  // mutually-exclusive group as "Todos"/the categories — see CategoryTabs.
  // Not `cachedListState?.selectedFilter ?? 'leading'`: "Todos" is itself
  // represented as `null`, so `??` couldn't tell a cached "Todos" apart
  // from no cache at all and silently reverted it to "Mis Preferencias".
  const [selectedFilter, setSelectedFilter] = useState<CategorySelection>(() =>
    cachedListState !== null ? cachedListState.selectedFilter : 'leading',
  )
  const selectedCategoryId = typeof selectedFilter === 'number' ? selectedFilter : null
  const onlyPreferred = selectedFilter === 'leading'
  const preferredMerchantIds = preference.merchants.map((merchant) => merchant.id)

  const [merchants, setMerchants] = useState<Merchant[]>(() => cachedListState?.merchants ?? [])
  const [page, setPage] = useState(() => cachedListState?.page ?? 1)
  const [totalPages, setTotalPages] = useState(() => cachedListState?.totalPages ?? 1)
  const [total, setTotal] = useState(() => cachedListState?.total ?? 0)
  const [isLoading, setIsLoading] = useState(() => cachedListState === null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const isFetchingMoreRef = useRef(false)
  const latestScrollYRef = useRef(cachedListState?.scrollY ?? 0)
  // The filters `cachedListState` was fetched under, snapshotted once at
  // mount. The fetch effect skips while the current filters still match
  // this snapshot — restored state is already the result of that same
  // fetch, redoing it would replace page 1 with an identical page 1 and
  // throw away pages 2+ already loaded. Deliberately a value comparison,
  // not a one-shot "already skipped" flag: React's dev-mode double-invoke
  // of mount effects (setup → cleanup → setup) would consume a one-shot
  // flag on its first pass and fetch for real on its second, silently
  // collapsing the cached list back to page 1. Comparing values instead
  // makes both passes reach the same (correct) conclusion.
  const cachedFiltersRef = useRef(
    cachedListState !== null
      ? {
          search: cachedListState.search,
          selectedCategoryId:
            typeof cachedListState.selectedFilter === 'number' ? cachedListState.selectedFilter : null,
          onlyPreferred: cachedListState.selectedFilter === 'leading',
        }
      : null,
  )

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
    const cachedFilters = cachedFiltersRef.current

    if (
      cachedFilters !== null &&
      cachedFilters.search === debouncedSearch &&
      cachedFilters.selectedCategoryId === selectedCategoryId &&
      cachedFilters.onlyPreferred === onlyPreferred
    ) {
      return
    }

    // Filters diverged from the cache (or there was none) — this snapshot
    // must never match again for the rest of this mount, otherwise
    // switching back to the original filter later in the same session
    // would wrongly skip and leave stale results on screen.
    cachedFiltersRef.current = null

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
      latestScrollYRef.current = window.scrollY

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - LOAD_MORE_THRESHOLD_PX) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleWindowScroll)

    return () => window.removeEventListener('scroll', handleWindowScroll)
  }, [page, totalPages, debouncedSearch, selectedCategoryId, onlyPreferred])

  // Jumps back to where the visitor was. A long restored list (this is
  // exactly the "scrolled a lot" case) doesn't have its final height yet at
  // the moment `useLayoutEffect` itself fires — DOM mutations are in, but
  // the browser hasn't necessarily finished laying them out — so `scrollTo`
  // would get clamped to whatever shorter height existed at that instant
  // and never revisited. One `requestAnimationFrame` waits for a real
  // layout/paint pass first. Empty dependency array on purpose: this isn't
  // meant to re-run on every scroll, only once for the mount that restored
  // `cachedListState`.
  useLayoutEffect(() => {
    if (!cachedListState || cachedListState.scrollY <= 0) {
      return
    }

    const targetY = cachedListState.scrollY
    const frame = requestAnimationFrame(() => window.scrollTo(0, targetY))

    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only, see comment above.
  }, [])

  // Keeps the module-level cache current so the next unmount (navigating to
  // a merchant's detail, or away entirely) always has the latest state to
  // hand back — writing an object here doesn't itself trigger a re-render.
  useEffect(() => {
    cachedListState = {
      search,
      selectedFilter,
      merchants,
      page,
      totalPages,
      total,
      scrollY: latestScrollYRef.current,
    }
  }, [search, selectedFilter, merchants, page, totalPages, total])

  // The sync above only fires when search/filter/results change — if the
  // visitor just scrolls further and then leaves with no other state
  // change in between, that scroll wouldn't otherwise reach the cache.
  // Stamping the true final position on unmount closes that gap.
  useEffect(() => {
    return () => {
      if (cachedListState) {
        cachedListState = { ...cachedListState, scrollY: latestScrollYRef.current }
      }
    }
  }, [])

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

  function handleScrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showNotifBanner = !preference.wants_notifications && !isBannerDismissed
  const showInstallBanner = canInstall && !isInstallBannerDismissed
  // `page` only advances past 1 once infinite scroll has loaded a further
  // page — exactly "scrolled far enough that getting back to the top by
  // hand would be a chore", which is when this button should offer a
  // shortcut. Guarded by `!isLoading` too: a filter change starts a fresh
  // fetch (and shows the loading spinner) before `page` itself resets to 1,
  // so without this the button could flash during that in-between moment.
  const showScrollToTopButton = !isLoading && page > 1

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
        selectedId={selectedFilter}
        onSelect={setSelectedFilter}
        leadingChip={{ label: 'Mis Preferencias' }}
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

      {isLoading && <EmptyState message="Cargando comercios..." isLoading />}
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

      {showScrollToTopButton && (
        <button
          type="button"
          className={styles.scrollTopButton}
          onClick={handleScrollToTop}
          aria-label="Volver arriba"
        >
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
            <path d="M12 5a1 1 0 0 1 .7.29l6 6a1 1 0 0 1-1.4 1.42L13 8.41V18a1 1 0 1 1-2 0V8.41l-4.3 4.3a1 1 0 0 1-1.4-1.42l6-6A1 1 0 0 1 12 5Z" />
          </svg>
        </button>
      )}
    </main>
  )
}
