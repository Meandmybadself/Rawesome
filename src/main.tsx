import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/global.css'

// Apply persisted theme before first paint to prevent flash
const savedPrefs = localStorage.getItem('rawdog-ui-prefs')
try {
  const theme = savedPrefs ? JSON.parse(savedPrefs)?.state?.theme ?? 'dark' : 'dark'
  document.documentElement.setAttribute('data-theme', theme)
} catch {
  document.documentElement.setAttribute('data-theme', 'dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
