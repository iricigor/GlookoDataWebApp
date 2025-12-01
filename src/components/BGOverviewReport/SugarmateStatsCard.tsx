/**
 * Sugarmate Stats Card Component
 * Displays additional glucose statistics inspired by Sugarmate app
 * with clean, polished visual representations
 */

import { 
  Text,
  Card,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Link,
  tokens,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import { 
  DataTrendingRegular,
  WeatherSunnyRegular,
  WeatherMoonRegular,
  InfoRegular,
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
const BOX_HEIGHT = '90px';

/** Neutral colors for highs/lows donut - more distinct tones */
const HIGH_COLOR = '#4B5563'; // Darker neutral gray
const LOW_COLOR = '#D1D5DB';  // Much lighter gray for better contrast

/** Donut size - shared between Highs/Lows and Flux */
const DONUT_SIZE = 52;

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
  infoIcon: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    ':hover': {
      color: tokens.colorBrandForeground1,
    },
  },
  popoverContent: {
    ...shorthands.padding('8px', '12px'),
    maxWidth: '280px',
    fontSize: tokens.fontSizeBase200,
    lineHeight: 1.4,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap('12px'),
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
    ...shorthands.padding('10px'),
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
    width: '70px',
    flexShrink: 0,
    paddingRight: '6px',
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
  // Quartile Gaussian curve styles - wider, more curvy
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
    top: '50%',
    left: '0',
    right: '0',
    transform: 'translateY(-50%)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: '15%',
    paddingRight: '15%',
    zIndex: 2,
  },
  quartileValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    textAlign: 'center',
    lineHeight: 1,
  },
  // High/Low container - text outside donut
  highLowContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('10px'),
    height: '100%',
  },
  circularIndicator: {
    position: 'relative',
    width: `${DONUT_SIZE}px`,
    height: `${DONUT_SIZE}px`,
    flexShrink: 0,
  },
  highLowTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    ...shorthands.gap('2px'),
  },
  highLowRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
  },
  highLowValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1,
  },
  highLowLabel: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
  },
  highLowDivider: {
    width: '100%',
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
    marginTop: '2px',
    marginBottom: '2px',
  },
  // Flux grade styles - same size as donut
  fluxContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('8px'),
    height: '100%',
  },
  fluxGrade: {
    width: `${DONUT_SIZE}px`,
    height: `${DONUT_SIZE}px`,
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase600,
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
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1,
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
    fontSize: tokens.fontSizeBase500,
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
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1,
  },
  timeAverageUnit: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  // Summary stats row - inline format, darker background
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.padding('8px', '12px'),
    marginTop: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.gap('12px'),
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      ...shorthands.gap('6px'),
    },
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    ...shorthands.gap('4px'),
    '@media (max-width: 600px)': {
      justifyContent: 'center',
    },
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  summaryValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  summaryUnit: {
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

/** SVG Gaussian curve component for quartiles - wider to ensure numbers are in front */
function GaussianCurve() {
  // Soft blue color for the curve
  const curveColor = '#A8C5E8';
  const lineColor = '#7AA7D6';
  
  // Gaussian curve with wide sigma for a broader distribution
  // Curve spans from 15% to 85% of the viewBox width
  // Numbers will be positioned at 15%, 50%, 85% to align with curve edges
  const curvePoints = [];
  for (let x = 15; x <= 85; x += 2) {
    const sigma = 18;
    const y = 50 - 42 * Math.exp(-Math.pow(x - 50, 2) / (2 * Math.pow(sigma, 2)));
    curvePoints.push(`${x},${y}`);
  }
  const curvePath = `M 15,50 L ${curvePoints.join(' L ')} L 85,50`;
  const curveOutline = `M ${curvePoints.join(' L ')}`;
  
  return (
    <svg viewBox="0 0 100 55" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
      {/* Shaded area under curve - soft blue fill */}
      <path
        d={curvePath}
        fill={curveColor}
        fillOpacity="0.4"
      />
      {/* Gaussian curve outline */}
      <path
        d={curveOutline}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      {/* Q25 marker line at 28% position (closer to center) */}
      <line x1="28" y1="8" x2="28" y2="50" stroke={lineColor} strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2,2" />
      {/* Q50 (median) marker line at 50% position */}
      <line x1="50" y1="8" x2="50" y2="50" stroke={lineColor} strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="2,2" />
      {/* Q75 marker line at 72% position (closer to center) */}
      <line x1="72" y1="8" x2="72" y2="50" stroke={lineColor} strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2,2" />
    </svg>
  );
}

/** Circular progress ring for high/low incidents - neutral colors with thicker stroke */
function HighLowRing({ highs, lows }: { highs: number; lows: number }) {
  const total = highs + lows;
  const highRatio = total > 0 ? highs / total : 0.5;
  
  // SVG circle parameters - use shared donut size with thicker stroke
  const size = DONUT_SIZE;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash for the high portion
  const highDash = circumference * highRatio;
  const lowDash = circumference * (1 - highRatio);
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Low portion (lighter gray) - starts first */}
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
      {/* High portion (darker gray) */}
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
        <Popover withArrow>
          <PopoverTrigger disableButtonEnhancement>
            <InfoRegular className={styles.infoIcon} aria-label="Information about Additional Statistics" />
          </PopoverTrigger>
          <PopoverSurface>
            <div className={styles.popoverContent}>
              These statistics are inspired by the{' '}
              <Link href="https://sugarmate.io/" target="_blank" inline>
                Sugarmate app
              </Link>
              , providing insights into your glucose data patterns and variability.
            </div>
          </PopoverSurface>
        </Popover>
      </Text>

      <div className={styles.statsGrid}>
        {/* Quartiles on Gaussian Curve */}
        {quartiles && (
          <Tooltip content="25th, 50th (median), and 75th percentile glucose values showing the distribution spread of your readings over the selected period" relationship="description">
            <div className={styles.statSection}>
              <div className={styles.labelColumn}>
                <Text className={styles.sectionTitle}>Quartiles</Text>
              </div>
              <div className={styles.graphicsColumn}>
                <div className={styles.gaussianContainer}>
                  <GaussianCurve />
                  {/* Quartile values overlaid on curve - positioned at 25%, 50%, 75% */}
                  <div className={styles.quartileValuesOverlay}>
                    <Text className={styles.quartileValue}>
                      {displayGlucoseValue(quartiles.q25, glucoseUnit)}
                    </Text>
                    <Text className={styles.quartileValue}>
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

        {/* High/Low Incidents - neutral colors, text outside */}
        <Tooltip content="Number of transitions into high and low glucose zones. Each incident represents a period when glucose moved outside your target range" relationship="description">
          <div className={styles.statSection}>
            <div className={styles.labelColumn}>
              <Text className={styles.sectionTitle}>Highs / Lows</Text>
            </div>
            <div className={styles.graphicsColumn}>
              <div className={styles.highLowContainer}>
                <div className={styles.circularIndicator}>
                  <HighLowRing highs={totalHighs} lows={totalLows} />
                </div>
                <div className={styles.highLowTextContainer}>
                  <div className={styles.highLowRow}>
                    <Text className={styles.highLowValue}>{totalHighs}</Text>
                    <Text className={styles.highLowLabel}>High</Text>
                  </div>
                  <div className={styles.highLowDivider} />
                  <div className={styles.highLowRow}>
                    <Text className={styles.highLowValue}>{totalLows}</Text>
                    <Text className={styles.highLowLabel}>Low</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* Flux Grade */}
        {flux && (
          <Tooltip content={`Glucose stability grade based on coefficient of variation. A+ means very steady glucose, F means high variability (CV: ${flux.score.toFixed(1)}%)`} relationship="description">
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
                    <Text className={styles.fluxScore}>CV {flux.score.toFixed(1)}%</Text>
                  </div>
                </div>
              </div>
            </div>
          </Tooltip>
        )}

        {/* Unicorns */}
        <Tooltip content={`"Perfect" glucose readings at exactly 100 mg/dL (± 0.5) or 5 mmol/L (± 0.05). These are considered ideal glucose levels for many people with diabetes`} relationship="description">
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
        <Tooltip content="Average glucose value at wake up time (6-9 AM). Morning glucose levels can indicate overnight glycemic control and dawn phenomenon" relationship="description">
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
        <Tooltip content="Average glucose value at bedtime (9 PM - 12 AM). Pre-sleep glucose levels help assess evening meal impact and overnight risk" relationship="description">
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

      {/* Summary Row with Average, Median, StDev - inline format */}
      <div className={styles.summaryRow}>
        <Tooltip content="Average of all glucose values in the selected period. A key metric for overall glucose control assessment" relationship="description">
          <div className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>Avg</Text>
            <Text className={styles.summaryValue}>
              {averageGlucose !== null ? displayGlucoseValue(averageGlucose, glucoseUnit) : '-'}
            </Text>
            <Text className={styles.summaryUnit}>{unitLabel}</Text>
          </div>
        </Tooltip>
        <Tooltip content="Median (middle) glucose value. Less affected by extreme highs or lows than the average, representing a typical reading" relationship="description">
          <div className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>Median</Text>
            <Text className={styles.summaryValue}>
              {medianGlucose !== null ? displayGlucoseValue(medianGlucose, glucoseUnit) : '-'}
            </Text>
            <Text className={styles.summaryUnit}>{unitLabel}</Text>
          </div>
        </Tooltip>
        <Tooltip content="Standard deviation - measures glucose variability. Lower values indicate more stable glucose levels with less fluctuation" relationship="description">
          <div className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>StDev</Text>
            <Text className={styles.summaryValue}>
              {standardDeviation !== null ? displayGlucoseValue(standardDeviation, glucoseUnit) : '-'}
            </Text>
            <Text className={styles.summaryUnit}>{unitLabel}</Text>
          </div>
        </Tooltip>
      </div>
    </Card>
  );
}
