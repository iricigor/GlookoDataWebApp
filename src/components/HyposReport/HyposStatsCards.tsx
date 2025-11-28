/**
 * HyposStatsCards component
 * Displays summary statistics cards for hypoglycemia data
 */

import {
  Text,
  Card,
  Tooltip,
  mergeClasses,
} from '@fluentui/react-components';
import {
  WarningRegular,
  HeartPulseWarningRegular,
  ArrowTrendingDownRegular,
  TimerRegular,
  ClockRegular,
} from '@fluentui/react-icons';
import { displayGlucoseValue, getUnitLabel, formatHypoDuration } from '../../utils/data';
import { useHyposStyles } from './styles';
import type { HyposStatsCardsProps } from './types';

export function HyposStatsCards({ hypoStats, thresholds, glucoseUnit }: HyposStatsCardsProps) {
  const styles = useHyposStyles();

  if (!hypoStats) return null;

  // No hypos - show success state
  if (hypoStats.totalCount === 0) {
    return (
      <div className={styles.summarySection}>
        <Tooltip content="No hypoglycemic events detected today" relationship="description">
          <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
            <HeartPulseWarningRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
            <div className={styles.summaryContent}>
              <Text className={styles.summaryLabel}>Severe Hypos</Text>
              <div className={styles.summaryValueRow}>
                <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSuccess)}>0</Text>
              </div>
            </div>
          </Card>
        </Tooltip>
        
        <Tooltip content="No hypoglycemic events detected today" relationship="description">
          <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
            <WarningRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
            <div className={styles.summaryContent}>
              <Text className={styles.summaryLabel}>Non-Severe Hypos</Text>
              <div className={styles.summaryValueRow}>
                <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSuccess)}>0</Text>
              </div>
            </div>
          </Card>
        </Tooltip>
        
        <Tooltip content="No hypoglycemic events - great control!" relationship="description">
          <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
            <ArrowTrendingDownRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
            <div className={styles.summaryContent}>
              <Text className={styles.summaryLabel}>Lowest Hypo Value</Text>
              <div className={styles.summaryValueRow}>
                <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSuccess)}>N/A</Text>
              </div>
            </div>
          </Card>
        </Tooltip>
        
        {/* Longest Hypo Duration */}
        <Tooltip content="No hypoglycemic events - great control!" relationship="description">
          <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
            <TimerRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
            <div className={styles.summaryContent}>
              <Text className={styles.summaryLabel}>Longest Hypo</Text>
              <div className={styles.summaryValueRow}>
                <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSuccess)}>0m</Text>
              </div>
            </div>
          </Card>
        </Tooltip>
        
        {/* Total Hypo Time - use smiley as the value */}
        <Tooltip content="No time spent in hypoglycemia" relationship="description">
          <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
            <ClockRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
            <div className={styles.summaryContent}>
              <Text className={styles.summaryLabel}>Total Hypo Time</Text>
              <div className={styles.summaryValueRow}>
                <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSmiley)}>😊</Text>
              </div>
            </div>
          </Card>
        </Tooltip>
      </div>
    );
  }

  // Has hypos - show warning/danger states
  return (
    <div className={styles.summarySection}>
      {/* Severe Hypos Count */}
      <Tooltip content="Number of hypoglycemic events below very low threshold" relationship="description">
        <Card className={mergeClasses(
          styles.summaryCard, 
          hypoStats.severeCount > 0 ? styles.summaryCardDanger : styles.summaryCardSuccess
        )}>
          <HeartPulseWarningRegular className={mergeClasses(
            styles.summaryIcon,
            hypoStats.severeCount > 0 ? styles.summaryIconDanger : styles.summaryIconSuccess
          )} />
          <div className={styles.summaryContent}>
            <Text className={styles.summaryLabel}>Severe Hypos</Text>
            <div className={styles.summaryValueRow}>
              <Text className={styles.summaryValue}>{hypoStats.severeCount}</Text>
            </div>
          </div>
        </Card>
      </Tooltip>
      
      {/* Non-Severe Hypos Count */}
      <Tooltip content="Number of hypoglycemic events below low threshold but above very low" relationship="description">
        <Card className={mergeClasses(
          styles.summaryCard,
          hypoStats.nonSevereCount > 0 ? styles.summaryCardWarning : styles.summaryCardSuccess
        )}>
          <WarningRegular className={mergeClasses(
            styles.summaryIcon,
            hypoStats.nonSevereCount > 0 ? styles.summaryIconWarning : styles.summaryIconSuccess
          )} />
          <div className={styles.summaryContent}>
            <Text className={styles.summaryLabel}>Non-Severe Hypos</Text>
            <div className={styles.summaryValueRow}>
              <Text className={styles.summaryValue}>{hypoStats.nonSevereCount}</Text>
            </div>
          </div>
        </Card>
      </Tooltip>
      
      {/* Lowest Hypo Value */}
      <Tooltip content="Lowest glucose reading during a hypoglycemic event" relationship="description">
        <Card className={mergeClasses(
          styles.summaryCard,
          hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
            ? styles.summaryCardDanger 
            : styles.summaryCardWarning
        )}>
          <ArrowTrendingDownRegular className={mergeClasses(
            styles.summaryIcon,
            hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
              ? styles.summaryIconDanger 
              : styles.summaryIconWarning
          )} />
          <div className={styles.summaryContent}>
            <Text className={styles.summaryLabel}>Lowest Hypo Value</Text>
            <div className={styles.summaryValueRow}>
              <Text className={styles.summaryValue}>
                {hypoStats.lowestValue !== null 
                  ? displayGlucoseValue(hypoStats.lowestValue, glucoseUnit)
                  : 'N/A'}
              </Text>
              {hypoStats.lowestValue !== null && (
                <Text className={styles.summaryUnit}>{getUnitLabel(glucoseUnit)}</Text>
              )}
            </div>
          </div>
        </Card>
      </Tooltip>
      
      {/* Longest Hypo Duration */}
      <Tooltip content="Duration of the longest hypoglycemic event" relationship="description">
        <Card className={mergeClasses(styles.summaryCard, styles.summaryCardWarning)}>
          <TimerRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconWarning)} />
          <div className={styles.summaryContent}>
            <Text className={styles.summaryLabel}>Longest Hypo</Text>
            <div className={styles.summaryValueRow}>
              <Text className={styles.summaryValue}>
                {formatHypoDuration(hypoStats.longestDurationMinutes)}
              </Text>
            </div>
          </div>
        </Card>
      </Tooltip>
      
      {/* Total Hypo Duration */}
      <Tooltip content="Total time spent in hypoglycemia during the day" relationship="description">
        <Card className={mergeClasses(styles.summaryCard, styles.summaryCardWarning)}>
          <ClockRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconWarning)} />
          <div className={styles.summaryContent}>
            <Text className={styles.summaryLabel}>Total Hypo Time</Text>
            <div className={styles.summaryValueRow}>
              <Text className={styles.summaryValue}>
                {formatHypoDuration(hypoStats.totalDurationMinutes)}
              </Text>
            </div>
          </div>
        </Card>
      </Tooltip>
    </div>
  );
}
