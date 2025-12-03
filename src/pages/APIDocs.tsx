import { useState, useEffect, useRef, useCallback } from 'react'
import {
  makeStyles,
  Text,
  Button,
  Card,
  tokens,
  shorthands,
  MessageBar,
  MessageBarBody,
  Spinner,
  Tooltip,
} from '@fluentui/react-components'
import {
  PersonRegular,
  SignOutRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons'
import 'openapi-explorer'
import './APIDocs.css'
import { useAuth } from '../hooks/useAuth'
import { useProUserCheck } from '../hooks/useProUserCheck'
import { useProUserBadgeStyles } from '../styles/proUserBadge'
import { useIsDarkMode } from '../hooks/useIsDarkMode'

// OpenAPI Explorer wrapper component that creates the web component dynamically
interface OpenAPIExplorerProps {
  specUrl: string;
  isDarkMode: boolean;
  onSpecLoaded?: () => void;
  onLoadFailed?: (error: string) => void;
  idToken?: string | null;
}

// Type definition for OpenAPI Explorer web component methods
interface OpenAPIExplorerElement extends HTMLElement {
  setAuthenticationConfiguration?: (config: { bearerAuth?: { token: string } } | null) => void;
}

function OpenAPIExplorerComponent({ specUrl, isDarkMode, onSpecLoaded, onLoadFailed, idToken }: OpenAPIExplorerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const explorerRef = useRef<OpenAPIExplorerElement | null>(null)

  const createExplorer = useCallback(() => {
    if (!containerRef.current) return

    // Remove existing explorer if any
    if (explorerRef.current) {
      explorerRef.current.remove()
    }

    // Create the web component
    const explorer = document.createElement('openapi-explorer')
    explorer.setAttribute('spec-url', specUrl)
    explorer.setAttribute('show-header', 'false')
    explorer.setAttribute('show-side-nav', 'true')
    explorer.setAttribute('allow-try', 'true')
    explorer.setAttribute('allow-server-selection', 'true')
    explorer.setAttribute('allow-authentication', 'false')
    explorer.setAttribute('allow-search', 'true')
    explorer.setAttribute('fill-request-fields-with-example', 'true')
    explorer.setAttribute('persist-auth', 'false')
    explorer.setAttribute('schema-style', 'tree')
    explorer.setAttribute('schema-expand-level', '1')
    explorer.setAttribute('schema-description-expanded', 'true')
    explorer.setAttribute('default-schema-tab', 'example')
    explorer.setAttribute('layout', 'row')
    explorer.setAttribute('bg-color', isDarkMode ? '#1f1f1f' : '#ffffff')
    explorer.setAttribute('text-color', isDarkMode ? '#ffffff' : '#1f1f1f')
    explorer.setAttribute('primary-color', '#0078d4')
    explorer.setAttribute('nav-bg-color', isDarkMode ? '#292929' : '#f5f5f5')
    explorer.setAttribute('nav-text-color', isDarkMode ? '#ffffff' : '#1f1f1f')
    explorer.setAttribute('nav-hover-bg-color', isDarkMode ? '#383838' : '#e0e0e0')
    explorer.setAttribute('nav-hover-text-color', isDarkMode ? '#ffffff' : '#1f1f1f')
    explorer.setAttribute('nav-accent-color', '#0078d4')
    explorer.style.height = '100%'
    explorer.style.width = '100%'
    explorer.style.display = 'block'

    // Add event listeners
    explorer.addEventListener('spec-loaded', () => {
      onSpecLoaded?.()
    })
    explorer.addEventListener('request-failed', (e: Event) => {
      const customEvent = e as CustomEvent
      onLoadFailed?.(customEvent.detail?.message || 'Failed to load API documentation')
    })

    containerRef.current.appendChild(explorer)
    explorerRef.current = explorer

    return explorer
  }, [specUrl, isDarkMode, onSpecLoaded, onLoadFailed])

  // Create explorer on mount and when dependencies change
  useEffect(() => {
    createExplorer()
    
    // Cleanup on unmount
    return () => {
      if (explorerRef.current) {
        explorerRef.current.remove()
        explorerRef.current = null
      }
    }
  }, [createExplorer])

  // Set Bearer token when idToken changes
  useEffect(() => {
    const explorer = explorerRef.current
    if (!explorer || typeof explorer.setAuthenticationConfiguration !== 'function') {
      return
    }

    if (idToken) {
      // Set the Bearer token when logged in
      explorer.setAuthenticationConfiguration({
        bearerAuth: { token: idToken }
      })
    } else {
      // Clear authentication when logged out
      explorer.setAuthenticationConfiguration(null)
    }
  }, [idToken])

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '24px'),
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      ...shorthands.padding('12px', '16px'),
    },
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  authCard: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('12px', '16px'),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  userName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  userEmail: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  tokenStatus: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
  },
  tokenStatusIcon: {
    color: tokens.colorStatusSuccessForeground1,
  },
  tokenStatusText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorStatusSuccessForeground1,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    ...shorthands.padding('0'),
  },
  messageBar: {
    ...shorthands.margin('16px', '24px'),
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('48px'),
    ...shorthands.gap('12px'),
  },
})

