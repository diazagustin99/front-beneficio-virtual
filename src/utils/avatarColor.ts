const AVATAR_PALETTE = [
  '#7e14ff',
  '#0ea5b8',
  '#e11d48',
  '#f59e0b',
  '#16a34a',
  '#2563eb',
  '#db2777',
  '#7c3aed',
]

/**
 * Deterministic (same name always gets the same color) so a merchant
 * without a logo doesn't visually flicker between colors on re-render.
 */
export function pickAvatarColor(seed: string): string {
  let hash = 0

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }

  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

/**
 * Two-letter initials: first letter of the first two words, or the first
 * two characters when the name is a single word (matches how "PedidosYa"
 * becomes "PE" but "Karol G" becomes "KG").
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  return (words[0] ?? '').slice(0, 2).toUpperCase()
}
