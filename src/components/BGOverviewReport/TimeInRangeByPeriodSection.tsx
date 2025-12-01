/**
 * Time in Range by Period Section Component
 * Displays TIR breakdown by time periods (28, 14, 7, 3 days)
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
  MIN_PERCENTAGE_FOR_PERIOD_BAR,
} from '../../utils/data';
import { useBGOverviewStyles } from './styles';
import { getColorForCategory } from './types';

interface TimeInRangeByPeriodSectionProps {
  categoryMode: RangeCategoryMode;
  dayFilter: AGPDayOfWeekFilter;
  periodStats: TimePeriodTIRStats[];
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
        {periodStats.map((period) => {
          const total = period.stats.total;
          const veryLowPct = categoryMode === 5 ? calculatePercentage(period.stats.veryLow ?? 0, total) : 0;
          const lowPct = calculatePercentage(period.stats.low, total);
          const inRangePct = calculatePercentage(period.stats.inRange, total);
          const highPct = calculatePercentage(period.stats.high, total);
          const veryHighPct = categoryMode === 5 ? calculatePercentage(period.stats.veryHigh ?? 0, total) : 0;

          return (
            <div key={period.period} className={styles.periodBarRow}>
              <Text className={styles.periodLabel}>{period.period}</Text>
              <div className={styles.periodBarWrapper}>
                <div className={styles.periodBar}>
                  {categoryMode === 5 && (period.stats.veryLow ?? 0) > 0 && (
                    <Tooltip content={`Very Low: ${veryLowPct}% (${period.stats.veryLow ?? 0})`} relationship="description">
                      <div
                        className={styles.periodSegment}
                        style={{
                          width: `${veryLowPct}%`,
                          backgroundColor: getColorForCategory('veryLow'),
                        }}
                      >
                        {veryLowPct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${veryLowPct}%`}
                      </div>
                    </Tooltip>
                  )}
                  {period.stats.low > 0 && (
                    <Tooltip content={`Low: ${lowPct}% (${period.stats.low})`} relationship="description">
                      <div
                        className={styles.periodSegment}
                        style={{
                          width: `${lowPct}%`,
                          backgroundColor: getColorForCategory('low'),
                        }}
                      >
                        {lowPct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${lowPct}%`}
                      </div>
                    </Tooltip>
                  )}
                  {period.stats.inRange > 0 && (
                    <Tooltip content={`In Range: ${inRangePct}% (${period.stats.inRange})`} relationship="description">
                      <div
                        className={styles.periodSegment}
                        style={{
                          width: `${inRangePct}%`,
                          backgroundColor: getColorForCategory('inRange'),
                        }}
                      >
                        {inRangePct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${inRangePct}%`}
                      </div>
                    </Tooltip>
                  )}
                  {period.stats.high > 0 && (
                    <Tooltip content={`High: ${highPct}% (${period.stats.high})`} relationship="description">
                      <div
                        className={styles.periodSegment}
                        style={{
                          width: `${highPct}%`,
                          backgroundColor: getColorForCategory('high'),
                        }}
                      >
                        {highPct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${highPct}%`}
                      </div>
                    </Tooltip>
                  )}
                  {categoryMode === 5 && (period.stats.veryHigh ?? 0) > 0 && (
                    <Tooltip content={`Very High: ${veryHighPct}% (${period.stats.veryHigh ?? 0})`} relationship="description">
                      <div
                        className={styles.periodSegment}
                        style={{
                          width: `${veryHighPct}%`,
                          backgroundColor: getColorForCategory('veryHigh'),
                        }}
                      >
                        {veryHighPct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${veryHighPct}%`}
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
