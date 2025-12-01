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
  ArrowUpRegular,
  ArrowDownRegular,
  SparkleRegular,
} from '@fluentui/react-icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { GlucoseUnit, GlucoseThresholds } from '../../types';
import { 
  displayGlucoseValue, 
  getUnitLabel,
  GLUCOSE_RANGE_COLORS,
} from '../../utils/data';
import type { 
  QuartileStats, 
  HighLowIncidents, 
  FluxResult 
} from '../../utils/data/glucoseRangeUtils';

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
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    ...shorthands.gap('20px'),
  },
  statSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    marginBottom: '12px',
  },
  // Donut chart styles
  donutContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  donutChart: {
    width: '120px',
    height: '120px',
    flexShrink: 0,
  },
  donutLegend: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  legendColor: {
    width: '12px',
    height: '12px',
    ...shorthands.borderRadius('2px'),
  },
  legendText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  legendValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginLeft: 'auto',
  },
  // Quartile visualization styles
  quartileContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  quartileLine: {
    position: 'relative',
    height: '40px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    display: 'flex',
    alignItems: 'center',
  },
  quartileRange: {
    position: 'absolute',
    height: '20px',
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quartileMedian: {
    position: 'absolute',
    width: '4px',
    height: '30px',
    backgroundColor: tokens.colorBrandForeground1,
    ...shorthands.borderRadius('2px'),
    zIndex: 1,
  },
  quartileLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  quartileValues: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '8px',
  },
  quartileValue: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  quartileLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  quartileNumber: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  // High/Low incidents styles
  incidentsContainer: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.gap('24px'),
    marginTop: '8px',
  },
  incidentItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    minWidth: '80px',
  },
  incidentIcon: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  incidentCount: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    lineHeight: '1',
  },
  incidentLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: '4px',
  },
  // Flux grade styles
  fluxContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  fluxGrade: {
    width: '64px',
    height: '64px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    color: 'white',
    flexShrink: 0,
  },
  fluxInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  fluxDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  fluxScore: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  // Unicorn styles
  unicornContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    marginTop: '8px',
  },
  unicornEmoji: {
    fontSize: '32px',
  },
  unicornCount: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  unicornLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  // Summary stats row
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-around',
    ...shorthands.padding('12px'),
    marginTop: '8px',
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
  thresholds: GlucoseThresholds;
  // Stats data
  percentAbove: number;
  percentBelow: number;
  percentInRange: number;
  averageGlucose: number | null;
  medianGlucose: number | null;
  standardDeviation: number | null;
  quartiles: QuartileStats | null;
  incidents: HighLowIncidents;
  flux: FluxResult | null;
  unicornCount: number;
}

/** Get color for flux grade */
function getFluxGradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return GLUCOSE_RANGE_COLORS.inRange;
    case 'B':
      return '#8BC34A'; // Light green
    case 'C':
      return GLUCOSE_RANGE_COLORS.high;
    case 'D':
      return '#FF9800'; // Orange
    case 'F':
      return GLUCOSE_RANGE_COLORS.low;
    default:
      return tokens.colorNeutralForeground1;
  }
}

