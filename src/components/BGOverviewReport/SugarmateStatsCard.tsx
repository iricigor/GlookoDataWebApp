/**
 * Sugarmate Stats Card Component
 * Displays additional glucose statistics inspired by Sugarmate app
 * with visual representations
 */

import { 
  Text,
  Card,
  Tooltip,
  tokens,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import { 
  DataTrendingRegular,
  SparkleRegular,
  WeatherSunnyRegular,
  WeatherMoonRegular,
} from '@fluentui/react-icons';
import type { GlucoseUnit } from '../../types';
import { 
  displayGlucoseValue, 
  getUnitLabel,
  FLUX_GRADE_COLORS,
} from '../../utils/data';
import type { 
  QuartileStats, 
  HighLowIncidents, 
  FluxResult 
} from '../../utils/data/glucoseRangeUtils';

/** Fixed box height for consistent sizing */
const BOX_HEIGHT = '120px';

const useStyles = makeStyles({
  card: {
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow16,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  cardIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap('16px'),
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  statSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    height: BOX_HEIGHT,
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    marginBottom: '8px',
  },
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  // Quartile Gaussian curve styles
  gaussianContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    width: '100%',
  },
  gaussianSvg: {
    width: '100%',
    height: '50px',
  },
  quartileLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '4px',
    paddingLeft: '8px',
    paddingRight: '8px',
  },
  quartileValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: 'center',
  },
  quartileMedianValue: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  // High/Low circular indicator styles
  circularIndicator: {
    position: 'relative',
    width: '70px',
    height: '70px',
  },
  circularRing: {
    width: '100%',
    height: '100%',
  },
  circularValues: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: '1.1',
  },
  highValue: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  dividerLine: {
    width: '20px',
    height: '1px',
    backgroundColor: tokens.colorNeutralForeground3,
    marginTop: '2px',
    marginBottom: '2px',
  },
  lowValue: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  // Flux grade styles
  fluxContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('12px'),
    flexGrow: 1,
  },
  fluxGrade: {
    width: '50px',
    height: '50px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: 'white',
    flexShrink: 0,
  },
  fluxInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  fluxDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  fluxScore: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  // Unicorn styles
  unicornContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('8px'),
    flexGrow: 1,
  },
  unicornCount: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  unicornLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  // Time average styles (bedtime/wakeup)
  timeAverageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('10px'),
    flexGrow: 1,
  },
  timeAverageIcon: {
    fontSize: '28px',
  },
  timeAverageValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  timeAverageUnit: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  // Summary stats row
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-around',
    ...shorthands.padding('12px'),
    marginTop: '16px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
});

interface SugarmateStatsCardProps {
  glucoseUnit: GlucoseUnit;
  // Stats data
  averageGlucose: number | null;
  medianGlucose: number | null;
  standardDeviation: number | null;
  quartiles: QuartileStats | null;
  incidents: HighLowIncidents;
  flux: FluxResult | null;
  unicornCount: number;
  // Time-based averages
  wakeupAverage: number | null;
  bedtimeAverage: number | null;
}

/** Get color for flux grade */
function getFluxGradeColor(grade: string): string {
  if (grade in FLUX_GRADE_COLORS) {
    return FLUX_GRADE_COLORS[grade as keyof typeof FLUX_GRADE_COLORS];
  }
  return tokens.colorNeutralForeground1;
}

