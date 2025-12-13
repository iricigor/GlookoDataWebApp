import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  FluentProvider, 
  Toaster, 
  useToastController, 
  useId, 
  Toast, 
  ToastTitle, 
  ToastBody 
} from '@fluentui/react-components'
import { useTranslation } from 'react-i18next'
import './App.css'
import { Navigation, Footer, CookieConsent } from './components/shared'
import { Home } from './pages/Home'
import { DataUpload } from './pages/DataUpload'
import { Reports } from './pages/Reports'
import { AIAnalysis } from './pages/AIAnalysis'
import { Settings } from './pages/Settings'
import { APIDocs } from './pages/APIDocs'
import { Admin } from './pages/Admin'
import { useTheme, isDarkTheme } from './hooks/useTheme'
import { useExportFormat } from './hooks/useExportFormat'
import { useResponseLanguage } from './hooks/useResponseLanguage'
import { useUILanguage } from './hooks/useUILanguage'
import { useGlucoseUnit } from './hooks/useGlucoseUnit'
import { useGlucoseThresholds } from './hooks/useGlucoseThresholds'
import { usePerplexityApiKey } from './hooks/usePerplexityApiKey'
import { useGeminiApiKey } from './hooks/useGeminiApiKey'
import { useGrokApiKey } from './hooks/useGrokApiKey'
import { useDeepSeekApiKey } from './hooks/useDeepSeekApiKey'
import { useActiveAIProvider } from './hooks/useActiveAIProvider'
import { useInsulinDuration } from './hooks/useInsulinDuration'
import { useCookieConsent } from './hooks/useCookieConsent'
import { useAuth } from './hooks/useAuth'
import { useProUserCheck } from './hooks/useProUserCheck'
import { useUserSettings } from './hooks/useUserSettings'
import { useDayNightShading } from './hooks/useDayNightShading'
import { useGeekStats } from './hooks/useGeekStats'
import type { UploadedFile, AIAnalysisResult, CloudUserSettings } from './types'
import type { AIProvider } from './utils/api'
import { getProviderDisplayName } from './utils/api'
import { extractZipMetadata } from './features/dataUpload/utils'
import { loadCachedFiles } from './utils/fileCache'

/**
 * Application root component that renders the app shell and manages global state, routing, and user settings.
 *
 * Manages theme, file uploads and selection, AI analysis results, toast notifications, cookie consent, demo data loading, and cloud settings synchronization for authenticated users.
 *
 * @returns The root React element for the application UI.
 */
