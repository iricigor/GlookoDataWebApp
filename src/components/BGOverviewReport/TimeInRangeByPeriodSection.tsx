/**
 * Time in Range by Period Section Component
 * Displays TIR breakdown by time periods (14 days, 7 days, 3 days)
 */

import { 
  Text,
  Card,
  Tooltip,
} from '@fluentui/react-components';
import { CalendarLtrRegular, FilterRegular } from '@fluentui/react-icons';
import type { 
  RangeCategoryMode, 
  AGPDayOfWeekFilter,
  TimePeriodTIRStats,
} from '../../types';
import { 
  calculatePercentage, 
  GLUCOSE_RANGE_COLORS, 
  MIN_PERCENTAGE_FOR_PERIOD_BAR,
} from '../../utils/data';
import { useBGOverviewStyles } from './styles';

interface TimeInRangeByPeriodSectionProps {
  categoryMode: RangeCategoryMode;
  dayFilter: AGPDayOfWeekFilter;
  periodStats: TimePeriodTIRStats[];
}

/** Get color for a glucose range category */
function getColorForCategory(category: string): string {
  switch (category) {
    case 'veryLow': return GLUCOSE_RANGE_COLORS.veryLow;
    case 'low': return GLUCOSE_RANGE_COLORS.low;
    case 'inRange': return GLUCOSE_RANGE_COLORS.inRange;
    case 'high': return GLUCOSE_RANGE_COLORS.high;
    case 'veryHigh': return GLUCOSE_RANGE_COLORS.veryHigh;
    default: return '#000';
  }
}

export function TimeInRangeByPeriodSection({
  categoryMode,
  dayFilter,
  periodStats,
}: TimeInRangeByPeriodSectionProps) {
  const styles = useBGOverviewStyles();

  if (periodStats.length === 0) {
    return null;
  }

  return (
    <Card className={styles.sectionCard}>
      <Text className={styles.cardTitle}>
        <CalendarLtrRegular className={styles.cardIcon} />
        Time in Range by Period
        {dayFilter !== 'All Days' && (
          <Tooltip content={`Filtered by: ${dayFilter}`} relationship="description">
            <FilterRegular className={styles.filterIcon} aria-label="Filter indicator" />
          </Tooltip>
        )}
      </Text>
      <div className={styles.periodBarsContainer}>
        {periodStats.map((period) => (
          <div key={period.period} className={styles.periodBarRow}>
            <Text className={styles.periodLabel}>{period.period}</Text>
            <div className={styles.periodBarWrapper}>
              <div className={styles.periodBar}>
                {categoryMode === 5 && (period.stats.veryLow ?? 0) > 0 && (
                  <Tooltip content={`Very Low: ${calculatePercentage(period.stats.veryLow ?? 0, period.stats.total)}% (${period.stats.veryLow ?? 0})`} relationship="description">
                    <div
                      className={styles.periodSegment}
                      style={{
                        width: `${calculatePercentage(period.stats.veryLow ?? 0, period.stats.total)}%`,
                        backgroundColor: getColorForCategory('veryLow'),
                      }}
                    >
                      {calculatePercentage(period.stats.veryLow ?? 0, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                        `${calculatePercentage(period.stats.veryLow ?? 0, period.stats.total)}%`}
                    </div>
                  </Tooltip>
                )}
                {period.stats.low > 0 && (
                  <Tooltip content={`Low: ${calculatePercentage(period.stats.low, period.stats.total)}% (${period.stats.low})`} relationship="description">
                    <div
                      className={styles.periodSegment}
                      style={{
                        width: `${calculatePercentage(period.stats.low, period.stats.total)}%`,
                        backgroundColor: getColorForCategory('low'),
                      }}
                    >
                      {calculatePercentage(period.stats.low, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                        `${calculatePercentage(period.stats.low, period.stats.total)}%`}
                    </div>
                  </Tooltip>
                )}
                {period.stats.inRange > 0 && (
                  <Tooltip content={`In Range: ${calculatePercentage(period.stats.inRange, period.stats.total)}% (${period.stats.inRange})`} relationship="description">
                    <div
                      className={styles.periodSegment}
                      style={{
                        width: `${calculatePercentage(period.stats.inRange, period.stats.total)}%`,
                        backgroundColor: getColorForCategory('inRange'),
                      }}
                    >
                      {calculatePercentage(period.stats.inRange, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                        `${calculatePercentage(period.stats.inRange, period.stats.total)}%`}
                    </div>
                  </Tooltip>
                )}
                {period.stats.high > 0 && (
                  <Tooltip content={`High: ${calculatePercentage(period.stats.high, period.stats.total)}% (${period.stats.high})`} relationship="description">
                    <div
                      className={styles.periodSegment}
                      style={{
                        width: `${calculatePercentage(period.stats.high, period.stats.total)}%`,
                        backgroundColor: getColorForCategory('high'),
                      }}
                    >
                      {calculatePercentage(period.stats.high, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                        `${calculatePercentage(period.stats.high, period.stats.total)}%`}
                    </div>
                  </Tooltip>
                )}
                {categoryMode === 5 && (period.stats.veryHigh ?? 0) > 0 && (
                  <Tooltip content={`Very High: ${calculatePercentage(period.stats.veryHigh ?? 0, period.stats.total)}% (${period.stats.veryHigh ?? 0})`} relationship="description">
                    <div
                      className={styles.periodSegment}
                      style={{
                        width: `${calculatePercentage(period.stats.veryHigh ?? 0, period.stats.total)}%`,
                        backgroundColor: getColorForCategory('veryHigh'),
                      }}
                    >
                      {calculatePercentage(period.stats.veryHigh ?? 0, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                        `${calculatePercentage(period.stats.veryHigh ?? 0, period.stats.total)}%`}
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
