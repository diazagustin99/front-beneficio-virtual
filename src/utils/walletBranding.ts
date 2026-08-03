export interface WalletBranding {
  color: string
  code: string
}

const WALLET_BRANDING: Record<string, WalletBranding> = {
  bna: { color: '#1a2f5e', code: 'BN' },
  mercado_pago: { color: '#00b1ea', code: 'MP' },
  brubank: { color: '#ff2d55', code: 'BR' },
  uala: { color: '#ff7a1a', code: 'UA' },
  personal_pay: { color: '#6b2fb3', code: 'PP' },
  naranja_x: { color: '#ff5a1f', code: 'NX' },
  cuenta_dni: { color: '#1f9d55', code: 'DN' },
  modo: { color: '#171717', code: 'MO' },
}

const DEFAULT_BRANDING: WalletBranding = { color: '#6b6478', code: '??' }

export function getWalletBranding(slug: string): WalletBranding {
  return WALLET_BRANDING[slug] ?? DEFAULT_BRANDING
}
