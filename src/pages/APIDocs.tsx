import { useState, useEffect, useCallback } from 'react'
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
} from '@fluentui/react-components'
import {
  PersonRegular,
  SignOutRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { useAuth } from '../hooks/useAuth'

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
  const { isLoggedIn, userName, userEmail, idToken, isInitialized, login, logout } = useAuth()
  const [swaggerSpec, setSwaggerSpec] = useState<object | null>(null)
  const [specError, setSpecError] = useState<string | null>(null)

  // Load OpenAPI spec
  useEffect(() => {
    const loadSpec = async () => {
      try {
        const response = await fetch('/api-docs/openapi.json')
        if (!response.ok) {
          throw new Error(`Failed to load OpenAPI specification: ${response.statusText}`)
        }
        const spec = await response.json()
        setSwaggerSpec(spec)
      } catch (error) {
        console.error('Failed to load OpenAPI spec:', error)
        setSpecError(error instanceof Error ? error.message : 'Failed to load API documentation')
      }
    }
    loadSpec()
  }, [])

  // Custom request interceptor to add Bearer token
  const requestInterceptor = useCallback((request: Record<string, unknown>) => {
    if (idToken) {
      const headers = request.headers as Record<string, string> || {}
      headers['Authorization'] = `Bearer ${idToken}`
      request.headers = headers
    }
    return request
  }, [idToken])

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
          <Text className={styles.title}>API Documentation</Text>
          <Text className={styles.subtitle}>
            Interactive API explorer with Microsoft authentication
          </Text>
        </div>
        
        <Card className={styles.authCard}>
          {isLoggedIn && userName ? (
            <>
              <div className={styles.userInfo}>
                <Text className={styles.userName}>{userName}</Text>
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

        {swaggerSpec ? (
          <SwaggerUI
            spec={swaggerSpec}
            requestInterceptor={requestInterceptor}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            displayRequestDuration={true}
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
          />
        ) : !specError && (
          <div className={styles.loadingContainer}>
            <Spinner size="medium" />
            <Text>Loading API documentation...</Text>
          </div>
        )}
      </div>
    </div>
  )
}
