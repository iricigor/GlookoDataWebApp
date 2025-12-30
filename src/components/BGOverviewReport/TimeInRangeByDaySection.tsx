/**
 * Time in Range by Day of Week Section Component
 * Displays TIR breakdown by day of week with horizontal stacked bars
 */

import { 
  Text,
  Tooltip,
} from '@fluentui/react-components';
import type { 
  RangeCategoryMode, 
  DayOfWeekReport,
} from '../../types';
import { 
  calculatePercentage, 
  MIN_PERCENTAGE_FOR_PERIOD_BAR,
} from '../../utils/data';
import { useBGOverviewStyles } from './styles';
import { getColorForCategory } from './types';

interface TimeInRangeByDaySectionProps {
  categoryMode: RangeCategoryMode;
  dayOfWeekReports: DayOfWeekReport[];
}

/**
 * Renders TIR breakdown by day of week with horizontal bars.
 * Shows Monday-Sunday, plus aggregate bars for Weekdays and Weekend.
 * 
 * @param categoryMode - The range category mode (3 or 5 categories)
 * @param dayOfWeekReports - Array of day-of-week TIR reports
 * @returns JSX element with day-of-week TIR bars, or null if no data
 */
export function TimeInRangeByDaySection({
  categoryMode,
  dayOfWeekReports,
}: TimeInRangeByDaySectionProps) {
  const styles = useBGOverviewStyles();

  if (!dayOfWeekReports || dayOfWeekReports.length === 0) {
    return null;
  }

  // Filter out the individual days (Mon-Sun) and separate aggregates (Workday/Weekend)
  const individualDays = dayOfWeekReports.filter(
    r => r.day !== 'Workday' && r.day !== 'Weekend'
  );
  const aggregateDays = dayOfWeekReports.filter(
    r => r.day === 'Workday' || r.day === 'Weekend'
  );

  return (
    <div>
      {/* Individual days (Monday - Sunday) */}
      <div className={styles.periodBarsContainer}>
        {individualDays.map((dayReport) => {
          const total = dayReport.stats.total;
          const veryLowPct = categoryMode === 5 ? calculatePercentage(dayReport.stats.veryLow ?? 0, total) : 0;
          const lowPct = calculatePercentage(dayReport.stats.low, total);
          const inRangePct = calculatePercentage(dayReport.stats.inRange, total);
          const highPct = calculatePercentage(dayReport.stats.high, total);
          const veryHighPct = categoryMode === 5 ? calculatePercentage(dayReport.stats.veryHigh ?? 0, total) : 0;

          return (
            <div key={dayReport.day} className={styles.periodBarRow}>
              <Text className={styles.periodLabel}>{dayReport.day}</Text>
              <div className={styles.periodBarWrapper}>
                <div className={styles.periodBar}>
                  {categoryMode === 5 && (dayReport.stats.veryLow ?? 0) > 0 && (
                    <Tooltip content={`Very Low: ${veryLowPct}% (${dayReport.stats.veryLow ?? 0})`} relationship="description">
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
                  {dayReport.stats.low > 0 && (
                    <Tooltip content={`Low: ${lowPct}% (${dayReport.stats.low})`} relationship="description">
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
                  {dayReport.stats.inRange > 0 && (
                    <Tooltip content={`In Range: ${inRangePct}% (${dayReport.stats.inRange})`} relationship="description">
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
                  {dayReport.stats.high > 0 && (
                    <Tooltip content={`High: ${highPct}% (${dayReport.stats.high})`} relationship="description">
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
                  {categoryMode === 5 && (dayReport.stats.veryHigh ?? 0) > 0 && (
                    <Tooltip content={`Very High: ${veryHighPct}% (${dayReport.stats.veryHigh ?? 0})`} relationship="description">
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

      {/* Aggregate days (Weekdays / Weekend) */}
      {aggregateDays.length > 0 && (
        <div className={styles.periodBarsContainer} style={{ marginTop: '16px' }}>
          {aggregateDays.map((dayReport) => {
            const total = dayReport.stats.total;
            const veryLowPct = categoryMode === 5 ? calculatePercentage(dayReport.stats.veryLow ?? 0, total) : 0;
            const lowPct = calculatePercentage(dayReport.stats.low, total);
            const inRangePct = calculatePercentage(dayReport.stats.inRange, total);
            const highPct = calculatePercentage(dayReport.stats.high, total);
            const veryHighPct = categoryMode === 5 ? calculatePercentage(dayReport.stats.veryHigh ?? 0, total) : 0;

            return (
              <div key={dayReport.day} className={styles.periodBarRow}>
                <Text className={styles.periodLabel}>{dayReport.day}</Text>
                <div className={styles.periodBarWrapper}>
                  <div className={styles.periodBar}>
                    {categoryMode === 5 && (dayReport.stats.veryLow ?? 0) > 0 && (
                      <Tooltip content={`Very Low: ${veryLowPct}% (${dayReport.stats.veryLow ?? 0})`} relationship="description">
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
                    {dayReport.stats.low > 0 && (
                      <Tooltip content={`Low: ${lowPct}% (${dayReport.stats.low})`} relationship="description">
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
                    {dayReport.stats.inRange > 0 && (
                      <Tooltip content={`In Range: ${inRangePct}% (${dayReport.stats.inRange})`} relationship="description">
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
                    {dayReport.stats.high > 0 && (
                      <Tooltip content={`High: ${highPct}% (${dayReport.stats.high})`} relationship="description">
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
                    {categoryMode === 5 && (dayReport.stats.veryHigh ?? 0) > 0 && (
                      <Tooltip content={`Very High: ${veryHighPct}% (${dayReport.stats.veryHigh ?? 0})`} relationship="description">
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
      )}
    </div>
  );
}
