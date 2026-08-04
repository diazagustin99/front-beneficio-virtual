interface HighlightSource {
  discount_percentage: string | null
  cashback_percentage: string | null
  fixed_amount: string | null
  installments?: number | null
}

interface DateRangeSource {
  starts_at: string | null
  ends_at: string | null
}

/**
 * `discount_percentage`/`cashback_percentage`/`fixed_amount` arrive as
 * decimal strings (e.g. `"0.00"`), which are truthy in JS even though they
 * mean "not applicable" — the backend now stores that case as `null`, but
 * this still guards against rows scraped before that fix.
 */
function isPositive(value: string | null): value is string {
  return value !== null && Number(value) > 0
}

/**
 * Returns `null` when the promotion has no discount/cashback/fixed-amount/
 * cuotas figure at all — every caller must skip rendering the badge in that
 * case instead of showing a made-up placeholder (a promotion with no
 * numeric data isn't necessarily free; e.g. MODO's "CSI" — cuotas sin
 * interés — promos have no discount at all, just an installment plan).
 */
export function formatPromotionHighlight(promotion: HighlightSource): string | null {
  if (isPositive(promotion.discount_percentage)) {
    return `${Number(promotion.discount_percentage)}% OFF`
  }

  if (isPositive(promotion.cashback_percentage)) {
    return `${Number(promotion.cashback_percentage)}% cashback`
  }

  if (isPositive(promotion.fixed_amount)) {
    return `$${Number(promotion.fixed_amount).toLocaleString('es-AR')}`
  }

  if (promotion.installments) {
    return `${promotion.installments} cuotas`
  }

  return null
}

export function formatPromotionDateRange(promotion: DateRangeSource): string | null {
  if (!promotion.ends_at) {
    return null
  }

  const end = new Date(promotion.ends_at).toLocaleDateString('es-AR')

  return promotion.starts_at
    ? `${new Date(promotion.starts_at).toLocaleDateString('es-AR')} – ${end}`
    : `Hasta ${end}`
}
