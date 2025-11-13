/**
 * InsulinTotalsBar component
 * Displays a vertical stacked bar showing the ratio between basal and bolus insulin totals
 */

import {
  makeStyles,
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '80px',
    height: '100%',
    ...shorthands.padding('10px', '8px', '0', '8px'),
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    overflow: 'hidden',
  },
  bolusSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding('4px'),
    textAlign: 'center',
    wordBreak: 'break-word',
  },
  basalSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding('4px'),
    textAlign: 'center',
    wordBreak: 'break-word',
  },
});

interface InsulinTotalsBarProps {
  basalTotal: number;
  bolusTotal: number;
}

export function InsulinTotalsBar({ basalTotal, bolusTotal }: InsulinTotalsBarProps) {
  const styles = useStyles();

  // Calculate total insulin
  const totalInsulin = basalTotal + bolusTotal;

  // If no data, don't render
  if (totalInsulin === 0) {
    return null;
  }

  // Calculate percentages for height
  const bolusPercent = (bolusTotal / totalInsulin) * 100;
  const basalPercent = (basalTotal / totalInsulin) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.barContainer}>
        {/* Bolus section (top) */}
        {bolusTotal > 0 && (
          <div
            className={styles.bolusSection}
            style={{ height: `${bolusPercent}%`, minHeight: '30px' }}
          >
            <Text>{bolusTotal.toFixed(1)}</Text>
          </div>
        )}

        {/* Basal section (bottom) */}
        {basalTotal > 0 && (
          <div
            className={styles.basalSection}
            style={{ height: `${basalPercent}%`, minHeight: '30px' }}
          >
            <Text>{basalTotal.toFixed(1)}</Text>
          </div>
        )}
      </div>
    </div>
  );
}
