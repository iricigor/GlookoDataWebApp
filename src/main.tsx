import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { FluentProvider, Spinner, webLightTheme } from '@fluentui/react-components'
import i18n from './i18n'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={
        <FluentProvider theme={webLightTheme}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spinner size="large" label="Loading..." />
          </div>
        </FluentProvider>
      }>
        <App />
      </Suspense>
    </I18nextProvider>
  </StrictMode>,
)
