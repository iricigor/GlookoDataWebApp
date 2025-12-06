/**
 * HbA1c Estimate Card Component
 * Displays estimated HbA1c based on glucose data
 */

import { 
  Text,
  Card,
  Tooltip,
  tokens,
} from '@fluentui/react-components';
import { HeartPulseRegular, WarningRegular } from '@fluentui/react-icons';
import type { GlucoseUnit } from '../../types';
import { 
  displayGlucoseValue, 
  getUnitLabel, 
  convertHbA1cToMmolMol, 
  MIN_DAYS_FOR_RELIABLE_HBA1C,
  CV_TARGET_THRESHOLD,
} from '../../utils/data';
import { formatNumber } from '../../utils/formatting/formatters';
import { useBGOverviewStyles } from './styles';
import type { HbA1cStats } from './types';

interface HbA1cEstimateCardProps {
  hba1cStats: HbA1cStats;
  glucoseUnit: GlucoseUnit;
}

export function HbA1cEstimateCard({ hba1cStats, glucoseUnit }: HbA1cEstimateCardProps) {
  const styles = useBGOverviewStyles();

  if (hba1cStats.hba1c === null) {
    return null;
  }

  return (
    <Card className={styles.hba1cCard}>
      <Text className={styles.cardTitle}>
        <HeartPulseRegular className={styles.cardIcon} />
        Estimated HbA1c
      </Text>
      
      <div className={styles.hba1cMainRow}>
        <div className={styles.hba1cValueSection}>
          <Text className={styles.hba1cValue}>
            {formatNumber(hba1cStats.hba1c, 1)}%
          </Text>
          <Text className={styles.hba1cMmolMol}>
            ({Math.round(convertHbA1cToMmolMol(hba1cStats.hba1c))} mmol/mol)
          </Text>
        </div>
        
        <div className={styles.hba1cDetails}>
          <div className={styles.hba1cDetailItem}>
            <Text className={styles.hba1cDetailLabel}>Avg Glucose</Text>
            <Text className={styles.hba1cDetailValue}>
              {hba1cStats.averageGlucose !== null 
                ? displayGlucoseValue(hba1cStats.averageGlucose, glucoseUnit) 
                : '-'} {getUnitLabel(glucoseUnit)}
            </Text>
          </div>
          <Tooltip 
            content={`CV% (Coefficient of Variation) measures glucose variability. Target: ≤${CV_TARGET_THRESHOLD}% for stable control`}
            relationship="description"
          >
            <div className={styles.hba1cDetailItem}>
              <Text className={styles.hba1cDetailLabel}>CV%</Text>
              <Text 
                className={styles.hba1cDetailValue}
                style={{ 
                  color: hba1cStats.cv !== null && hba1cStats.cv > CV_TARGET_THRESHOLD 
                    ? tokens.colorStatusDangerForeground1 
                    : tokens.colorStatusSuccessForeground1 
                }}
              >
                {hba1cStats.cv !== null ? `${formatNumber(hba1cStats.cv, 1)}%` : '-'}
              </Text>
            </div>
          </Tooltip>
          <div className={styles.hba1cDetailItem}>
            <Text className={styles.hba1cDetailLabel}>Days</Text>
            <Text className={styles.hba1cDetailValue}>{hba1cStats.daysWithData}</Text>
          </div>
        </div>
      </div>

      {hba1cStats.daysWithData < MIN_DAYS_FOR_RELIABLE_HBA1C && (
        <div className={styles.hba1cWarning}>
          <WarningRegular className={styles.hba1cWarningIcon} />
          <Text>
            Based on {hba1cStats.daysWithData} days of data. At least {MIN_DAYS_FOR_RELIABLE_HBA1C} days recommended for reliable estimate.
          </Text>
        </div>
      )}
    </Card>
  );
}
