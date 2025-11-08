import { useState, useEffect } from 'react'
import { FluentProvider } from '@fluentui/react-components'
import './App.css'
import { Navigation } from './components/Navigation'
import { Home } from './pages/Home'
import { DataUpload } from './pages/DataUpload'
import { Reports } from './pages/Reports'
import { AIAnalysis } from './pages/AIAnalysis'
import { Settings } from './pages/Settings'
import { useTheme } from './hooks/useTheme'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const { theme, themeMode, setThemeMode } = useTheme()

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home'
      setCurrentPage(hash)
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleNavigate = (page: string) => {
    window.location.hash = page
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />
      case 'upload':
        return <DataUpload />
      case 'reports':
        return <Reports />
      case 'ai':
        return <AIAnalysis />
      case 'settings':
        return <Settings themeMode={themeMode} onThemeChange={setThemeMode} />
      default:
        return <Home onNavigate={handleNavigate} />
    }
  }

  return (
    <FluentProvider theme={theme}>
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      {renderPage()}
    </FluentProvider>
  )
}

export default App