export function SugarmateStatsCard({
  glucoseUnit,
  percentAbove,
  percentBelow,
  percentInRange,
  averageGlucose,
  medianGlucose,
  standardDeviation,
  quartiles,
  incidents,
  flux,
  unicornCount,
}: SugarmateStatsCardProps) {
  const styles = useStyles();
  const unitLabel = getUnitLabel(glucoseUnit);

  // Donut chart data
  const donutData = [
    { name: 'Below', value: percentBelow, color: GLUCOSE_RANGE_COLORS.low },
    { name: 'In Range', value: percentInRange, color: GLUCOSE_RANGE_COLORS.inRange },
    { name: 'Above', value: percentAbove, color: GLUCOSE_RANGE_COLORS.high },
  ].filter(d => d.value > 0);

  // Calculate quartile positions for visualization
  const getQuartilePosition = (value: number): number => {
    if (!quartiles) return 50;
    const range = quartiles.max - quartiles.min;
    if (range === 0) return 50;
    return ((value - quartiles.min) / range) * 100;
  };

  return (
    <Card className={styles.card}>
      <Text className={styles.cardTitle}>
        <DataTrendingRegular className={styles.cardIcon} />
        Additional Statistics
      </Text>

      <div className={styles.statsGrid}>
        {/* Range Distribution Donut Chart */}
        <div className={styles.statSection}>
          <Text className={styles.sectionTitle}>Range Distribution</Text>
          <div className={styles.donutContainer}>
            <div className={styles.donutChart}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.donutLegend}>
              <Tooltip content={`Below target range`} relationship="description">
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ backgroundColor: GLUCOSE_RANGE_COLORS.low }} />
                  <Text className={styles.legendText}>Below</Text>
                  <Text className={styles.legendValue}>{percentBelow.toFixed(1)}%</Text>
                </div>
              </Tooltip>
              <Tooltip content={`Within target range`} relationship="description">
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ backgroundColor: GLUCOSE_RANGE_COLORS.inRange }} />
                  <Text className={styles.legendText}>In Range</Text>
                  <Text className={styles.legendValue}>{percentInRange.toFixed(1)}%</Text>
                </div>
              </Tooltip>
              <Tooltip content={`Above target range`} relationship="description">
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ backgroundColor: GLUCOSE_RANGE_COLORS.high }} />
                  <Text className={styles.legendText}>Above</Text>
                  <Text className={styles.legendValue}>{percentAbove.toFixed(1)}%</Text>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Quartiles Visualization */}
        {quartiles && (
          <div className={styles.statSection}>
            <Text className={styles.sectionTitle}>Quartiles</Text>
            <div className={styles.quartileContainer}>
              <div className={styles.quartileLine}>
                {/* 25-75% range */}
                <div 
                  className={styles.quartileRange}
                  style={{
                    left: `${getQuartilePosition(quartiles.q25)}%`,
                    width: `${getQuartilePosition(quartiles.q75) - getQuartilePosition(quartiles.q25)}%`,
                  }}
                />
                {/* Median marker */}
                <Tooltip content={`Median: ${displayGlucoseValue(quartiles.q50, glucoseUnit)} ${unitLabel}`} relationship="description">
                  <div 
                    className={styles.quartileMedian}
                    style={{ left: `calc(${getQuartilePosition(quartiles.q50)}% - 2px)` }}
                  />
                </Tooltip>
              </div>
              <div className={styles.quartileLabels}>
                <Text>Min: {displayGlucoseValue(quartiles.min, glucoseUnit)}</Text>
                <Text>Max: {displayGlucoseValue(quartiles.max, glucoseUnit)}</Text>
              </div>
              <div className={styles.quartileValues}>
                <Tooltip content="25th percentile" relationship="description">
                  <div className={styles.quartileValue}>
                    <Text className={styles.quartileLabel}>Q1 (25%)</Text>
                    <Text className={styles.quartileNumber}>{displayGlucoseValue(quartiles.q25, glucoseUnit)}</Text>
                  </div>
                </Tooltip>
                <Tooltip content="50th percentile (Median)" relationship="description">
                  <div className={styles.quartileValue}>
                    <Text className={styles.quartileLabel}>Median</Text>
                    <Text className={styles.quartileNumber} style={{ color: tokens.colorBrandForeground1 }}>
                      {displayGlucoseValue(quartiles.q50, glucoseUnit)}
                    </Text>
                  </div>
                </Tooltip>
                <Tooltip content="75th percentile" relationship="description">
                  <div className={styles.quartileValue}>
                    <Text className={styles.quartileLabel}>Q3 (75%)</Text>
                    <Text className={styles.quartileNumber}>{displayGlucoseValue(quartiles.q75, glucoseUnit)}</Text>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* High/Low Incidents */}
        <div className={styles.statSection}>
          <Text className={styles.sectionTitle}>Highs / Lows Incidents</Text>
          <div className={styles.incidentsContainer}>
            <Tooltip content="Number of transitions into high glucose zone" relationship="description">
              <div className={styles.incidentItem} style={{ backgroundColor: `${GLUCOSE_RANGE_COLORS.high}20` }}>
                <ArrowUpRegular className={styles.incidentIcon} style={{ color: GLUCOSE_RANGE_COLORS.high }} />
                <Text className={styles.incidentCount} style={{ color: GLUCOSE_RANGE_COLORS.high }}>
                  {incidents.highCount + incidents.veryHighCount}
                </Text>
                <Text className={styles.incidentLabel}>Highs</Text>
              </div>
            </Tooltip>
            <Tooltip content="Number of transitions into low glucose zone" relationship="description">
              <div className={styles.incidentItem} style={{ backgroundColor: `${GLUCOSE_RANGE_COLORS.low}20` }}>
                <ArrowDownRegular className={styles.incidentIcon} style={{ color: GLUCOSE_RANGE_COLORS.low }} />
                <Text className={styles.incidentCount} style={{ color: GLUCOSE_RANGE_COLORS.low }}>
                  {incidents.lowCount + incidents.veryLowCount}
                </Text>
                <Text className={styles.incidentLabel}>Lows</Text>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Flux Grade */}
        {flux && (
          <div className={styles.statSection}>
            <Text className={styles.sectionTitle}>Flux (Stability Grade)</Text>
            <div className={styles.fluxContainer}>
              <Tooltip content={`Grade based on coefficient of variation: ${flux.score.toFixed(1)}%`} relationship="description">
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
          <div className={styles.unicornContainer}>
            <SparkleRegular style={{ fontSize: '32px', color: tokens.colorBrandForeground1 }} />
            <div>
              <Text className={styles.unicornCount}>{unicornCount}</Text>
              <Text className={styles.unicornLabel}> perfect readings</Text>
            </div>
          </div>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginTop: '8px' }}>
            Readings at exactly 5.0 or 5.6 {unitLabel}
          </Text>
        </div>
      </div>

      {/* Summary Row with Average, Median, SD */}
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
            <Text className={styles.summaryLabel}>SD {unitLabel}</Text>
          </div>
        </Tooltip>
      </div>
    </Card>
  );
}