export function APIDocs() {
  const styles = useStyles()
  const proBadgeStyles = useProUserBadgeStyles()
  const { isLoggedIn, userName, userEmail, idToken, isInitialized, login, logout } = useAuth()
  const { isProUser } = useProUserCheck(isLoggedIn ? idToken : null)
  const isDarkMode = useIsDarkMode()
  const [isLoading, setIsLoading] = useState(true)
  const [specError, setSpecError] = useState<string | null>(null)

  // Callbacks for OpenAPI Explorer events
  const handleSpecLoaded = useCallback(() => {
    setIsLoading(false)
    setSpecError(null)
  }, [])

  const handleLoadFailed = useCallback((error: string) => {
    setIsLoading(false)
    setSpecError(error)
  }, [])

  // Set a timeout to hide loading indicator if spec doesn't load quickly
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 5000)
    return () => clearTimeout(timeout)
  }, [])

  if (!isInitialized) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner size="medium" />
          <Text>Initializing authentication...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text className={styles.title}>Glooko Insights - API Documentation</Text>
          <Text className={styles.subtitle}>
            Interactive API explorer with Microsoft authentication
          </Text>
        </div>
        
        <Card className={styles.authCard}>
          {isLoggedIn && userName ? (
            <>
              <div className={styles.userInfo}>
                <div className={proBadgeStyles.userNameContainer}>
                  <Text className={styles.userName}>{userName}</Text>
                  {isProUser && (
                    <Tooltip content="Pro user" relationship="label">
                      <span className={proBadgeStyles.proUserBadge} aria-label="Pro user">✨</span>
                    </Tooltip>
                  )}
                </div>
                {userEmail && <Text className={styles.userEmail}>{userEmail}</Text>}
                <div className={styles.tokenStatus}>
                  <CheckmarkCircleRegular className={styles.tokenStatusIcon} fontSize={14} />
                  <Text className={styles.tokenStatusText}>Token active</Text>
                </div>
              </div>
              <Button
                appearance="secondary"
                icon={<SignOutRegular />}
                onClick={logout}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Text>Sign in to test authenticated endpoints</Text>
              <Button
                appearance="primary"
                icon={<PersonRegular />}
                onClick={login}
              >
                Sign in with Microsoft
              </Button>
            </>
          )}
        </Card>
      </div>

      <div className={styles.content}>
        {!isLoggedIn && (
          <div className={styles.messageBar}>
            <MessageBar intent="warning">
              <MessageBarBody>
                Sign in with your Microsoft account to test API endpoints. 
                Your authentication token will be automatically added to requests.
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {specError && (
          <div className={styles.messageBar}>
            <MessageBar intent="error">
              <MessageBarBody>
                {specError}
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {isLoading && !specError && (
          <div className={styles.loadingContainer}>
            <Spinner size="medium" />
            <Text>Loading API documentation...</Text>
          </div>
        )}

        <OpenAPIExplorerComponent
          specUrl="/api-docs/openapi.json"
          isDarkMode={isDarkMode}
          onSpecLoaded={handleSpecLoaded}
          onLoadFailed={handleLoadFailed}
          idToken={idToken}
        />
      </div>
    </div>
  )
}
