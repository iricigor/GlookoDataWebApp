import { makeStyles, Text, tokens, shorthands } from '@fluentui/react-components';
import { getVersionInfo } from '../../utils/version';

const useStyles = makeStyles({
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  versionText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4,
    fontFamily: 'Segoe UI, sans-serif',
  },
});

export function Footer() {
  const styles = useStyles();
  const versionInfo = getVersionInfo();

  return (
    <footer className={styles.footer}>
      <Text className={styles.versionText}>
        Version {versionInfo.fullVersion}
      </Text>
    </footer>
  );
}
