import { 
  makeStyles, 
  Button, 
  Card,
  CardHeader,
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components'
import { DatabaseRegular, ChartMultipleRegular } from '@fluentui/react-icons'
import './App.css'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    ...shorthands.padding('20px'),
  },
  card: {
    maxWidth: '600px',
    width: '100%',
    ...shorthands.margin('20px', '0'),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
  },
  content: {
    ...shorthands.padding('20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('15px'),
  },
  buttonGroup: {
    display: 'flex',
    ...shorthands.gap('10px'),
    flexWrap: 'wrap',
  },
  title: {
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '20px',
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase400,
  },
})

function App() {
  const styles = useStyles()

  return (
    <div className={styles.container}>
      <Text className={styles.title}>
        GlookoDataWebApp
      </Text>
      <Text className={styles.subtitle}>
        A web app for importing, visualizing, and analyzing diabetes data exported from the Glooko platform
      </Text>
      
      <Card className={styles.card}>
        <CardHeader
          header={
            <div className={styles.header}>
              <DatabaseRegular fontSize={24} />
              <Text weight="semibold" size={500}>Welcome to Your Development Environment</Text>
            </div>
          }
        />
        <div className={styles.content}>
          <Text>
            This project is set up with:
          </Text>
          <ul>
            <li>⚛️ React 19 with TypeScript</li>
            <li>🎨 Fluent UI React Components</li>
            <li>⚡ Vite for fast development</li>
            <li>🤖 GitHub Copilot ready</li>
            <li>✨ ESLint for code quality</li>
          </ul>
          <div className={styles.buttonGroup}>
            <Button appearance="primary" icon={<ChartMultipleRegular />}>
              Get Started
            </Button>
            <Button appearance="secondary" icon={<DatabaseRegular />}>
              View Documentation
            </Button>
          </div>
          <Text size={300} style={{ marginTop: '10px' }}>
            Ready to build amazing features! Start editing <code>src/App.tsx</code> to begin.
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default App
