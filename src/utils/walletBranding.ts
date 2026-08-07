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
  galicia: { color: '#c85000', code: 'GA' }, // galicia.ar production CSS: `.filled{background:#c85000}` (solid CTA button fill, e.g. the buscador-de-promociones page's own WhatsApp CTA), also hardcoded directly in the promotions widget's own CardPromotion component
  santander: { color: '#ec0000', code: 'SR' }, // santander.com.ar's own benefits micro-frontend bundle: color name map `rojo:"#ec0000"` inside its shared component library, matches the site's own SVG icon fill `rgb(236, 0, 0)` seen on santander.com.ar/personas/beneficios
  credicoop: { color: '#49B170', code: 'CR' }, // beneficios.bancocredicoop.coop's own CSS (index.css/listado.html), identically defined 3x, explicitly labeled "verde" in the source's own comment ("Coop colores ... Jueves: verde: 49B170") — Credicoop's real logo (bancocredicoop.coop/imagenes/banco-credicoop.jpg) carries this same rainbow palette as its brand stripe, green included
  banco_ciudad: { color: '#005BAA', code: 'BC' }, // bancociudad.com.ar's own official logo SVG (institucional/resources/img/logo_nuevo.svg) uses exactly two fills, #005BAA and #00AEEF — #005BAA is also the single most-used color (167x) in the institutional site's own production stylesheet (styles_bcba.css), confirming it's the primary brand blue, not the yellow/gold sometimes assumed — no yellow/gold hex appears anywhere in that stylesheet or the logo
  supervielle: { color: '#EE2527', code: 'SU' }, // supervielle.com.ar's own official favicon (static/favicon.png) is ~97% this single red; the live site's own production stylesheet uses the identical hex for every active/hover UI state (checked radio indicator, active nav item, "here" map badge), and the benefits page's own JS bundle hardcodes this same red as the default card-badge color (`red` token) for the mainstream "Clásico" segment
  // Attribution-only wallets (MODO's own bank-exclusive promos, no scraper
  // of their own — see back-beneficio-virtual's WalletSeeder). Colors given
  // directly by the user, not sampled.
  bbva: { color: '#001391', code: 'BB' },
  comafi: { color: '#42A905', code: 'CM' },
  banco_santa_fe: { color: '#0B9042', code: 'SF' },
  bancor: { color: '#005F5A', code: 'BA' },
  banco_entre_rios: { color: '#B10F36', code: 'ER' },
  banco_santa_cruz: { color: '#1861EA', code: 'SC' },
  banco_san_juan: { color: '#FFB423', code: 'SJ' },
  banco_corrientes: { color: '#ECAC00', code: 'CO' },
  yoy: { color: '#FF0059', code: 'YO' },
}

const DEFAULT_BRANDING: WalletBranding = { color: '#6b6478', code: '??' }

export function getWalletBranding(slug: string): WalletBranding {
  return WALLET_BRANDING[slug] ?? DEFAULT_BRANDING
}
