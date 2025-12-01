/**
 * Sugarmate Stats Card Component
 * Displays additional glucose statistics inspired by Sugarmate app
 * with clean, polished visual representations
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
const BOX_HEIGHT = '100px';

/** Neutral colors for highs/lows donut */
const HIGH_COLOR = '#5B8DEF'; // Calm blue
const LOW_COLOR = '#9B7EDE';  // Soft purple

const useStyles = makeStyles({
  card: {
    ...shorthands.padding('24px'),
    ...shorthands.borderRadius('12px'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('none'),
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  cardIcon: {
    fontSize: '20px',
    color: tokens.colorNeutralForeground2,
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
    ...shorthands.padding('14px'),
    ...shorthands.borderRadius('10px'),
    backgroundColor: 'rgba(0,0,0,0.02)',
    height: BOX_HEIGHT,
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground3,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  // Quartile Gaussian curve styles - taller, soft blue
  gaussianContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    width: '100%',
    position: 'relative',
    height: '100%',
  },
  quartileValuesOverlay: {
    position: 'absolute',
    bottom: '8px',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: '8px',
    paddingRight: '8px',
    zIndex: 2,
  },
  quartileValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    textAlign: 'center',
  },
  quartileMedianValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  // High/Low circular indicator styles - neutral colors
  highLowContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('12px'),
    flexGrow: 1,
  },
  circularIndicator: {
    position: 'relative',
    width: '52px',
    height: '52px',
  },
  circularValues: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: '1.0',
  },
  highValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: HIGH_COLOR,
  },
  lowValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: LOW_COLOR,
  },
  highLowLabels: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    ...shorthands.gap('2px'),
  },
  highLowLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  // Flux grade styles - softer shadow
  fluxContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('10px'),
    flexGrow: 1,
  },
  fluxGrade: {
    width: '44px',
    height: '44px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: 'white',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
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
    color: tokens.colorNeutralForeground3,
  },
  // Unicorn styles - larger, bolder
  unicornContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('8px'),
    flexGrow: 1,
  },
  unicornEmoji: {
    fontSize: '24px',
    filter: 'grayscale(100%)',
    opacity: 0.7,
  },
  unicornText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  unicornCount: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1,
  },
  unicornLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  // Time average styles (bedtime/wakeup) - larger icons and numbers
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
  timeAverageText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  timeAverageValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1,
  },
  timeAverageUnit: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  // Summary stats row - larger, bolder, aligned
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...shorthands.padding('16px'),
    marginTop: '20px',
    backgroundColor: 'rgba(0,0,0,0.02)',
    ...shorthands.borderRadius('10px'),
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '80px',
  },
  summaryValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1,
    marginBottom: '4px',
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
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

/** SVG Gaussian curve component for quartiles - taller with soft blue fill */
function GaussianCurve() {
  // Soft blue color for the curve
  const curveColor = '#A8C5E8';
  const lineColor = '#7AA7D6';
  
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
      {/* Shaded area under curve - soft blue fill */}
      <path
        d="M 0,50 Q 10,48 25,32 Q 40,12 50,6 Q 60,12 75,32 Q 90,48 100,50 L 100,50 L 0,50 Z"
        fill={curveColor}
        fillOpacity="0.4"
      />
      {/* Gaussian curve outline */}
      <path
        d="M 0,50 Q 10,48 25,32 Q 40,12 50,6 Q 60,12 75,32 Q 90,48 100,50"
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      {/* Q25 marker line at 25% position */}
      <line x1="25" y1="32" x2="25" y2="50" stroke={lineColor} strokeWidth="1" strokeOpacity="0.5" />
      {/* Q50 (median) marker line at 50% position */}
      <line x1="50" y1="6" x2="50" y2="50" stroke={lineColor} strokeWidth="1.5" strokeOpacity="0.6" />
      {/* Q75 marker line at 75% position */}
      <line x1="75" y1="32" x2="75" y2="50" stroke={lineColor} strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}

