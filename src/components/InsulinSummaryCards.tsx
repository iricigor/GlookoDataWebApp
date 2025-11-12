/**
 * InsulinSummaryCards component
 * Displays summary cards for daily insulin totals
 */

import {
  makeStyles,
  Text,
  Card,
  tokens,
  shorthands,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  summarySection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  summaryCard: {
    ...shorthands.padding('16px'),
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '4px',
  },
  summaryValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  summaryUnit: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    marginLeft: '4px',
  },
});

interface InsulinSummaryCardsProps {
  basalTotal: number;
  bolusTotal: number;
  totalInsulin: number;
}

export function InsulinSummaryCards({
  basalTotal,
  bolusTotal,
  totalInsulin,
}: InsulinSummaryCardsProps) {
  const styles = useStyles();

  return (
    <div className={styles.summarySection}>
      <Card className={styles.summaryCard}>
        <Text className={styles.summaryLabel}>Total Basal</Text>
        <div>
          <Text className={styles.summaryValue}>{basalTotal}</Text>
          <Text className={styles.summaryUnit}>units</Text>
        </div>
      </Card>

      <Card className={styles.summaryCard}>
        <Text className={styles.summaryLabel}>Total Bolus</Text>
        <div>
          <Text className={styles.summaryValue}>{bolusTotal}</Text>
          <Text className={styles.summaryUnit}>units</Text>
        </div>
      </Card>

      <Card className={styles.summaryCard}>
        <Text className={styles.summaryLabel}>Total Insulin</Text>
        <div>
          <Text className={styles.summaryValue}>{totalInsulin}</Text>
          <Text className={styles.summaryUnit}>units</Text>
        </div>
      </Card>
    </div>
  );
}