/** SVG Gaussian curve component for quartiles */
function GaussianCurve({ q25, q50, q75, glucoseUnit }: { q25: number; q50: number; q75: number; glucoseUnit: GlucoseUnit }) {
  // Simple bell curve path - static shape, values are positioned at 25%, 50%, 75%
  const curveColor = tokens.colorNeutralForeground3;
  const markerColor = tokens.colorBrandForeground1;
  
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '50px' }}>
      {/* Gaussian curve shape */}
      <path
        d="M 0,40 Q 15,38 25,25 Q 35,12 50,8 Q 65,12 75,25 Q 85,38 100,40"
        fill="none"
        stroke={curveColor}
        strokeWidth="2"
      />
      {/* Shaded area under curve */}
      <path
        d="M 0,40 Q 15,38 25,25 Q 35,12 50,8 Q 65,12 75,25 Q 85,38 100,40 L 100,40 L 0,40 Z"
        fill={curveColor}
        fillOpacity="0.15"
      />
      {/* Q25 marker line */}
      <line x1="25" y1="25" x2="25" y2="40" stroke={markerColor} strokeWidth="1.5" strokeDasharray="2,2" />
      {/* Q50 (median) marker line - thicker */}
      <line x1="50" y1="8" x2="50" y2="40" stroke={markerColor} strokeWidth="2" />
      {/* Q75 marker line */}
      <line x1="75" y1="25" x2="75" y2="40" stroke={markerColor} strokeWidth="1.5" strokeDasharray="2,2" />
      {/* Q25 value */}
      <text x="25" y="38" textAnchor="middle" fontSize="8" fill={curveColor}>
        {displayGlucoseValue(q25, glucoseUnit)}
      </text>
      {/* Q50 value - emphasized */}
      <text x="50" y="6" textAnchor="middle" fontSize="10" fontWeight="bold" fill={markerColor}>
        {displayGlucoseValue(q50, glucoseUnit)}
      </text>
      {/* Q75 value */}
      <text x="75" y="38" textAnchor="middle" fontSize="8" fill={curveColor}>
        {displayGlucoseValue(q75, glucoseUnit)}
      </text>
    </svg>
  );
}

