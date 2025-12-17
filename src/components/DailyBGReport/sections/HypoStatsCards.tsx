/**
 * Hypoglycemia Statistics Cards Component
 * Displays 6 summary stat cards for hypoglycemia analysis
 */

import {
  Text,
  Card,
  Tooltip as FluentTooltip,
  mergeClasses,
} from '@fluentui/react-components';
import {
  WarningRegular,
  HeartPulseWarningRegular,
  ArrowTrendingDownRegular,
  ClockRegular,
  TimerRegular,
  ShieldRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import type { GlucoseUnit, GlucoseThresholds } from '../../../types';
import type { HypoStats } from '../../../utils/data/hypoDataUtils';
import { 
  displayGlucoseValue, 
  getUnitLabel, 
  formatHypoDuration,
} from '../../../utils/data';
import { formatNumber } from '../../../utils/formatting/formatters';
import { LBGI_THRESHOLDS, getLBGIInterpretation } from '../../HyposReport/types';
import type { useStyles } from '../styles';

interface HypoStatsCardsProps {
  styles: ReturnType<typeof useStyles>;
  glucoseUnit: GlucoseUnit;
  thresholds: GlucoseThresholds;
  hypoStats: HypoStats;
  lbgi: number | null;
}

/**
 * Renders six hypoglycemia statistic cards with contextual styling and explanatory tooltips.
 *
 * @param styles - CSS-in-JS classes produced by the component's useStyles hook
 * @param glucoseUnit - Current glucose unit used for value formatting
 * @param thresholds - Glucose threshold values (includes `veryLow`)
 * @param hypoStats - Hypoglycemia statistics (severeCount, nonSevereCount, lowestValue, longestDurationMinutes, totalDurationMinutes)
 * @param lbgi - Low Blood Glucose Index value or `null`
 * @returns A JSX element containing the row of styled statistic cards
 */
export function HypoStatsCards({
  styles,
  glucoseUnit,
  thresholds,
  hypoStats,
  lbgi,
}: HypoStatsCardsProps) {
  const { t } = useTranslation('reports');
  
  // Get LBGI risk interpretation
  const lbgiInterpretation = lbgi !== null ? getLBGIInterpretation(lbgi) : null;
  
  return (
    <div className={styles.statsRow}>
      <FluentTooltip content={t('dailyBG.hypoAnalysis.stats.severeTooltip')} relationship="description">
        <Card className={mergeClasses(
          styles.statCard,
          hypoStats.severeCount > 0 ? styles.statCardDanger : styles.statCardSuccess
        )}>
          <HeartPulseWarningRegular className={mergeClasses(
            styles.statIcon,
            hypoStats.severeCount > 0 ? styles.statIconDanger : styles.statIconSuccess
          )} />
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>{t('dailyBG.hypoAnalysis.stats.severe')}</Text>
            <div className={styles.statValueRow}>
              <Text className={styles.statValue}>{hypoStats.severeCount}</Text>
            </div>
          </div>
        </Card>
      </FluentTooltip>
      
      <FluentTooltip content={t('dailyBG.hypoAnalysis.stats.nonSevereTooltip')} relationship="description">
        <Card className={mergeClasses(
          styles.statCard,
          hypoStats.nonSevereCount > 0 ? styles.statCardWarning : styles.statCardSuccess
        )}>
          <WarningRegular className={mergeClasses(
            styles.statIcon,
            hypoStats.nonSevereCount > 0 ? styles.statIconWarning : styles.statIconSuccess
          )} />
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>{t('dailyBG.hypoAnalysis.stats.nonSevere')}</Text>
            <div className={styles.statValueRow}>
              <Text className={styles.statValue}>{hypoStats.nonSevereCount}</Text>
            </div>
          </div>
        </Card>
      </FluentTooltip>
      
      <FluentTooltip content={t('dailyBG.hypoAnalysis.stats.lowestTooltip')} relationship="description">
        <Card className={mergeClasses(
          styles.statCard,
          hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
            ? styles.statCardDanger 
            : hypoStats.lowestValue !== null ? styles.statCardWarning : styles.statCardSuccess
        )}>
          <ArrowTrendingDownRegular className={mergeClasses(
            styles.statIcon,
            hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
              ? styles.statIconDanger 
              : hypoStats.lowestValue !== null ? styles.statIconWarning : styles.statIconSuccess
          )} />
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>{t('dailyBG.hypoAnalysis.stats.lowest')}</Text>
            <div className={styles.statValueRow}>
              <Text className={styles.statValue}>
                {hypoStats.lowestValue !== null 
                  ? displayGlucoseValue(hypoStats.lowestValue, glucoseUnit)
                  : 'N/A'
                }
              </Text>
              <Text className={styles.statUnit}>{getUnitLabel(glucoseUnit)}</Text>
            </div>
          </div>
        </Card>
      </FluentTooltip>
      
      <FluentTooltip content={t('dailyBG.hypoAnalysis.stats.longestTooltip')} relationship="description">
        <Card className={mergeClasses(
          styles.statCard,
          hypoStats.longestDurationMinutes > 0 ? styles.statCardWarning : styles.statCardSuccess
        )}>
          <TimerRegular className={mergeClasses(
            styles.statIcon,
            hypoStats.longestDurationMinutes > 0 ? styles.statIconWarning : styles.statIconSuccess
          )} />
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>{t('dailyBG.hypoAnalysis.stats.longest')}</Text>
            <div className={styles.statValueRow}>
              <Text className={styles.statValue}>
                {formatHypoDuration(hypoStats.longestDurationMinutes)}
              </Text>
            </div>
          </div>
        </Card>
      </FluentTooltip>
      
      <FluentTooltip content={t('dailyBG.hypoAnalysis.stats.totalTimeTooltip')} relationship="description">
        <Card className={mergeClasses(
          styles.statCard,
          hypoStats.totalDurationMinutes > 0 ? styles.statCardWarning : styles.statCardSuccess
        )}>
          <ClockRegular className={mergeClasses(
            styles.statIcon,
            hypoStats.totalDurationMinutes > 0 ? styles.statIconWarning : styles.statIconSuccess
          )} />
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>{t('dailyBG.hypoAnalysis.stats.totalTime')}</Text>
            <div className={styles.statValueRow}>
              <Text className={styles.statValue}>
                {hypoStats.totalDurationMinutes > 0 ? formatHypoDuration(hypoStats.totalDurationMinutes) : '😊'}
              </Text>
            </div>
          </div>
        </Card>
      </FluentTooltip>
      
      <FluentTooltip 
        content={t('dailyBG.hypoAnalysis.stats.lbgiTooltip', { 
          low: LBGI_THRESHOLDS.low, 
          moderate: LBGI_THRESHOLDS.moderate 
        })}
        relationship="description"
      >
        <Card className={mergeClasses(
          styles.statCard,
          lbgiInterpretation?.level === 'high' ? styles.statCardDanger :
          lbgiInterpretation?.level === 'moderate' ? styles.statCardWarning : styles.statCardSuccess
        )}>
          <ShieldRegular className={mergeClasses(
            styles.statIcon,
            lbgiInterpretation?.level === 'high' ? styles.statIconDanger :
            lbgiInterpretation?.level === 'moderate' ? styles.statIconWarning : styles.statIconSuccess
          )} />
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>{t('dailyBG.hypoAnalysis.stats.lbgi')}</Text>
            <div className={styles.statValueRow}>
              <Text className={styles.statValue}>
                {lbgi !== null ? formatNumber(lbgi, 1) : 'N/A'}
              </Text>
            </div>
          </div>
        </Card>
      </FluentTooltip>
    </div>
  );
}