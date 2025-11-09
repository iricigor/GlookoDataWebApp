import { useState, useEffect } from 'react'
import { FluentProvider } from '@fluentui/react-components'
import './App.css'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { DataUpload } from './pages/DataUpload'
import { Reports } from './pages/Reports'
import { AIAnalysis } from './pages/AIAnalysis'
import { Settings } from './pages/Settings'
import { useTheme } from './hooks/useTheme'
import type { UploadedFile } from './types'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const { theme, themeMode, setThemeMode } = useTheme()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

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

  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id))
    // Clear selection if the removed file was selected
    if (selectedFileId === id) {
      setSelectedFileId(null)
    }
  }

  const handleClearAll = () => {
    setUploadedFiles([])
    setSelectedFileId(null)
  }

  const handleSelectFile = (id: string | null) => {
    setSelectedFileId(id)
  }

  // Find the selected file object
  const selectedFile = selectedFileId 
    ? uploadedFiles.find(file => file.id === selectedFileId) 
    : undefined

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />
      case 'upload':
        return (
          <DataUpload 
            uploadedFiles={uploadedFiles}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            onClearAll={handleClearAll}
            selectedFileId={selectedFileId}
            onSelectFile={handleSelectFile}
          />
        )
      case 'reports':
        return <Reports selectedFile={selectedFile} />
      case 'ai':
        return <AIAnalysis selectedFile={selectedFile} />
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
      <Footer />
    </FluentProvider>
  )
}

export default App
