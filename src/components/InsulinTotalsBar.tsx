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
    '@media (max-width: 768px)': {
      width: '50px',
      ...shorthands.padding('10px', '4px', '0', '4px'),
    },
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    minHeight: '68px', // Accommodate both minHeights (30px + 30px + 8px padding)
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
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeBase200,
      ...shorthands.padding('2px'),
    },
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
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeBase200,
      ...shorthands.padding('2px'),
    },
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

  // Only apply minHeight if the percentage is very small (below 10%)
  const MIN_HEIGHT_THRESHOLD = 10;
  const getMinHeight = (percent: number) => percent < MIN_HEIGHT_THRESHOLD ? '30px' : undefined;

  return (
    <div className={styles.container} role="complementary" aria-label="Daily insulin totals visualization">
      <div className={styles.barContainer}>
        {/* Bolus section (top) */}
        {bolusTotal > 0 && (
          <div
            className={styles.bolusSection}
            style={{ height: `${bolusPercent}%`, minHeight: getMinHeight(bolusPercent) }}
            aria-label={`Bolus insulin: ${bolusTotal.toFixed(1)} units`}
          >
            <Text>{bolusTotal.toFixed(1)}</Text>
          </div>
        )}

        {/* Basal section (bottom) */}
        {basalTotal > 0 && (
          <div
            className={styles.basalSection}
            style={{ height: `${basalPercent}%`, minHeight: getMinHeight(basalPercent) }}
            aria-label={`Basal insulin: ${basalTotal.toFixed(1)} units`}
          >
            <Text>{basalTotal.toFixed(1)}</Text>
          </div>
        )}
      </div>
    </div>
  );
}
