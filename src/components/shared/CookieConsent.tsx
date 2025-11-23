/**
 * CookieConsent component
 * 
 * Displays a non-intrusive banner at the bottom of the page to inform users
 * about cookie usage in the application
 */

import { 
  makeStyles, 
  Button,
  Text,
  tokens,
  shorthands,
  MessageBar,
  MessageBarBody,
  Link,
} from '@fluentui/react-components';
import { CookiesRegular, DismissRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  banner: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: 1000,
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow16,
    '@media (max-width: 768px)': {
      ...shorthands.padding('12px'),
    },
  },
  messageBar: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  textContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  icon: {
    fontSize: '20px',
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  text: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.5',
    flex: 1,
  },
  link: {
    fontSize: tokens.fontSizeBase300,
  },
  buttonContainer: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
});

interface CookieConsentProps {
  onAccept: () => void;
}

/**
 * Cookie consent banner component
 * 
 * Shows a dismissible banner at the bottom of the page explaining cookie usage
 */
export function CookieConsent({ onAccept }: CookieConsentProps) {
  const styles = useStyles();

  return (
    <div className={styles.banner}>
      <MessageBar
        intent="info"
        icon={<CookiesRegular className={styles.icon} />}
        className={styles.messageBar}
      >
        <MessageBarBody>
          <div className={styles.content}>
            <div className={styles.textContent}>
              <Text className={styles.text}>
                This app uses <strong>functional cookies only</strong> to save your preferences 
                (theme, settings, date selections). We do <strong>not collect personal data via cookies</strong>, 
                use tracking cookies, or send cookie data to external servers. 
                All data processing happens locally in your browser.{' '}
                <Link
                  href="https://github.com/iricigor/GlookoDataWebApp#-privacy-first"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  Learn more about privacy
                </Link>
              </Text>
            </div>
            <div className={styles.buttonContainer}>
              <Button
                appearance="primary"
                icon={<DismissRegular />}
                onClick={onAccept}
              >
                Got it
              </Button>
            </div>
          </div>
        </MessageBarBody>
      </MessageBar>
    </div>
  );
}
