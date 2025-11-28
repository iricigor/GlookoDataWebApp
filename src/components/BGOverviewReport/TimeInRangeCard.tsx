/**
 * Time in Range Card Component
 * Displays the TIR bar chart and statistics
 */

import { 
  Text,
  Card,
  Tooltip,
} from '@fluentui/react-components';
import { CheckmarkCircleRegular } from '@fluentui/react-icons';
import type { RangeCategoryMode } from '../../types';
import { calculatePercentage, GLUCOSE_RANGE_COLORS } from '../../utils/data';
import { useBGOverviewStyles } from './styles';
import type { TIRStats } from './types';

interface TimeInRangeCardProps {
  tirStats: TIRStats;
  categoryMode: RangeCategoryMode;
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

export function TimeInRangeCard({ tirStats, categoryMode }: TimeInRangeCardProps) {
  const styles = useBGOverviewStyles();

  return (
    <Card className={styles.tirCard}>
      <Text className={styles.cardTitle}>
        <CheckmarkCircleRegular className={styles.cardIcon} />
        Time in Range
      </Text>

      <div className={styles.tirBarContainer}>
        <div className={styles.tirBar}>
          {categoryMode === 5 && (tirStats.veryLow ?? 0) > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`,
                backgroundColor: getColorForCategory('veryLow'),
              }}
              title={`Very Low: ${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`}
            </div>
          )}
          {tirStats.low > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.low, tirStats.total)}%`,
                backgroundColor: getColorForCategory('low'),
              }}
              title={`Low: ${calculatePercentage(tirStats.low, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.low, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.low, tirStats.total)}%`}
            </div>
          )}
          {tirStats.inRange > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.inRange, tirStats.total)}%`,
                backgroundColor: getColorForCategory('inRange'),
              }}
              title={`In Range: ${calculatePercentage(tirStats.inRange, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.inRange, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.inRange, tirStats.total)}%`}
            </div>
          )}
          {tirStats.high > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.high, tirStats.total)}%`,
                backgroundColor: getColorForCategory('high'),
              }}
              title={`High: ${calculatePercentage(tirStats.high, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.high, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.high, tirStats.total)}%`}
            </div>
          )}
          {categoryMode === 5 && (tirStats.veryHigh ?? 0) > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`,
                backgroundColor: getColorForCategory('veryHigh'),
              }}
              title={`Very High: ${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`}
            </div>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {categoryMode === 5 && (
          <Tooltip content={`${tirStats.veryLow ?? 0} readings`} relationship="description" positioning="below">
            <div className={styles.statCard}>
              <Text className={styles.statLabel}>Very Low</Text>
              <Text className={styles.statValue} style={{ color: getColorForCategory('veryLow') }}>
                {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%
              </Text>
            </div>
          </Tooltip>
        )}
        <Tooltip content={`${tirStats.low} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>Low</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('low') }}>
              {calculatePercentage(tirStats.low, tirStats.total)}%
            </Text>
          </div>
        </Tooltip>
        <Tooltip content={`${tirStats.inRange} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>In Range</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('inRange') }}>
              {calculatePercentage(tirStats.inRange, tirStats.total)}%
            </Text>
          </div>
        </Tooltip>
        <Tooltip content={`${tirStats.high} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>High</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('high') }}>
              {calculatePercentage(tirStats.high, tirStats.total)}%
            </Text>
          </div>
        </Tooltip>
        {categoryMode === 5 && (
          <Tooltip content={`${tirStats.veryHigh ?? 0} readings`} relationship="description" positioning="below">
            <div className={styles.statCard}>
              <Text className={styles.statLabel}>Very High</Text>
              <Text className={styles.statValue} style={{ color: getColorForCategory('veryHigh') }}>
                {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%
              </Text>
            </div>
          </Tooltip>
        )}
      </div>

      <div className={styles.targetInfo}>
        <strong>Target:</strong> 70% Time in Range (TIR) is generally considered a good target for glucose management
      </div>
    </Card>
  );
}
