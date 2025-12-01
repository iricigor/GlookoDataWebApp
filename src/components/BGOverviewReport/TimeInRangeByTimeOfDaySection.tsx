/**
 * Time in Range by Time of Day Section Component
 * Displays hourly TIR breakdown with stacked bar chart
 */

import { 
  Text,
  Card,
  Tooltip,
  tokens,
} from '@fluentui/react-components';
import { ClockRegular, FilterRegular } from '@fluentui/react-icons';
import type { 
  RangeCategoryMode, 
  AGPDayOfWeekFilter,
  HourlyTIRStats,
} from '../../types';
import { 
  calculatePercentage, 
} from '../../utils/data';
import { useBGOverviewStyles } from './styles';
import { getColorForCategory } from './types';
import type { TIRStats } from './types';

interface TimeInRangeByTimeOfDaySectionProps {
  categoryMode: RangeCategoryMode;
  dayFilter: AGPDayOfWeekFilter;
  hourlyStats: HourlyTIRStats[];
}

export function TimeInRangeByTimeOfDaySection({
  categoryMode,
  dayFilter,
  hourlyStats,
}: TimeInRangeByTimeOfDaySectionProps) {
  const styles = useBGOverviewStyles();

  // Helper function to format tooltip content for hourly TIR
  const formatHourlyTooltipContent = (
    hourLabel: string,
    stats: TIRStats
  ): string => {
    const total = stats.total;
    const lowPct = calculatePercentage(stats.low, total);
    const inRangePct = calculatePercentage(stats.inRange, total);
    const highPct = calculatePercentage(stats.high, total);
    
    if (categoryMode === 5) {
      const veryLowPct = calculatePercentage(stats.veryLow ?? 0, total);
      const veryHighPct = calculatePercentage(stats.veryHigh ?? 0, total);
      return `${hourLabel}\nVery Low: ${veryLowPct}%\nLow: ${lowPct}%\nIn Range: ${inRangePct}%\nHigh: ${highPct}%\nVery High: ${veryHighPct}%\nTotal: ${total}`;
    }
    return `${hourLabel}\nLow: ${lowPct}%\nIn Range: ${inRangePct}%\nHigh: ${highPct}%\nTotal: ${total}`;
  };

  if (hourlyStats.length === 0) {
    return null;
  }

  return (
    <Card className={styles.sectionCard}>
      <Text className={styles.cardTitle}>
        <ClockRegular className={styles.cardIcon} />
        Time in Range by Time of Day
        {dayFilter !== 'All Days' && (
          <Tooltip content={`Filtered by: ${dayFilter}`} relationship="description">
            <FilterRegular className={styles.filterIcon} aria-label="Filter indicator" />
          </Tooltip>
        )}
      </Text>
      <div className={styles.hourlyChartContainer}>
        {/* Hourly stacked bar chart */}
        <div className={styles.hourlyChartRow}>
          {hourlyStats.map((hourData) => {
            const total = hourData.stats.total;
            if (total === 0) {
              return (
                <Tooltip 
                  key={hourData.hour} 
                  content={`${hourData.hourLabel}: No data`} 
                  relationship="description"
                >
                  <div className={styles.hourlyBar} style={{ backgroundColor: tokens.colorNeutralBackground3 }} />
                </Tooltip>
              );
            }
            
            const veryLowPct = categoryMode === 5 ? calculatePercentage(hourData.stats.veryLow ?? 0, total) : 0;
            const lowPct = calculatePercentage(hourData.stats.low, total);
            const inRangePct = calculatePercentage(hourData.stats.inRange, total);
            const highPct = calculatePercentage(hourData.stats.high, total);
            const veryHighPct = categoryMode === 5 ? calculatePercentage(hourData.stats.veryHigh ?? 0, total) : 0;
            
            const tooltipContent = formatHourlyTooltipContent(hourData.hourLabel, hourData.stats);
            
            return (
              <Tooltip key={hourData.hour} content={tooltipContent} relationship="description">
                <div className={styles.hourlyBar}>
                  {/* Render order: veryHigh (top) → high → inRange → low → veryLow (bottom) */}
                  {categoryMode === 5 && veryHighPct > 0 && (
                    <div
                      className={styles.hourlySegment}
                      style={{
                        height: `${veryHighPct}%`,
                        backgroundColor: getColorForCategory('veryHigh'),
                      }}
                    />
                  )}
                  {highPct > 0 && (
                    <div
                      className={styles.hourlySegment}
                      style={{
                        height: `${highPct}%`,
                        backgroundColor: getColorForCategory('high'),
                      }}
                    />
                  )}
                  {inRangePct > 0 && (
                    <div
                      className={styles.hourlySegment}
                      style={{
                        height: `${inRangePct}%`,
                        backgroundColor: getColorForCategory('inRange'),
                      }}
                    />
                  )}
                  {lowPct > 0 && (
                    <div
                      className={styles.hourlySegment}
                      style={{
                        height: `${lowPct}%`,
                        backgroundColor: getColorForCategory('low'),
                      }}
                    />
                  )}
                  {categoryMode === 5 && veryLowPct > 0 && (
                    <div
                      className={styles.hourlySegment}
                      style={{
                        height: `${veryLowPct}%`,
                        backgroundColor: getColorForCategory('veryLow'),
                      }}
                    />
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
        {/* Hour labels */}
        <div className={styles.hourlyLabels}>
          {hourlyStats.map((hourData) => (
            <Text key={hourData.hour} className={styles.hourlyLabel}>
              {hourData.hour.toString().padStart(2, '0')}
            </Text>
          ))}
        </div>
        <Text className={styles.chartDescription}>
          Visualize hourly glucose patterns to identify trends and optimize management strategies.
        </Text>
      </div>
    </Card>
  );
}
