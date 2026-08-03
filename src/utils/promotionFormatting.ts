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
 * Always returns something to show — `'GRATIS'` is the fallback for a
 * promotion with no numeric discount/cashback/cuotas at all (a plain
 * "free benefit"), matching the welcome carousel's badges.
 */
export function formatPromotionHighlight(promotion: HighlightSource): string {
  if (promotion.discount_percentage) {
    return `${Number(promotion.discount_percentage)}% OFF`
  }

  if (promotion.cashback_percentage) {
    return `${Number(promotion.cashback_percentage)}% cashback`
  }

  if (promotion.fixed_amount) {
    return `$${Number(promotion.fixed_amount).toLocaleString('es-AR')}`
  }

  if (promotion.installments) {
    return `${promotion.installments} cuotas`
  }

  return 'GRATIS'
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