/** Circular progress ring for high/low incidents - neutral two-tone, thin ring */
function HighLowRing({ highs, lows }: { highs: number; lows: number }) {
  const total = highs + lows;
  const highRatio = total > 0 ? highs / total : 0.5;
  
  // SVG circle parameters - thin ring
  const size = 52;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash for the high portion
  const highDash = circumference * highRatio;
  const lowDash = circumference * (1 - highRatio);
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.05)"
        strokeWidth={strokeWidth}
      />
      {/* Low portion (purple) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={LOW_COLOR}
        strokeWidth={strokeWidth}
        strokeDasharray={`${lowDash} ${circumference}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* High portion (blue) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={HIGH_COLOR}
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
          <Tooltip content="25th, 50th (median), and 75th percentile glucose values" relationship="description">
            <div className={styles.statSection}>
              <Text className={styles.sectionTitle}>Quartiles</Text>
              <div className={styles.gaussianContainer}>
                <GaussianCurve />
                {/* Quartile values overlaid on curve */}
                <div className={styles.quartileValuesOverlay}>
                  <Text className={styles.quartileValue}>
                    {displayGlucoseValue(quartiles.q25, glucoseUnit)}
                  </Text>
                  <Text className={styles.quartileMedianValue}>
                    {displayGlucoseValue(quartiles.q50, glucoseUnit)}
                  </Text>
                  <Text className={styles.quartileValue}>
                    {displayGlucoseValue(quartiles.q75, glucoseUnit)}
                  </Text>
                </div>
              </div>
            </div>
          </Tooltip>
        )}

        {/* High/Low Incidents - Neutral two-tone donut */}
        <Tooltip content="Number of transitions into high and low glucose zones" relationship="description">
          <div className={styles.statSection}>
            <Text className={styles.sectionTitle}>Highs / Lows</Text>
            <div className={styles.highLowContainer}>
              <div className={styles.circularIndicator}>
                <HighLowRing highs={totalHighs} lows={totalLows} />
                <div className={styles.circularValues}>
                  <Text className={styles.highValue}>{totalHighs}</Text>
                  <Text className={styles.lowValue}>{totalLows}</Text>
                </div>
              </div>
              <div className={styles.highLowLabels}>
                <Text className={styles.highLowLabel} style={{ color: HIGH_COLOR }}>High</Text>
                <Text className={styles.highLowLabel} style={{ color: LOW_COLOR }}>Low</Text>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* Flux Grade */}
        {flux && (
          <Tooltip content={`Glucose stability grade based on coefficient of variation (CV: ${flux.score.toFixed(1)}%)`} relationship="description">
            <div className={styles.statSection}>
              <Text className={styles.sectionTitle}>Flux (Stability)</Text>
              <div className={styles.fluxContainer}>
                <div 
                  className={styles.fluxGrade}
                  style={{ backgroundColor: getFluxGradeColor(flux.grade) }}
                >
                  {flux.grade}
                </div>
                <div className={styles.fluxInfo}>
                  <Text className={styles.fluxDescription}>{flux.description}</Text>
                  <Text className={styles.fluxScore}>CV: {flux.score.toFixed(1)}%</Text>
                </div>
              </div>
            </div>
          </Tooltip>
        )}

        {/* Unicorns - larger, bolder */}
        <Tooltip content={`"Perfect" glucose readings at exactly 5.0 or 5.6 ${unitLabel}`} relationship="description">
          <div className={styles.statSection}>
            <Text className={styles.sectionTitle}>Unicorns</Text>
            <div className={styles.unicornContainer}>
              <span className={styles.unicornEmoji}>🦄</span>
              <div className={styles.unicornText}>
                <Text className={styles.unicornCount}>{unicornCount}</Text>
                <Text className={styles.unicornLabel}>perfect</Text>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* Wake Up Average - larger icons and numbers */}
        <Tooltip content="Average glucose value at wake up time (6-9 AM)" relationship="description">
          <div className={styles.statSection}>
            <Text className={styles.sectionTitle}>Wake Up Avg</Text>
            <div className={styles.timeAverageContainer}>
              <WeatherSunnyRegular className={styles.timeAverageIcon} style={{ color: '#F5A623' }} />
              <div className={styles.timeAverageText}>
                <Text className={styles.timeAverageValue}>
                  {wakeupAverage !== null ? displayGlucoseValue(wakeupAverage, glucoseUnit) : '-'}
                </Text>
                <Text className={styles.timeAverageUnit}>{unitLabel}</Text>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* Bedtime Average - larger icons and numbers */}
        <Tooltip content="Average glucose value at bedtime (9 PM - 12 AM)" relationship="description">
          <div className={styles.statSection}>
            <Text className={styles.sectionTitle}>Bedtime Avg</Text>
            <div className={styles.timeAverageContainer}>
              <WeatherMoonRegular className={styles.timeAverageIcon} style={{ color: '#7B68EE' }} />
              <div className={styles.timeAverageText}>
                <Text className={styles.timeAverageValue}>
                  {bedtimeAverage !== null ? displayGlucoseValue(bedtimeAverage, glucoseUnit) : '-'}
                </Text>
                <Text className={styles.timeAverageUnit}>{unitLabel}</Text>
              </div>
            </div>
          </div>
        </Tooltip>
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
