export interface WalletBranding {
  color: string
  code: string
}

// Colors taken from each wallet's own live site (primary CTA / logo color),
// not guessed — see the primary source next to each for how it was found.
const WALLET_BRANDING: Record<string, WalletBranding> = {
  bna: { color: '#005f86', code: 'BN' }, // bna.com.ar primary teal-blue
  mercado_pago: { color: '#3483fa', code: 'MP' }, // mercadopago.com.ar / MELI blue
  brubank: { color: '#6149da', code: 'BR' }, // brubank.com primary CTA (violet, not red)
  uala: { color: '#162dce', code: 'UA' }, // uala.com.ar primary CTA (blue, not orange)
  personal_pay: { color: '#5a50f9', code: 'PP' }, // personal.com.ar primary CTA
  naranja_x: { color: '#ff5000', code: 'NX' }, // naranjax.com logo (isologo) sampled pixel color
  cuenta_dni: { color: '#20a040', code: 'DN' }, // Cuenta DNI logo sampled pixel color
  modo: { color: '#008859', code: 'MO' }, // modo.com.ar wordmark/CTA (green, not black)
  macro: { color: '#0039e3', code: 'MA' }, // macro.com.ar primary blue (not red)
  prex: { color: '#7026dc', code: 'PX' }, // prexcard.com.ar primary CTA (violet, not teal)
  icbc: { color: '#c4161c', code: 'IC' }, // icbc.com.ar red — matches the "#C4161C" ICBC itself uses in its own benefits API payload
}

const DEFAULT_BRANDING: WalletBranding = { color: '#6b6478', code: '??' }

export function getWalletBranding(slug: string): WalletBranding {
  return WALLET_BRANDING[slug] ?? DEFAULT_BRANDING
}
