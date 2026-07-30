interface HighlightSource {
  discount_percentage: string | null
  cashback_percentage: string | null
  fixed_amount: string | null
}

interface DateRangeSource {
  starts_at: string | null
  ends_at: string | null
}

export function formatPromotionHighlight(promotion: HighlightSource): string | null {
  if (promotion.discount_percentage) {
    return `${Number(promotion.discount_percentage)}% OFF`
  }

  if (promotion.cashback_percentage) {
    return `${Number(promotion.cashback_percentage)}% cashback`
  }

  if (promotion.fixed_amount) {
    return `$${Number(promotion.fixed_amount).toLocaleString('es-AR')}`
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
