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
  Tooltip,
  mergeClasses,
} from '@fluentui/react-components';
import {
  DrinkWineRegular,
  FoodRegular,
  HeartPulseRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    ...shorthands.gap('12px'),
  },
  statCard: {
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  statCardBasal: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteGreenBorder1),
  },
  statCardBolus: {
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
  },
  statIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  statIconBasal: {
    color: tokens.colorPaletteGreenForeground1,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  statValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    ...shorthands.gap('4px'),
  },
  statValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'monospace',
  },
  statUnit: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
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
    <div className={styles.statsRow}>
      <Tooltip content="Total basal insulin delivered throughout the day (background insulin)" relationship="description">
        <Card className={mergeClasses(styles.statCard, styles.statCardBasal)}>
          <DrinkWineRegular className={mergeClasses(styles.statIcon, styles.statIconBasal)} />
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>Total Basal</Text>
            <div className={styles.statValueRow}>
              <Text className={styles.statValue}>{basalTotal}</Text>
              <Text className={styles.statUnit}>units</Text>
            </div>
          </div>
        </Card>
      </Tooltip>

      <Tooltip content="Total bolus insulin delivered for meals and corrections" relationship="description">
        <Card className={mergeClasses(styles.statCard, styles.statCardBolus)}>
          <FoodRegular className={styles.statIcon} />
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>Total Bolus</Text>
            <div className={styles.statValueRow}>
              <Text className={styles.statValue}>{bolusTotal}</Text>
              <Text className={styles.statUnit}>units</Text>
            </div>
          </div>
        </Card>
      </Tooltip>

      <Tooltip content="Total insulin delivered (basal + bolus)" relationship="description">
        <Card className={styles.statCard}>
          <HeartPulseRegular className={styles.statIcon} />
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>Total Insulin</Text>
            <div className={styles.statValueRow}>
              <Text className={styles.statValue}>{totalInsulin}</Text>
              <Text className={styles.statUnit}>units</Text>
            </div>
          </div>
        </Card>
      </Tooltip>
    </div>
  );
}
