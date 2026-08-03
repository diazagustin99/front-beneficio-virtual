import { createContext, useContext } from 'react'
import type { AppPreference } from '../api/types'

export interface PreferenceContextValue {
  preference: AppPreference
  token: string
  /** Re-fetches the preference (after following a merchant, toggling notifications, etc). */
  refresh: () => Promise<void>
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null)

export const PreferenceProvider = PreferenceContext.Provider

/**
 * Only rendered once past the onboarding gate in `App.tsx`, so the context
 * value is guaranteed to be set — throwing here surfaces a wiring mistake
 * immediately instead of silently rendering with no preference loaded.
 */
export function usePreference(): PreferenceContextValue {
  const value = useContext(PreferenceContext)

  if (!value) {
    throw new Error('usePreference must be used within a PreferenceProvider.')
  }

  return value
}
