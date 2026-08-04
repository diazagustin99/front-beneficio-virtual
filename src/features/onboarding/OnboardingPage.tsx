import { useEffect, useRef, useState, type UIEvent } from 'react'
import { searchMerchants } from '../../api/merchants'
import { listPromotionCategories } from '../../api/categories'
import type { AppPreference, Merchant, PromotionCategory, Wallet } from '../../api/types'
import { completeOnboarding, savePushSubscription } from '../../api/preferences'
import { listWallets } from '../../api/wallets'
import { CategoryTabs, type CategorySelection } from '../../components/CategoryTabs/CategoryTabs'
import { MerchantAvatar } from '../../components/MerchantAvatar/MerchantAvatar'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { subscribeToPush } from '../../utils/pushSubscription'
import { storeUserIdentity, type UserIdentity } from '../../utils/userIdentity'
import { getWalletBranding } from '../../utils/walletBranding'
import styles from './OnboardingPage.module.css'

type Step = 'merchants' | 'wallets' | 'email'

const STEPS: Step[] = ['merchants', 'wallets', 'email']

const STEP_TITLES: Record<Step, string> = {
  merchants: '¿Qué comercios te interesan?',
  wallets: '¿Qué billeteras usás normalmente?',
  email: '¿Cuál es tu email?',
}

const STEP_SUBTITLES: Record<Step, string> = {
  merchants: 'Seleccioná los que uses más seguido para ver sus mejores descuentos.',
  wallets: 'Resaltaremos los descuentos de tus billeteras en cada comercio.',
  email: '',
}

interface OnboardingPageProps {
  onComplete: (identity: UserIdentity, preference: AppPreference) => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState<Step>('merchants')
  const stepIndex = STEPS.indexOf(step)

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const [categories, setCategories] = useState<PromotionCategory[]>([])
  // Same mutually-exclusive group as the home screen's CategoryTabs — here
  // "Mis Preferencias" filters down to the merchants already checked in
  // this session (there's no saved preference yet during onboarding), so
  // it starts unselected instead of defaulting on.
  const [selectedFilter, setSelectedFilter] = useState<CategorySelection>(null)
  const selectedCategoryId = typeof selectedFilter === 'number' ? selectedFilter : null
  const onlyPreferred = selectedFilter === 'leading'

