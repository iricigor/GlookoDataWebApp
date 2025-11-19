import { useState, useEffect, useRef, useCallback } from 'react'
import { FluentProvider } from '@fluentui/react-components'
import './App.css'
import { Navigation, Footer } from './components/shared'
import { Home } from './pages/Home'
import { DataUpload } from './pages/DataUpload'
import { Reports } from './pages/Reports'
import { AIAnalysis } from './pages/AIAnalysis'
import { Settings } from './pages/Settings'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { useExportFormat } from './hooks/useExportFormat'
import { useResponseLanguage } from './hooks/useResponseLanguage'
import { useGlucoseThresholds } from './hooks/useGlucoseThresholds'
import { useGlucoseUnit } from './hooks/useGlucoseUnit'
import { usePerplexityApiKey } from './hooks/usePerplexityApiKey'
import { useGeminiApiKey } from './hooks/useGeminiApiKey'
import { useGrokApiKey } from './hooks/useGrokApiKey'
import { useDeepSeekApiKey } from './hooks/useDeepSeekApiKey'
import { useActiveAIProvider } from './hooks/useActiveAIProvider'
import { useSwipeGesture } from './hooks/useSwipeGesture'
import { useSettingsSync } from './hooks/useSettingsSync'
import type { UploadedFile, AIAnalysisResult } from './types'
import { extractZipMetadata } from './features/dataUpload/utils'

// Page navigation order for swipe gestures
const PAGE_ORDER = ['home', 'upload', 'reports', 'ai', 'settings'] as const

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  
  // Authentication
  const { isLoggedIn, userEmail } = useAuth()
  
  // Settings
  const { theme, themeMode, setThemeMode } = useTheme()
  const { exportFormat, setExportFormat } = useExportFormat()
  const { responseLanguage, setResponseLanguage } = useResponseLanguage()
  const { thresholds: glucoseThresholds, setThresholds: setGlucoseThresholds } = useGlucoseThresholds()
  const { glucoseUnit, setGlucoseUnit } = useGlucoseUnit()
  
  // Sync settings with Azure for authenticated users
  useSettingsSync({
    isLoggedIn,
    userEmail,
    themeMode,
    exportFormat,
    responseLanguage,
    glucoseThresholds,
    setThemeMode,
    setExportFormat,
    setResponseLanguage,
    setGlucoseThresholds,
  })
  
  // API Keys (not synced to Azure for security)
  const { apiKey: perplexityApiKey, setApiKey: setPerplexityApiKey } = usePerplexityApiKey()
  const { apiKey: geminiApiKey, setApiKey: setGeminiApiKey } = useGeminiApiKey()
  const { apiKey: grokApiKey, setApiKey: setGrokApiKey } = useGrokApiKey()
  const { apiKey: deepseekApiKey, setApiKey: setDeepSeekApiKey } = useDeepSeekApiKey()
  const { selectedProvider, setSelectedProvider } = useActiveAIProvider()
  
  // File management (not synced to Azure)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [aiAnalysisResults, setAiAnalysisResults] = useState<Record<string, AIAnalysisResult>>({})

  // Save AI results when they change
  const handleAIAnalysisComplete = useCallback((fileId: string, response: string, inRangePercentage: number) => {
    setAiAnalysisResults(prev => ({
      ...prev,
      [fileId]: {
        fileId,
        response,
        timestamp: new Date(),
        inRangePercentage,
      }
    }))
  }, [])

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

  // Navigate to the next or previous page based on swipe direction
  const navigateToPage = useCallback((direction: 'next' | 'prev') => {
    const currentIndex = PAGE_ORDER.indexOf(currentPage as typeof PAGE_ORDER[number])
    if (currentIndex === -1) return

    let newIndex: number
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % PAGE_ORDER.length
    } else {
      newIndex = currentIndex - 1
      if (newIndex < 0) newIndex = PAGE_ORDER.length - 1
    }

    handleNavigate(PAGE_ORDER[newIndex])
  }, [currentPage])

  // Ref for the main content container
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Setup swipe gesture detection (mobile only)
  useSwipeGesture(
    mainContentRef.current,
    {
      onSwipeLeft: () => navigateToPage('next'),
      onSwipeRight: () => navigateToPage('prev'),
    },
    {
      minSwipeDistance: 50,
      maxVerticalMovement: 100,
    }
  )

  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id))
    // Clear selection if the removed file was selected
    if (selectedFileId === id) {
      setSelectedFileId(null)
    }
    // Remove AI analysis result for the deleted file
    setAiAnalysisResults(prev => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }

  const handleClearAll = () => {
    setUploadedFiles([])
    setSelectedFileId(null)
    setAiAnalysisResults({})
  }

  const handleSelectFile = (id: string | null) => {
    setSelectedFileId(id)
  }

  // Find the selected file object
  const selectedFile = selectedFileId 
    ? uploadedFiles.find(file => file.id === selectedFileId) 
    : undefined

  // Get AI analysis result for selected file
  const currentAIAnalysis = selectedFileId ? aiAnalysisResults[selectedFileId] : undefined

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
        return (
          <AIAnalysis 
            selectedFile={selectedFile} 
            perplexityApiKey={perplexityApiKey} 
            geminiApiKey={geminiApiKey}
            grokApiKey={grokApiKey}
            deepseekApiKey={deepseekApiKey}
            selectedProvider={selectedProvider}
            responseLanguage={responseLanguage}
            existingAnalysis={currentAIAnalysis}
            onAnalysisComplete={handleAIAnalysisComplete}
          />
        )
      case 'settings':
        return <Settings 
          themeMode={themeMode}
          onThemeChange={setThemeMode}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          responseLanguage={responseLanguage}
          onResponseLanguageChange={setResponseLanguage}
          glucoseUnit={glucoseUnit}
          onGlucoseUnitChange={setGlucoseUnit}
          perplexityApiKey={perplexityApiKey}
          onPerplexityApiKeyChange={setPerplexityApiKey}
          geminiApiKey={geminiApiKey}
          onGeminiApiKeyChange={setGeminiApiKey}
          grokApiKey={grokApiKey}
          onGrokApiKeyChange={setGrokApiKey}
          deepseekApiKey={deepseekApiKey}
          onDeepSeekApiKeyChange={setDeepSeekApiKey}
          selectedProvider={selectedProvider}
          onSelectedProviderChange={setSelectedProvider}
        />
      default:
        return <Home onNavigate={handleNavigate} />
    }
  }

  return (
    <FluentProvider theme={theme} className="app-container">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main ref={mainContentRef} className="main-content">
        {renderPage()}
      </main>
      <Footer />
    </FluentProvider>
  )
}

export default App
