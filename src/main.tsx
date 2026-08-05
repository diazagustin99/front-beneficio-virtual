import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './animations.css'
import App from './App.tsx'

// MerchantsListPage restores its own scroll position on back-navigation
// (see its cachedListState) — the browser's native scroll restoration would
// otherwise fight that, snapping to its own (stale, pre-render) memory of
// the scroll offset for this history entry.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
