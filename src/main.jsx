import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import { ProgressProvider } from './context/ProgressContext'
import { I18nProvider } from './i18n/I18nContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <I18nProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </I18nProvider>
    </HashRouter>
  </StrictMode>,
)
