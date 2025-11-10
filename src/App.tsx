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
import { useExportFormat } from './hooks/useExportFormat'
import { usePerplexityApiKey } from './hooks/usePerplexityApiKey'
import type { UploadedFile } from './types'
import { extractZipMetadata } from './utils/zipUtils'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const { theme, themeMode, setThemeMode } = useTheme()
  const { exportFormat, setExportFormat } = useExportFormat()
  const { apiKey: perplexityApiKey, setApiKey: setPerplexityApiKey } = usePerplexityApiKey()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  // Load demo data on app startup
  useEffect(() => {
    const loadDemoData = async () => {
      try {
        // Fetch the demo data file from public folder
        const response = await fetch('/demo-data.zip')
        if (!response.ok) {
          console.warn('Demo data file not found')
          return
        }

        const blob = await response.blob()
        const file = new File([blob], 'demo-data.zip', { type: 'application/zip' })

        // Extract metadata from the demo file
        const zipMetadata = await extractZipMetadata(file)

        const demoFile: UploadedFile = {
          id: `demo-${Date.now()}`,
          name: 'demo-data.zip',
          size: file.size,
          uploadTime: new Date(),
          file: file,
          zipMetadata,
        }

        setUploadedFiles([demoFile])
        setSelectedFileId(demoFile.id)
      } catch (error) {
        console.error('Failed to load demo data:', error)
      }
    }

    loadDemoData()
  }, [])

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
            exportFormat={exportFormat}
          />
        )
      case 'reports':
        return <Reports selectedFile={selectedFile} exportFormat={exportFormat} />
      case 'ai':
        return <AIAnalysis selectedFile={selectedFile} perplexityApiKey={perplexityApiKey} />
      case 'settings':
        return <Settings themeMode={themeMode} onThemeChange={setThemeMode} exportFormat={exportFormat} onExportFormatChange={setExportFormat} perplexityApiKey={perplexityApiKey} onPerplexityApiKeyChange={setPerplexityApiKey} />
      default:
        return <Home onNavigate={handleNavigate} />
    }
  }

  return (
    <FluentProvider theme={theme} className="app-container">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer />
    </FluentProvider>
  )
}

export default App
