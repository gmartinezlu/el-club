import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initializeTheme } from './theme'
import App from './app/App.tsx'

initializeTheme()

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "")

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={routerBasename}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
