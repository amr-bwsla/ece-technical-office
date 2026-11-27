import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pwa'
import App from './App.tsx'

// After a deploy the new service worker purges old lazy chunks; a stale tab must reload instead of going blank.
const RELOAD_KEY = 'chunk-reload-at'
window.addEventListener('vite:preloadError', (e) => {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
  if (Date.now() - last < 10_000) return
  e.preventDefault()
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
