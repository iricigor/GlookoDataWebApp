import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { FluentProvider, Spinner, webDarkTheme } from '@fluentui/react-components'
import { GoogleOAuthProvider } from '@react-oauth/google'
import i18n from './i18n'
import './index.css'
import App from './App.tsx'
import { googleClientId, isGoogleAuthAvailable } from './config/googleConfig'

const renderApp = () => {
  const appContent = (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={
        <FluentProvider theme={webDarkTheme}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spinner size="large" label="Loading..." />
          </div>
        </FluentProvider>
      }>
        <App />
      </Suspense>
    </I18nextProvider>
  );

  return isGoogleAuthAvailable ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      {appContent}
    </GoogleOAuthProvider>
  ) : appContent;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {renderApp()}
  </StrictMode>,
)
