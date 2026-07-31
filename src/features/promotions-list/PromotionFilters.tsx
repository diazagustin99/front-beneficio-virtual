import { useEffect, useRef, useState, type UIEvent } from 'react'
import { listWallets } from '../../api/wallets'
import { listPromotionCategories } from '../../api/categories'
import { searchMerchants } from '../../api/merchants'
import type { Wallet, PromotionCategory, Merchant } from '../../api/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { CheckboxListFilter } from '../../components/CheckboxListFilter/CheckboxListFilter'
import { FilterSection } from '../../components/FilterSection/FilterSection'
import { WeekdayPicker } from '../../components/WeekdayPicker/WeekdayPicker'
import styles from './PromotionFilters.module.css'

export interface PromotionFiltersValue {
  walletSlugs: string[]
  categoryIds: number[]
  selectedMerchants: Merchant[]
  merchantSearch: string
  validDays: string[]
}

interface PromotionFiltersProps {
  value: PromotionFiltersValue
  onChange: (value: PromotionFiltersValue) => void
}

export function PromotionFilters({ value, onChange }: PromotionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categories, setCategories] = useState<PromotionCategory[]>([])
  const [walletSearch, setWalletSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')

  const [merchantOptions, setMerchantOptions] = useState<Merchant[]>([])
  const [merchantPage, setMerchantPage] = useState(1)
  const [merchantTotalPages, setMerchantTotalPages] = useState(1)
  const [isLoadingMoreMerchants, setIsLoadingMoreMerchants] = useState(false)
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

  function handleMerchantListScroll(event: UIEvent<HTMLUListElement>) {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget

    if (scrollTop + clientHeight >= scrollHeight - 40) {
      handleLoadMoreMerchants()
    }
  }

  function toggleWallet(id: string | number) {
    const slug = String(id)
    const next = value.walletSlugs.includes(slug)
      ? value.walletSlugs.filter((s) => s !== slug)
      : [...value.walletSlugs, slug]
    onChange({ ...value, walletSlugs: next })
  }

  function toggleCategory(id: string | number) {
    const categoryId = Number(id)
    const next = value.categoryIds.includes(categoryId)
      ? value.categoryIds.filter((c) => c !== categoryId)
      : [...value.categoryIds, categoryId]
    onChange({ ...value, categoryIds: next })
  }

  function toggleMerchant(id: string | number) {
    const merchantId = Number(id)
    const isSelected = value.selectedMerchants.some((merchant) => merchant.id === merchantId)

    if (isSelected) {
      onChange({
        ...value,
        selectedMerchants: value.selectedMerchants.filter((merchant) => merchant.id !== merchantId),
      })
      return
    }

    const merchant = mergedMerchantOptions.find((option) => option.id === merchantId)

    if (merchant) {
      onChange({ ...value, selectedMerchants: [...value.selectedMerchants, merchant] })
    }
  }

  function toggleDay(id: string | number) {
    const day = String(id)
    const next = value.validDays.includes(day)
      ? value.validDays.filter((d) => d !== day)
      : [...value.validDays, day]
    onChange({ ...value, validDays: next })
  }

  const filteredWallets = wallets.filter((wallet) =>
    wallet.name.toLowerCase().includes(walletSearch.toLowerCase()),
  )
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase()),
  )
  // Keeps already-selected merchants visible (pinned first) even after the
  // search text changes and they drop out of the current results page.
  const mergedMerchantOptions = [
    ...value.selectedMerchants,
    ...merchantOptions.filter(
      (option) => !value.selectedMerchants.some((selected) => selected.id === option.id),
    ),
  ]

  const activeCount =
    value.walletSlugs.length + value.categoryIds.length + value.selectedMerchants.length + value.validDays.length

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
        <div className={styles.fieldWrapper}>
          <FilterSection
            label="Billetera"
            count={value.walletSlugs.length}
            onClear={() => onChange({ ...value, walletSlugs: [] })}
          >
            <CheckboxListFilter
              options={filteredWallets.map((wallet) => ({ id: wallet.slug, label: wallet.name }))}
              selectedIds={value.walletSlugs}
              onToggle={toggleWallet}
              searchValue={walletSearch}
              onSearchChange={setWalletSearch}
              searchPlaceholder="Buscar billetera..."
              emptyMessage="No se encontraron billeteras."
            />
          </FilterSection>
        </div>

        <div className={styles.fieldWrapper}>
          <FilterSection
            label="Categoría"
            count={value.categoryIds.length}
            onClear={() => onChange({ ...value, categoryIds: [] })}
          >
            <CheckboxListFilter
              options={filteredCategories.map((category) => ({ id: category.id, label: category.name }))}
              selectedIds={value.categoryIds}
              onToggle={toggleCategory}
              searchValue={categorySearch}
              onSearchChange={setCategorySearch}
              searchPlaceholder="Buscar categoría..."
              emptyMessage="No se encontraron categorías."
            />
          </FilterSection>
        </div>

        <div className={styles.fieldWrapper}>
          <FilterSection
            label="Comercio"
            count={value.selectedMerchants.length}
            onClear={() => onChange({ ...value, selectedMerchants: [], merchantSearch: '' })}
          >
            <CheckboxListFilter
              options={mergedMerchantOptions.map((merchant) => ({ id: merchant.id, label: merchant.name }))}
              selectedIds={value.selectedMerchants.map((merchant) => merchant.id)}
              onToggle={toggleMerchant}
              searchValue={value.merchantSearch}
              onSearchChange={(text) => onChange({ ...value, merchantSearch: text })}
              searchPlaceholder="Buscar comercio..."
              onListScroll={handleMerchantListScroll}
              isLoadingMore={isLoadingMoreMerchants}
              emptyMessage={
                value.merchantSearch.trim().length < 2
                  ? 'Escribí al menos 2 letras para buscar.'
                  : 'No se encontraron comercios.'
              }
            />
          </FilterSection>
        </div>

        <div className={styles.fieldWrapperFull}>
          <FilterSection
            label="Días de oferta"
            count={value.validDays.length}
            onClear={() => onChange({ ...value, validDays: [] })}
          >
            <WeekdayPicker selectedDays={value.validDays} onToggle={toggleDay} />
          </FilterSection>
        </div>
      </div>
    </div>
  )
}
