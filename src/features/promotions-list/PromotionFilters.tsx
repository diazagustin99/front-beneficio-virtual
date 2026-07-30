import { useEffect, useRef, useState, type UIEvent } from 'react'
import { listWallets } from '../../api/wallets'
import { listPromotionCategories } from '../../api/categories'
import { searchMerchants } from '../../api/merchants'
import type { Wallet, PromotionCategory, Merchant } from '../../api/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import styles from './PromotionFilters.module.css'

export interface PromotionFiltersValue {
  wallet: string
  categoryId: number | undefined
  merchantId: number | undefined
  merchantSearch: string
}

interface PromotionFiltersProps {
  value: PromotionFiltersValue
  onChange: (value: PromotionFiltersValue) => void
}

export function PromotionFilters({ value, onChange }: PromotionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categories, setCategories] = useState<PromotionCategory[]>([])
  const [merchantOptions, setMerchantOptions] = useState<Merchant[]>([])
  const [merchantPage, setMerchantPage] = useState(1)
  const [merchantTotalPages, setMerchantTotalPages] = useState(1)
  const [isLoadingMoreMerchants, setIsLoadingMoreMerchants] = useState(false)
  const [showMerchantSuggestions, setShowMerchantSuggestions] = useState(false)
  const debouncedMerchantSearch = useDebouncedValue(value.merchantSearch, 300)
  // Guards concurrent fetches synchronously — state updates are batched, so
  // several scroll events firing in the same tick would all still see the
  // old `isLoadingMoreMerchants` value and each trigger their own request.
  const isFetchingMoreMerchantsRef = useRef(false)

  useEffect(() => {
    listWallets()
      .then(setWallets)
      .catch(() => setWallets([]))
    listPromotionCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (debouncedMerchantSearch.trim().length < 2) {
      setMerchantOptions([])
      setMerchantPage(1)
      setMerchantTotalPages(1)
      return
    }

    let cancelled = false

    searchMerchants(debouncedMerchantSearch, 1)
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
          setMerchantPage(1)
          setMerchantTotalPages(1)
        }
      })

    return () => {
      cancelled = true
    }
  }, [debouncedMerchantSearch])

  function handleMerchantInputChange(text: string) {
    setShowMerchantSuggestions(true)
    onChange({ ...value, merchantSearch: text, merchantId: undefined })
  }

  function handleSelectMerchant(merchant: Merchant) {
    setShowMerchantSuggestions(false)
    onChange({ ...value, merchantSearch: merchant.name, merchantId: merchant.id })
  }

  function handleClearMerchant() {
    setMerchantOptions([])
    setMerchantPage(1)
    setMerchantTotalPages(1)
    setShowMerchantSuggestions(false)
    onChange({ ...value, merchantSearch: '', merchantId: undefined })
  }

  function handleLoadMoreMerchants() {
    if (isFetchingMoreMerchantsRef.current || merchantPage >= merchantTotalPages) {
      return
    }

    isFetchingMoreMerchantsRef.current = true
    setIsLoadingMoreMerchants(true)

    searchMerchants(debouncedMerchantSearch, merchantPage + 1)
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

  function handleSuggestionsScroll(event: UIEvent<HTMLUListElement>) {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget

    if (scrollTop + clientHeight >= scrollHeight - 40) {
      handleLoadMoreMerchants()
    }
  }

  const activeCount = [value.wallet, value.categoryId, value.merchantId].filter(Boolean).length

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
        <div className={styles.field}>
          <label htmlFor="wallet-filter">Billetera</label>
          <select
            id="wallet-filter"
            value={value.wallet}
            onChange={(event) => onChange({ ...value, wallet: event.target.value })}
          >
            <option value="">Todas</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.slug}>
                {wallet.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="category-filter">Categoría</label>
          <select
            id="category-filter"
            value={value.categoryId ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                categoryId: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.field} ${styles.merchantField}`}>
          <label htmlFor="merchant-filter">Comercio</label>
          <div className={styles.merchantInputRow}>
            <input
              id="merchant-filter"
              type="text"
              autoComplete="off"
              placeholder="Buscar comercio..."
              value={value.merchantSearch}
              onChange={(event) => handleMerchantInputChange(event.target.value)}
              onFocus={() => setShowMerchantSuggestions(true)}
              onBlur={() => setTimeout(() => setShowMerchantSuggestions(false), 150)}
            />
            {value.merchantSearch && (
              <button
                type="button"
                className={styles.clearMerchant}
                aria-label="Limpiar comercio"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleClearMerchant}
              >
                ×
              </button>
            )}
          </div>
          {showMerchantSuggestions && merchantOptions.length > 0 && (
            <ul className={styles.suggestions} onScroll={handleSuggestionsScroll}>
              {merchantOptions.map((merchant) => (
                <li key={merchant.id}>
                  <button
                    type="button"
                    className={styles.suggestionButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectMerchant(merchant)}
                  >
                    {merchant.name}
                  </button>
                </li>
              ))}
              {isLoadingMoreMerchants && <li className={styles.suggestionsLoading}>Cargando más...</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