  const [selectedMerchants, setSelectedMerchants] = useState<Merchant[]>([])
  const [merchantSearch, setMerchantSearch] = useState('')
  const [merchantOptions, setMerchantOptions] = useState<Merchant[]>([])
  const [merchantPage, setMerchantPage] = useState(1)
  const [merchantTotalPages, setMerchantTotalPages] = useState(1)
  const [isLoadingMerchants, setIsLoadingMerchants] = useState(true)
  const [isLoadingMoreMerchants, setIsLoadingMoreMerchants] = useState(false)
  const debouncedMerchantSearch = useDebouncedValue(merchantSearch, 300)
  const isFetchingMoreMerchantsRef = useRef(false)

  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletSearch, setWalletSearch] = useState('')
  const [selectedWalletIds, setSelectedWalletIds] = useState<number[]>([])

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    listWallets()
      .then(setWallets)
      .catch(() => setWallets([]))

    listPromotionCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  // Only merchants with an active discount show up here — following one
  // with nothing to offer right now wouldn't do anything useful.
  useEffect(() => {
    // "Mis Preferencias" shows the merchants already checked in this
    // session — no API call needed, they're already in `selectedMerchants`.
    if (onlyPreferred) {
      setIsLoadingMerchants(false)
      return
    }

    let cancelled = false
    setIsLoadingMerchants(true)

    searchMerchants({
      search: debouncedMerchantSearch,
      withDiscounts: true,
      categoryId: selectedCategoryId,
      page: 1,
    })
      .then((result) => {
        if (!cancelled) {
          setMerchantOptions(result.items)
          setMerchantPage(result.currentPage)
          setMerchantTotalPages(result.totalPages)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMerchantOptions([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMerchants(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [debouncedMerchantSearch, selectedCategoryId, onlyPreferred])

  function handleLoadMoreMerchants() {
    // "Mis Preferencias" is a static local list (no pagination to fetch).
    if (onlyPreferred || isFetchingMoreMerchantsRef.current || merchantPage >= merchantTotalPages) {
      return
    }

    isFetchingMoreMerchantsRef.current = true
    setIsLoadingMoreMerchants(true)

    searchMerchants({
      search: debouncedMerchantSearch,
      withDiscounts: true,
      categoryId: selectedCategoryId,
      page: merchantPage + 1,
    })
      .then((result) => {
        setMerchantOptions((current) => [...current, ...result.items])
        setMerchantPage(result.currentPage)
        setMerchantTotalPages(result.totalPages)
      })
      .catch(() => {})
      .finally(() => {
        isFetchingMoreMerchantsRef.current = false
        setIsLoadingMoreMerchants(false)
      })
  }

  function handleMerchantGridScroll(event: UIEvent<HTMLDivElement>) {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget

    if (scrollTop + clientHeight >= scrollHeight - 80) {
      handleLoadMoreMerchants()
    }
  }

  // Only merchants selected under a *different* filter/search get pinned to
  // the front — one already present in the current results stays exactly
  // where it is, so toggling it doesn't reshuffle the grid and yank a
  // focused button out from under the user's scroll position.
  const orphanedSelectedMerchants = selectedMerchants.filter(
    (selected) => !merchantOptions.some((option) => option.id === selected.id),
  )
  const mergedMerchantOptions = onlyPreferred
    ? selectedMerchants.filter((merchant) =>
        merchant.name.toLowerCase().includes(debouncedMerchantSearch.toLowerCase()),
      )
    : [...orphanedSelectedMerchants, ...merchantOptions]

  const filteredWallets = wallets.filter((wallet) => wallet.name.toLowerCase().includes(walletSearch.toLowerCase()))

  function toggleMerchant(merchant: Merchant) {
    setSelectedMerchants((current) =>
      current.some((selected) => selected.id === merchant.id)
        ? current.filter((selected) => selected.id !== merchant.id)
        : [...current, merchant],
    )
  }

  function toggleWallet(walletId: number) {
    setSelectedWalletIds((current) =>
      current.includes(walletId) ? current.filter((id) => id !== walletId) : [...current, walletId],
    )
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1])
    }
  }

  function handleNext() {
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1])
    }
  }

  async function handleFinish() {
    const trimmedEmail = email.trim()

    if (trimmedEmail && !trimmedEmail.includes('@')) {
      setEmailError('Ingresá un email válido, o dejalo en blanco.')
      return
    }

    setEmailError(null)
    setIsSubmitting(true)
    setSubmitError(null)

    // Attempted regardless of whether an email is given — a push
    // subscription only needs the local token, created either way. Silently
    // skipped if it doesn't work out (no push permission UI at this step);
    // the user can still turn notifications on later from the app.
    const pushResult = await subscribeToPush()
    const pendingSubscription = pushResult.status === 'subscribed' ? pushResult.subscription : null

    try {
      const preference = await completeOnboarding({
        email: trimmedEmail || undefined,
        merchant_ids: selectedMerchants.map((merchant) => merchant.id),
        wallet_ids: selectedWalletIds,
        wants_notifications: pendingSubscription !== null,
      })

      if (pendingSubscription) {
        await savePushSubscription(preference.token, pendingSubscription).catch(() => {})
      }

      const identity = { token: preference.token, email: preference.email ?? undefined }
      storeUserIdentity(identity)
      onComplete(identity, preference)
    } catch {
      setSubmitError('No pudimos completar el registro. Probá de nuevo.')
      setIsSubmitting(false)
    }
  }

  function primaryButtonLabel(): string {
    if (step === 'email') {
      return isSubmitting ? 'Guardando...' : 'Ver ofertas'
    }

    if (step === 'merchants') {
      return `Siguiente (${selectedMerchants.length} seleccionados)`
    }

    return `Siguiente (${selectedWalletIds.length})`
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          disabled={stepIndex === 0}
          aria-label="Volver"
        >
          ‹
        </button>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
        </div>
        <span className={styles.stepLabel}>
          {stepIndex + 1} / {STEPS.length}
        </span>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>{STEP_TITLES[step]}</h1>
        {STEP_SUBTITLES[step] && <p className={styles.subtitle}>{STEP_SUBTITLES[step]}</p>}

        {step === 'merchants' && (
          <>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar comercio..."
              value={merchantSearch}
              onChange={(event) => setMerchantSearch(event.target.value)}
            />
            <CategoryTabs
              categories={categories}
              selectedId={selectedFilter}
              onSelect={setSelectedFilter}
              leadingChip={{ label: 'Mis Preferencias' }}
            />

            <div className={styles.merchantGrid} onScroll={handleMerchantGridScroll}>
              {mergedMerchantOptions.map((merchant) => {
                const isSelected = selectedMerchants.some((selected) => selected.id === merchant.id)

                return (
                  <button
                    key={merchant.id}
                    type="button"
                    className={`${styles.merchantCell} ${isSelected ? styles.merchantCellSelected : ''}`}
                    onClick={() => toggleMerchant(merchant)}
                  >
                    <span className={styles.merchantAvatarWrapper}>
                      <MerchantAvatar name={merchant.name} logoUrl={merchant.logo_url} size={56} />
                      {isSelected && (
                        <span className={styles.checkBadge} aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className={styles.merchantCellName}>{merchant.name}</span>
                  </button>
                )
              })}

              {!isLoadingMerchants && mergedMerchantOptions.length === 0 && onlyPreferred && (
                <p className={styles.emptyMessage}>Todavía no elegiste ningún comercio. Tocá uno para agregarlo.</p>
              )}
              {!isLoadingMerchants && mergedMerchantOptions.length === 0 && !onlyPreferred && (
                <p className={styles.emptyMessage}>No se encontraron comercios.</p>
              )}
              {isLoadingMoreMerchants && <p className={styles.emptyMessage}>Cargando más...</p>}
            </div>
          </>
        )}

        {step === 'wallets' && (
          <>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar billetera..."
              value={walletSearch}
              onChange={(event) => setWalletSearch(event.target.value)}
            />

            <div className={styles.walletList}>
              {filteredWallets.map((wallet) => {
                const isSelected = selectedWalletIds.includes(wallet.id)
                const branding = getWalletBranding(wallet.slug)

                return (
                  <button
                    key={wallet.id}
                    type="button"
                    className={`${styles.walletRow} ${isSelected ? styles.walletRowSelected : ''}`}
                    onClick={() => toggleWallet(wallet.id)}
                  >
                    <span className={styles.walletIcon} style={{ backgroundColor: branding.color }}>
                      {branding.code}
                    </span>
                    <span className={styles.walletName}>{wallet.name}</span>
                    <span className={`${styles.walletToggle} ${isSelected ? styles.walletToggleOn : ''}`}>
                      {isSelected && '✓'}
                    </span>
                  </button>
                )
              })}

              {filteredWallets.length === 0 && <p className={styles.emptyMessage}>No se encontraron billeteras.</p>}
            </div>
          </>
        )}

        {step === 'email' && (
          <div className={styles.emailArea}>
            <p className={styles.helperText}>
              Opcional — lo usamos solo para identificarte si algún día agregamos recuperación de cuenta.
            </p>
            <input
              type="email"
              className={styles.input}
              placeholder="tu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleFinish()}
            />
            {emailError && <p className={styles.error}>{emailError}</p>}
            {submitError && <p className={styles.error}>{submitError}</p>}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={step === 'email' ? handleFinish : handleNext}
          disabled={isSubmitting}
        >
          {primaryButtonLabel()}
        </button>
      </footer>
    </div>
  )
}
