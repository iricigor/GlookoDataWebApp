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
const BOX_HEIGHT = '80px';

/** Neutral colors for highs/lows donut - Fluent UI DonutChart style */
const HIGH_COLOR = '#0078D4'; // Fluent blue
const LOW_COLOR = '#8764B8';  // Fluent purple

/** Sun/Moon icon colors */
const SUN_COLOR = '#F5A623';
const MOON_COLOR = '#7B68EE';

const useStyles = makeStyles({
  card: {
    ...shorthands.padding('16px', '20px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow16,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '12px',
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
  // Split box: label on left, graphics on right
  statSection: {
    display: 'flex',
    flexDirection: 'row',
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    height: BOX_HEIGHT,
    boxSizing: 'border-box',
    alignItems: 'center',
  },
  labelColumn: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '80px',
    flexShrink: 0,
    paddingRight: '8px',
  },
  graphicsColumn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    height: '100%',
    position: 'relative',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    lineHeight: 1.2,
  },
  // Quartile Gaussian curve styles - taller, soft blue
  gaussianContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    height: '100%',
  },
  quartileValuesOverlay: {
    position: 'absolute',
    bottom: '4px',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: '4px',
    paddingRight: '4px',
    zIndex: 2,
  },
  quartileValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    textAlign: 'center',
  },
  quartileMedianValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  // High/Low circular indicator styles - Fluent colors
  highLowContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('8px'),
    height: '100%',
  },
  circularIndicator: {
    position: 'relative',
    width: '56px',
    height: '56px',
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
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightBold,
    color: HIGH_COLOR,
  },
  lowValue: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: LOW_COLOR,
  },
  highLowLabels: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    ...shorthands.gap('0px'),
  },
  highLowLabel: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.3px',
  },
  // Flux grade styles - softer shadow
  fluxContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('8px'),
    height: '100%',
  },
  fluxGrade: {
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: 'white',
    flexShrink: 0,
    boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
  },
  fluxInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  fluxDescription: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1.2,
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
    ...shorthands.gap('6px'),
    height: '100%',
  },
  unicornEmoji: {
    fontSize: '28px',
    filter: 'grayscale(100%)',
    opacity: 0.7,
  },
  unicornText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  unicornCount: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1,
  },
  unicornLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  // Time average styles (bedtime/wakeup) - larger icons and numbers
  timeAverageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('8px'),
    height: '100%',
  },
  timeAverageIcon: {
    fontSize: '32px',
  },
  timeAverageText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  timeAverageValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1,
  },
  timeAverageUnit: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  // Summary stats row - smaller, darker background
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...shorthands.padding('10px'),
    marginTop: '16px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '70px',
  },
  summaryValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1,
    marginBottom: '2px',
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase100,
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

/** Circular progress ring for high/low incidents - Fluent UI DonutChart style */
function HighLowRing({ highs, lows }: { highs: number; lows: number }) {
  const total = highs + lows;
  const highRatio = total > 0 ? highs / total : 0.5;
  
  // SVG circle parameters - Fluent UI style
  const size = 56;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash for the high portion
  const highDash = circumference * highRatio;
  const lowDash = circumference * (1 - highRatio);
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Low portion (purple) - starts first */}
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
              <div className={styles.labelColumn}>
                <Text className={styles.sectionTitle}>Quartiles</Text>
              </div>
              <div className={styles.graphicsColumn}>
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
            </div>
          </Tooltip>
        )}

        {/* High/Low Incidents - Fluent UI DonutChart style */}
        <Tooltip content="Number of transitions into high and low glucose zones" relationship="description">
          <div className={styles.statSection}>
            <div className={styles.labelColumn}>
              <Text className={styles.sectionTitle}>Highs / Lows</Text>
            </div>
            <div className={styles.graphicsColumn}>
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
          </div>
        </Tooltip>

        {/* Flux Grade */}
        {flux && (
          <Tooltip content={`Glucose stability grade based on coefficient of variation (CV: ${flux.score.toFixed(1)}%)`} relationship="description">
            <div className={styles.statSection}>
              <div className={styles.labelColumn}>
                <Text className={styles.sectionTitle}>Flux (Stability)</Text>
              </div>
              <div className={styles.graphicsColumn}>
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
            </div>
          </Tooltip>
        )}

        {/* Unicorns */}
        <Tooltip content={`"Perfect" glucose readings at exactly 5.0 or 5.6 ${unitLabel}`} relationship="description">
          <div className={styles.statSection}>
            <div className={styles.labelColumn}>
              <Text className={styles.sectionTitle}>Unicorns</Text>
            </div>
            <div className={styles.graphicsColumn}>
              <div className={styles.unicornContainer}>
                <span className={styles.unicornEmoji}>🦄</span>
                <div className={styles.unicornText}>
                  <Text className={styles.unicornCount}>{unicornCount}</Text>
                  <Text className={styles.unicornLabel}>perfect</Text>
                </div>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* Wake Up Average */}
        <Tooltip content="Average glucose value at wake up time (6-9 AM)" relationship="description">
          <div className={styles.statSection}>
            <div className={styles.labelColumn}>
              <Text className={styles.sectionTitle}>Wake Up Avg</Text>
            </div>
            <div className={styles.graphicsColumn}>
              <div className={styles.timeAverageContainer}>
                <WeatherSunnyRegular className={styles.timeAverageIcon} style={{ color: SUN_COLOR }} />
                <div className={styles.timeAverageText}>
                  <Text className={styles.timeAverageValue}>
                    {wakeupAverage !== null ? displayGlucoseValue(wakeupAverage, glucoseUnit) : '-'}
                  </Text>
                  <Text className={styles.timeAverageUnit}>{unitLabel}</Text>
                </div>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* Bedtime Average */}
        <Tooltip content="Average glucose value at bedtime (9 PM - 12 AM)" relationship="description">
          <div className={styles.statSection}>
            <div className={styles.labelColumn}>
              <Text className={styles.sectionTitle}>Bedtime Avg</Text>
            </div>
            <div className={styles.graphicsColumn}>
              <div className={styles.timeAverageContainer}>
                <WeatherMoonRegular className={styles.timeAverageIcon} style={{ color: MOON_COLOR }} />
                <div className={styles.timeAverageText}>
                  <Text className={styles.timeAverageValue}>
                    {bedtimeAverage !== null ? displayGlucoseValue(bedtimeAverage, glucoseUnit) : '-'}
                  </Text>
                  <Text className={styles.timeAverageUnit}>{unitLabel}</Text>
                </div>
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
