/**
 * Risk Assessment Card Component
 * Displays LBGI, HBGI, BGRI, and J-Index risk metrics
 */

import { 
  Text,
  Card,
  Tooltip,
} from '@fluentui/react-components';
import { ShieldRegular } from '@fluentui/react-icons';
import { useBGOverviewStyles } from './styles';
import type { RiskStats } from './types';
import { 
  LBGI_THRESHOLDS, 
  HBGI_THRESHOLDS, 
  JINDEX_THRESHOLDS,
  getLBGIInterpretation,
  getHBGIInterpretation,
  getJIndexInterpretation,
} from './types';

interface RiskAssessmentCardProps {
  riskStats: RiskStats;
}

export function RiskAssessmentCard({ riskStats }: RiskAssessmentCardProps) {
  const styles = useBGOverviewStyles();

  // Don't render if no risk data available
  if (riskStats.lbgi === null && riskStats.hbgi === null && riskStats.jIndex === null) {
    return null;
  }

  const getRiskStyleClass = (level: 'low' | 'moderate' | 'high'): string => {
    switch (level) {
      case 'low': return styles.riskLow;
      case 'moderate': return styles.riskModerate;
      case 'high': return styles.riskHigh;
    }
  };

  return (
    <Card className={styles.riskCard}>
      <Text className={styles.cardTitle}>
        <ShieldRegular className={styles.cardIcon} />
        Risk Assessment
      </Text>
      
      <div className={styles.riskGrid}>
        {riskStats.lbgi !== null && (
          <Tooltip 
            content="Low Blood Glucose Index (LBGI) - Predicts hypoglycemia risk based on glucose variability in the low range"
            relationship="description"
          >
            <div className={styles.riskItem}>
              <Text className={styles.riskLabel}>LBGI (Hypo Risk)</Text>
              <Text className={styles.riskValue}>{riskStats.lbgi.toFixed(1)}</Text>
              <Text className={`${styles.riskInterpretation} ${getRiskStyleClass(getLBGIInterpretation(riskStats.lbgi).level)}`}>
                {getLBGIInterpretation(riskStats.lbgi).text}
              </Text>
            </div>
          </Tooltip>
        )}
        
        {riskStats.hbgi !== null && (
          <Tooltip 
            content="High Blood Glucose Index (HBGI) - Predicts hyperglycemia risk and correlates with HbA1c"
            relationship="description"
          >
            <div className={styles.riskItem}>
              <Text className={styles.riskLabel}>HBGI (Hyper Risk)</Text>
              <Text className={styles.riskValue}>{riskStats.hbgi.toFixed(1)}</Text>
              <Text className={`${styles.riskInterpretation} ${getRiskStyleClass(getHBGIInterpretation(riskStats.hbgi).level)}`}>
                {getHBGIInterpretation(riskStats.hbgi).text}
              </Text>
            </div>
          </Tooltip>
        )}
        
        {riskStats.bgri !== null && (
          <Tooltip 
            content="Blood Glucose Risk Index (BGRI) - Combined overall glycemic risk (LBGI + HBGI)"
            relationship="description"
          >
            <div className={styles.riskItem}>
              <Text className={styles.riskLabel}>BGRI (Overall)</Text>
              <Text className={styles.riskValue}>{riskStats.bgri.toFixed(1)}</Text>
            </div>
          </Tooltip>
        )}
        
        {riskStats.jIndex !== null && (
          <Tooltip 
            content="J-Index combines mean glucose and variability into a single metric. Lower values indicate better control."
            relationship="description"
          >
            <div className={styles.riskItem}>
              <Text className={styles.riskLabel}>J-Index</Text>
              <Text className={styles.riskValue}>{riskStats.jIndex.toFixed(1)}</Text>
              <Text className={`${styles.riskInterpretation} ${getRiskStyleClass(getJIndexInterpretation(riskStats.jIndex).level)}`}>
                {getJIndexInterpretation(riskStats.jIndex).text}
              </Text>
            </div>
          </Tooltip>
        )}
      </div>
      
      <div className={styles.riskDescription}>
        <strong>Risk Thresholds:</strong> LBGI (&lt;{LBGI_THRESHOLDS.low} low, {LBGI_THRESHOLDS.low}-{LBGI_THRESHOLDS.moderate} moderate, &gt;{LBGI_THRESHOLDS.moderate} high) | 
        HBGI (&lt;{HBGI_THRESHOLDS.low} low, {HBGI_THRESHOLDS.low}-{HBGI_THRESHOLDS.moderate} moderate, &gt;{HBGI_THRESHOLDS.moderate} high) | 
        J-Index (&lt;{JINDEX_THRESHOLDS.excellent} excellent, {JINDEX_THRESHOLDS.excellent}-{JINDEX_THRESHOLDS.good} good, {JINDEX_THRESHOLDS.good}-{JINDEX_THRESHOLDS.fair} fair, &gt;{JINDEX_THRESHOLDS.fair} poor)
      </div>
    </Card>
  );
}