function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [isLoadingDemoData, setIsLoadingDemoData] = useState(true)
  const { t } = useTranslation('notifications')
  
  // Authentication state
  const { isLoggedIn, idToken, userEmail } = useAuth()
  
  // Pro user check
  const { isProUser } = useProUserCheck(isLoggedIn ? idToken : null)
  
  // Settings (stored locally in browser cookies)
  const { theme, themeMode, setThemeMode } = useTheme()
  const isDark = isDarkTheme(themeMode)
  
  // Sync theme with html and body class for RSuite popup theming and dark mode background
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDark]);
  const { exportFormat, setExportFormat } = useExportFormat()
  const { uiLanguage, setUILanguage } = useUILanguage()
  const { responseLanguage, setResponseLanguage, syncWithUILanguage, setSyncWithUILanguage } = useResponseLanguage(uiLanguage)
  const { glucoseUnit, setGlucoseUnit } = useGlucoseUnit()
  const { insulinDuration, setInsulinDuration } = useInsulinDuration()
  const { thresholds: glucoseThresholds, setThresholds: setGlucoseThresholds } = useGlucoseThresholds()
  const { showDayNightShading, setShowDayNightShading } = useDayNightShading()
  const { showGeekStats, setShowGeekStats } = useGeekStats()
  
  // Cookie consent management
  const { hasConsented, acknowledgeConsent } = useCookieConsent()
  
  // API Keys (stored in browser cookies)
  const { apiKey: perplexityApiKey, setApiKey: setPerplexityApiKey } = usePerplexityApiKey()
  const { apiKey: geminiApiKey, setApiKey: setGeminiApiKey } = useGeminiApiKey()
  const { apiKey: grokApiKey, setApiKey: setGrokApiKey } = useGrokApiKey()
  const { apiKey: deepseekApiKey, setApiKey: setDeepSeekApiKey } = useDeepSeekApiKey()
  const { selectedProvider, setSelectedProvider } = useActiveAIProvider()
  
  // User settings cloud sync
  const { 
    syncStatus, 
    saveSettings, 
    loadSettings, 
    saveSettingsSync 
  } = useUserSettings(idToken, userEmail)
  
  // Track if we've loaded settings for the current session
  const [hasLoadedCloudSettings, setHasLoadedCloudSettings] = useState(false)
  
  // File management
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [aiAnalysisResults, setAiAnalysisResults] = useState<Record<string, AIAnalysisResult>>({})

  // Toast notifications
  const toasterId = useId('toaster')
  const { dispatchToast } = useToastController(toasterId)

  // Handle AI provider auto-switch notification
  const handleProviderAutoSwitch = useCallback((fromProvider: AIProvider, toProvider: AIProvider) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{t('toast.aiProviderSwitchedTitle')}</ToastTitle>
        <ToastBody>
          {t('toast.aiProviderSwitchedBody', { 
            fromProvider: getProviderDisplayName(fromProvider), 
            toProvider: getProviderDisplayName(toProvider) 
          })}
        </ToastBody>
      </Toast>,
      { intent: 'warning', timeout: 5000 }
    )
  }, [dispatchToast, t])

  // Get current settings as CloudUserSettings object
  const getCurrentSettings = useCallback((): CloudUserSettings => {
    return {
      themeMode,
      exportFormat,
      responseLanguage,
      glucoseUnit,
      insulinDuration,
      glucoseThresholds,
    }
  }, [themeMode, exportFormat, responseLanguage, glucoseUnit, insulinDuration, glucoseThresholds])

  // Apply loaded settings to local state
  const applyCloudSettings = useCallback((settings: CloudUserSettings) => {
    if (settings.themeMode) setThemeMode(settings.themeMode)
    if (settings.exportFormat) setExportFormat(settings.exportFormat)
    if (settings.responseLanguage) setResponseLanguage(settings.responseLanguage)
    if (settings.glucoseUnit) setGlucoseUnit(settings.glucoseUnit)
    if (settings.insulinDuration) setInsulinDuration(settings.insulinDuration)
    if (settings.glucoseThresholds) setGlucoseThresholds(settings.glucoseThresholds)
  }, [setThemeMode, setExportFormat, setResponseLanguage, setGlucoseUnit, setInsulinDuration, setGlucoseThresholds])

  // Reset loaded flag when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setHasLoadedCloudSettings(false)
    }
  }, [isLoggedIn])

  // Track previous settings to detect changes
  // Using JSON.stringify for comparison is reliable here because:
  // 1. The settings object has a consistent structure
  // 2. Property order is determined by getCurrentSettings() which always 
  //    creates objects with the same property order
  // 3. All values are primitives or simple nested objects
  const prevSettingsRef = useRef<string>('')
  
  // Save settings when they change (async, fire and forget)
  useEffect(() => {
    if (!isLoggedIn || !idToken || !hasLoadedCloudSettings) {
      return
    }
    
    const currentSettings = getCurrentSettings()
    const currentSettingsJson = JSON.stringify(currentSettings)
    
    // Only save if settings actually changed
    if (currentSettingsJson !== prevSettingsRef.current) {
      prevSettingsRef.current = currentSettingsJson
      // Fire and forget - async save
      saveSettings(currentSettings)
    }
  }, [isLoggedIn, idToken, hasLoadedCloudSettings, getCurrentSettings, saveSettings])

  // Handle first login accept - save initial settings
  const handleFirstLoginAccept = useCallback(() => {
    if (isLoggedIn && idToken) {
      const currentSettings = getCurrentSettings()
      saveSettings(currentSettings)
    }
  }, [isLoggedIn, idToken, getCurrentSettings, saveSettings])

  // Handle first login cancel - user is logged out by Navigation
  const handleFirstLoginCancel = useCallback(() => {
    // User will be logged out, nothing to do here
  }, [])

  // Handle returning user login - load their settings from cloud
  const handleReturningUserLogin = useCallback(async () => {
    if (isLoggedIn && idToken && !hasLoadedCloudSettings) {
      const result = await loadSettings()
      if (result.success && result.settings) {
        applyCloudSettings(result.settings)
        setHasLoadedCloudSettings(true)
      } else if (result.success && !result.settings) {
        // 404 - no settings found, which is OK
        setHasLoadedCloudSettings(true)
      }
      // If loading failed with an error, don't set the flag
      // so we can retry on next login
    }
  }, [isLoggedIn, idToken, hasLoadedCloudSettings, loadSettings, applyCloudSettings])

  // Handle before logout - save settings synchronously
  const handleBeforeLogout = useCallback(async () => {
    if (isLoggedIn && idToken) {
      const currentSettings = getCurrentSettings()
      await saveSettingsSync(currentSettings)
    }
  }, [isLoggedIn, idToken, getCurrentSettings, saveSettingsSync])

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

  // Toggle between light and dark theme (skips system option when using quick toggle)
  const handleThemeToggle = useCallback(() => {
    // Determine current effective theme and toggle to the opposite explicit mode
    setThemeMode(isDarkTheme(themeMode) ? 'light' : 'dark')
  }, [themeMode, setThemeMode])

  // Load demo data and cached files on app startup
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const allFiles: UploadedFile[] = []
        
        // Load cached files first
        try {
          const cachedFiles = await loadCachedFiles()
          allFiles.push(...cachedFiles)
        } catch (error) {
          console.error('Failed to load cached files:', error)
        }
        
        // Fetch Larry's demo data file from public folder
        const response = await fetch('/demo-data/larry-demo-data.zip')
        if (!response.ok) {
          console.warn('Demo data file not found, skipping auto-load')
          if (allFiles.length > 0) {
            setUploadedFiles(allFiles)
            setSelectedFileId(allFiles[0].id)
          }
          setIsLoadingDemoData(false)
          return
        }

        const blob = await response.blob()
        const file = new File([blob], 'larry-demo-data.zip', { type: 'application/zip' })

        // Extract metadata from the demo file
        const zipMetadata = await extractZipMetadata(file)

        const demoFile: UploadedFile = {
          id: `demo-${Date.now()}`,
          name: 'larry-demo-data.zip',
          size: file.size,
          uploadTime: new Date(),
          file: file,
          zipMetadata,
        }

        allFiles.push(demoFile)
        setUploadedFiles(allFiles)
        setSelectedFileId(demoFile.id)
        setIsLoadingDemoData(false)
      } catch (error) {
        // Silently handle errors - app should work without demo data
        console.error('Failed to load initial data:', error)
        setIsLoadingDemoData(false)
      }
    }

    loadInitialData()
  }, [])

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home'
      // Support deep linking: #reports/agp
      const [page] = hash.split('/')
      setCurrentPage(page)
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
    
    // Auto-select the first valid file if one was uploaded
    const validFile = newFiles.find(file => file.zipMetadata?.isValid)
    if (validFile) {
      setSelectedFileId(validFile.id)
      
      // Show toast notification
      dispatchToast(
        <Toast>
          <ToastTitle>{t('toast.fileLoadedSuccessTitle')}</ToastTitle>
          <ToastBody>
            {t('toast.fileLoadedSuccessBody', { fileName: validFile.name })}
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 5000 }
      )
    }
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

  const handleUpdateFile = (updatedFile: UploadedFile) => {
    setUploadedFiles((prev) => 
      prev.map((file) => file.id === updatedFile.id ? updatedFile : file)
    )
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
            onUpdateFile={handleUpdateFile}
            selectedFileId={selectedFileId}
            onSelectFile={handleSelectFile}
            exportFormat={exportFormat}
            isLoadingDemoData={isLoadingDemoData}
          />
        )
      case 'reports':
        return (
          <Reports
            selectedFile={selectedFile}
            exportFormat={exportFormat}
            glucoseUnit={glucoseUnit}
            insulinDuration={insulinDuration}
            showDayNightShading={showDayNightShading}
            showGeekStats={showGeekStats}
            perplexityApiKey={perplexityApiKey}
            geminiApiKey={geminiApiKey}
            grokApiKey={grokApiKey}
            deepseekApiKey={deepseekApiKey}
            selectedProvider={selectedProvider}
            responseLanguage={responseLanguage}
          />
        )
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
            glucoseUnit={glucoseUnit}
            showGeekStats={showGeekStats}
            existingAnalysis={currentAIAnalysis}
            onAnalysisComplete={handleAIAnalysisComplete}
            isProUser={isProUser}
            idToken={idToken}
          />
        )
      case 'settings':
        return <Settings
          themeMode={themeMode}
          onThemeChange={setThemeMode}
          showDayNightShading={showDayNightShading}
          onShowDayNightShadingChange={setShowDayNightShading}
          showGeekStats={showGeekStats}
          onShowGeekStatsChange={setShowGeekStats}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          uiLanguage={uiLanguage}
          onUILanguageChange={setUILanguage}
          responseLanguage={responseLanguage}
          onResponseLanguageChange={setResponseLanguage}
          syncWithUILanguage={syncWithUILanguage}
          onSyncWithUILanguageChange={setSyncWithUILanguage}
          glucoseUnit={glucoseUnit}
          onGlucoseUnitChange={setGlucoseUnit}
          glucoseThresholds={glucoseThresholds}
          onGlucoseThresholdsChange={setGlucoseThresholds}
          insulinDuration={insulinDuration}
          onInsulinDurationChange={setInsulinDuration}
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
          onProviderAutoSwitch={handleProviderAutoSwitch}
        />
      case 'api-docs':
        return <APIDocs />
      case 'admin':
        return <Admin />
      default:
        return <Home onNavigate={handleNavigate} />
    }
  }

  // Hide navigation and footer on API docs page (standalone developer page)
  const isApiDocsPage = currentPage === 'api-docs'

  return (
    <FluentProvider theme={theme} className="app-container" data-theme={isDark ? 'dark' : 'light'}>
      <Toaster toasterId={toasterId} position="top-end" />
      {!isApiDocsPage && (
        <Navigation 
          currentPage={currentPage} 
          onNavigate={handleNavigate} 
          themeMode={themeMode}
          onThemeToggle={handleThemeToggle}
          onFirstLoginAccept={handleFirstLoginAccept}
          onFirstLoginCancel={handleFirstLoginCancel}
          onBeforeLogout={handleBeforeLogout}
          onReturningUserLogin={handleReturningUserLogin}
          syncStatus={syncStatus}
        />
      )}
      <main className="main-content">
        {renderPage()}
      </main>
      {!isApiDocsPage && <Footer />}
      {!hasConsented && <CookieConsent onAccept={acknowledgeConsent} />}
    </FluentProvider>
  )
}

export default App