/** Circular progress ring for high/low incidents */
function HighLowRing({ highs, lows }: { highs: number; lows: number }) {
  const total = highs + lows;
  const highRatio = total > 0 ? highs / total : 0.5;
  
  // SVG circle parameters
  const size = 70;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash for the high portion
  const highDash = circumference * highRatio;
  const lowDash = circumference * (1 - highRatio);
  
  const highColor = '#FFB300'; // Amber
  const lowColor = '#D32F2F'; // Red
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={tokens.colorNeutralBackground3}
        strokeWidth={strokeWidth}
      />
      {/* Low portion (bottom) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={lowColor}
        strokeWidth={strokeWidth}
        strokeDasharray={`${lowDash} ${circumference}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* High portion (top) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={highColor}
        strokeWidth={strokeWidth}
        strokeDasharray={`${highDash} ${circumference}`}
        strokeDashoffset={-lowDash}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function SugarmateStatsCard({
  glucoseUnit,
  averageGlucose,
  medianGlucose,
  standardDeviation,
  quartiles,
  incidents,
  flux,
  unicornCount,
  wakeupAverage,
  bedtimeAverage,
}: SugarmateStatsCardProps) {
  const styles = useStyles();
  const unitLabel = getUnitLabel(glucoseUnit);

  const totalHighs = incidents.highCount + incidents.veryHighCount;
  const totalLows = incidents.lowCount + incidents.veryLowCount;

  return (
    <Card className={styles.card}>
      <Text className={styles.cardTitle}>
        <DataTrendingRegular className={styles.cardIcon} />
        Additional Statistics
      </Text>

      <div className={styles.statsGrid}>
        {/* Quartiles on Gaussian Curve */}
        {quartiles && (
          <div className={styles.statSection}>
            <Text className={styles.sectionTitle}>Quartiles</Text>
            <div className={styles.gaussianContainer}>
              <GaussianCurve
                q25={quartiles.q25}
                q50={quartiles.q50}
                q75={quartiles.q75}
                glucoseUnit={glucoseUnit}
              />
            </div>
          </div>
        )}

        {/* High/Low Incidents - Circular */}
        <div className={styles.statSection}>
          <Text className={styles.sectionTitle}>Highs/Lows</Text>
          <Tooltip content={`${totalHighs} high incidents, ${totalLows} low incidents`} relationship="description">
            <div className={styles.sectionContent}>
              <div className={styles.circularIndicator}>
                <HighLowRing highs={totalHighs} lows={totalLows} />
                <div className={styles.circularValues}>
                  <Text className={styles.highValue}>{totalHighs}</Text>
                  <div className={styles.dividerLine} />
                  <Text className={styles.lowValue}>{totalLows}</Text>
                </div>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Flux Grade */}
        {flux && (
          <div className={styles.statSection}>
            <Text className={styles.sectionTitle}>Flux (Stability)</Text>
            <div className={styles.fluxContainer}>
              <Tooltip content={`Grade based on CV: ${flux.score.toFixed(1)}%`} relationship="description">
                <div 
                  className={styles.fluxGrade}
                  style={{ backgroundColor: getFluxGradeColor(flux.grade) }}
                >
                  {flux.grade}
                </div>
              </Tooltip>
              <div className={styles.fluxInfo}>
                <Text className={styles.fluxDescription}>{flux.description}</Text>
                <Text className={styles.fluxScore}>CV: {flux.score.toFixed(1)}%</Text>
              </div>
            </div>
          </div>
        )}

        {/* Unicorns */}
        <div className={styles.statSection}>
          <Text className={styles.sectionTitle}>🦄 Unicorns</Text>
          <Tooltip content={`Perfect readings at 5.0 or 5.6 ${unitLabel}`} relationship="description">
            <div className={styles.unicornContainer}>
              <SparkleRegular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
              <div style={{ textAlign: 'center' }}>
                <Text className={styles.unicornCount}>{unicornCount}</Text>
                <Text className={styles.unicornLabel}> perfect</Text>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Wake Up Average */}
        <div className={styles.statSection}>
          <Text className={styles.sectionTitle}>☀ Wake Up Avg</Text>
          <Tooltip content="Average glucose value at wake up time (6-9 AM)" relationship="description">
            <div className={styles.timeAverageContainer}>
              <WeatherSunnyRegular className={styles.timeAverageIcon} style={{ color: '#FFB300' }} />
              <div style={{ textAlign: 'center' }}>
                <Text className={styles.timeAverageValue}>
                  {wakeupAverage !== null ? displayGlucoseValue(wakeupAverage, glucoseUnit) : '-'}
                </Text>
                <Text className={styles.timeAverageUnit}>{unitLabel}</Text>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Bedtime Average */}
        <div className={styles.statSection}>
          <Text className={styles.sectionTitle}>☾ Bedtime Avg</Text>
          <Tooltip content="Average glucose value at bedtime (9 PM - 12 AM)" relationship="description">
            <div className={styles.timeAverageContainer}>
              <WeatherMoonRegular className={styles.timeAverageIcon} style={{ color: '#5C6BC0' }} />
              <div style={{ textAlign: 'center' }}>
                <Text className={styles.timeAverageValue}>
                  {bedtimeAverage !== null ? displayGlucoseValue(bedtimeAverage, glucoseUnit) : '-'}
                </Text>
                <Text className={styles.timeAverageUnit}>{unitLabel}</Text>
              </div>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Summary Row with Average, Median, StDev */}
      <div className={styles.summaryRow}>
        <Tooltip content="Average of all glucose values" relationship="description">
          <div className={styles.summaryItem}>
            <Text className={styles.summaryValue}>
              {averageGlucose !== null ? displayGlucoseValue(averageGlucose, glucoseUnit) : '-'}
            </Text>
            <Text className={styles.summaryLabel}>Avg {unitLabel}</Text>
          </div>
        </Tooltip>
        <Tooltip content="Median (middle) glucose value" relationship="description">
          <div className={styles.summaryItem}>
            <Text className={styles.summaryValue}>
              {medianGlucose !== null ? displayGlucoseValue(medianGlucose, glucoseUnit) : '-'}
            </Text>
            <Text className={styles.summaryLabel}>Median {unitLabel}</Text>
          </div>
        </Tooltip>
        <Tooltip content="Standard deviation - measures glucose variability" relationship="description">
          <div className={styles.summaryItem}>
            <Text className={styles.summaryValue}>
              {standardDeviation !== null ? displayGlucoseValue(standardDeviation, glucoseUnit) : '-'}
            </Text>
            <Text className={styles.summaryLabel}>StDev {unitLabel}</Text>
          </div>
        </Tooltip>
      </div>
    </Card>
  );
}
