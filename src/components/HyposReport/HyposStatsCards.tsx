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
  ShieldRegular,
} from '@fluentui/react-icons';
import { displayGlucoseValue, getUnitLabel, formatHypoDuration } from '../../utils/data';
import { useHyposStyles } from './styles';
import type { HyposStatsCardsProps } from './types';
import { getLBGIInterpretation, LBGI_THRESHOLDS } from './types';

export function HyposStatsCards({ hypoStats, thresholds, glucoseUnit, lbgi }: HyposStatsCardsProps) {
  const styles = useHyposStyles();

  if (!hypoStats) return null;

  // Calculate LBGI interpretation once to avoid redundant function calls
  const lbgiInterpretation = lbgi !== null ? getLBGIInterpretation(lbgi) : null;

  // Helper function to get risk style class based on level
  const getRiskStyleClass = (level: 'low' | 'moderate' | 'high'): string => {
    switch (level) {
      case 'low': return styles.riskLow;
      case 'moderate': return styles.riskModerate;
      case 'high': return styles.riskHigh;
    }
  };

  // Helper function to get card border style based on LBGI risk level
  const getLBGICardStyle = (): string => {
    if (!lbgiInterpretation) return styles.summaryCardSuccess;
    switch (lbgiInterpretation.level) {
      case 'low': return styles.summaryCardSuccess;
      case 'moderate': return styles.summaryCardWarning;
      case 'high': return styles.summaryCardDanger;
    }
  };

  // Helper function to get icon style based on LBGI risk level
  const getLBGIIconStyle = (): string => {
    if (!lbgiInterpretation) return styles.summaryIconSuccess;
    switch (lbgiInterpretation.level) {
      case 'low': return styles.summaryIconSuccess;
      case 'moderate': return styles.summaryIconWarning;
      case 'high': return styles.summaryIconDanger;
    }
  };

  // LBGI Card component (used in both states)
  const renderLBGICard = () => (
    <Tooltip 
      content={`Low Blood Glucose Index (LBGI) - Predicts hypoglycemia risk. Thresholds: <${LBGI_THRESHOLDS.low} low, ${LBGI_THRESHOLDS.low}-${LBGI_THRESHOLDS.moderate} moderate, >${LBGI_THRESHOLDS.moderate} high`}
      relationship="description"
    >
      <Card className={mergeClasses(styles.summaryCard, getLBGICardStyle())}>
        <ShieldRegular className={mergeClasses(styles.summaryIcon, getLBGIIconStyle())} />
        <div className={styles.summaryContent}>
          <Text className={styles.summaryLabel}>LBGI (Hypo Risk)</Text>
          <div className={styles.summaryValueRow}>
            <Text className={styles.summaryValue}>
              {lbgi !== null ? lbgi.toFixed(1) : 'N/A'}
            </Text>
          </div>
          {lbgiInterpretation && (
            <Text className={mergeClasses(styles.riskInterpretation, getRiskStyleClass(lbgiInterpretation.level))}>
              {lbgiInterpretation.text}
            </Text>
          )}
        </div>
      </Card>
    </Tooltip>
  );

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

        {/* LBGI Card */}
        {renderLBGICard()}
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

      {/* LBGI Card */}
      {renderLBGICard()}
    </div>
  );
}
