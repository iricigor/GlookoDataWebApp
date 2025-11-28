/**
 * HyposChartLegend component
 * Displays legend for the hypos chart
 */

import { Text } from '@fluentui/react-components';
import { useHyposStyles } from './styles';
import { HYPO_CHART_COLORS } from './types';

export function HyposChartLegend() {
  const styles = useHyposStyles();

  return (
    <div className={styles.legendContainer}>
      <div className={styles.legendItem}>
        <div className={styles.legendLine} style={{ backgroundColor: HYPO_CHART_COLORS.low }} />
        <Text>Hypoglycemia</Text>
      </div>
      <div className={styles.legendItem}>
        <div className={styles.legendLine} style={{ backgroundColor: HYPO_CHART_COLORS.veryLow }} />
        <Text>Severe Hypoglycemia</Text>
      </div>
      <div className={styles.legendItem}>
        <div className={styles.legendDot} style={{ backgroundColor: HYPO_CHART_COLORS.nadirDot }} />
        <Text>Nadir (Lowest Point)</Text>
      </div>
    </div>
  );
}
