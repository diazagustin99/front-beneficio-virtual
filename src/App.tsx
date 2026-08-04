import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ApiError } from './api/client'
import { getPreference } from './api/preferences'
import type { AppPreference } from './api/types'
import { EmptyState } from './components/EmptyState/EmptyState'
import { Header } from './components/Header/Header'
import { PreferenceProvider } from './context/PreferenceContext'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { WelcomeScreen } from './features/onboarding/WelcomeScreen'
import { AppRoutes } from './routes/AppRoutes'
import { clearStoredUserIdentity, getStoredUserIdentity, type UserIdentity } from './utils/userIdentity'

type Stage = 'welcome' | 'loading' | 'onboarding' | 'app'

function App() {
  const [identity, setIdentity] = useState<UserIdentity | null>(() => getStoredUserIdentity())
  const [preference, setPreference] = useState<AppPreference | null>(null)
  const [stage, setStage] = useState<Stage>('welcome')

  // A token can outlive its Preference (e.g. wiped during development, or a
  // schema reset) — without this, every request with a stale token would
  // just fail silently or with a confusing generic error instead of sending
  // the visitor back through onboarding to get a valid one.
  async function loadPreference(token: string): Promise<AppPreference | null> {
    try {
      return await getPreference(token)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        clearStoredUserIdentity()
        setIdentity(null)
      }

      return null
    }
  }

  function handleSeeOffers() {
    if (!identity) {
      setStage('onboarding')
      return
    }

    setStage('loading')

    loadPreference(identity.token).then((result) => {
      if (result) {
        setPreference(result)
        setStage('app')
      } else {
        setStage('onboarding')
      }
    })
  }

  function handleOnboardingComplete(newIdentity: UserIdentity, newPreference: AppPreference) {
    setIdentity(newIdentity)
    setPreference(newPreference)
    setStage('app')
  }

  async function refresh() {
    if (!identity) {
      return
    }

    const result = await loadPreference(identity.token)

    if (result) {
      setPreference(result)
    }
  }

  return (
    <BrowserRouter>
      {stage === 'welcome' && <WelcomeScreen onSeeOffers={handleSeeOffers} />}
      {stage === 'loading' && <EmptyState message="Cargando..." isLoading />}
      {stage === 'onboarding' && <OnboardingPage onComplete={handleOnboardingComplete} />}
      {stage === 'app' && identity && preference && (
        <PreferenceProvider value={{ preference, token: identity.token, refresh }}>
          <Header />
          <AppRoutes />
        </PreferenceProvider>
      )}
    </BrowserRouter>
  )
}

export default App
