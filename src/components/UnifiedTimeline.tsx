/**
 * UnifiedTimeline component
 * Displays 24-hour timeline combining insulin delivery and CGM glucose data
 */

import {
  makeStyles,
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { InsulinTotalsBar } from './InsulinTotalsBar';
import type { GlucoseReading } from '../types';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  chartWithBarWrapper: {
    display: 'flex',
    ...shorthands.gap('8px'),
    width: '100%',
    height: '400px',
  },
  chartContainer: {
    flex: 1,
    height: '100%',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
    ...shorthands.padding('12px', '16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: tokens.fontSizeBase200,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  legendLine: {
    width: '20px',
    height: '2px',
  },
  legendBar: {
    width: '12px',
    height: '20px',
    backgroundColor: '#1976D2',
  },
});

interface UnifiedTimelineProps {
  insulinData: Array<{
    hour: number;
    timeLabel: string;
    basalRate: number;
    bolusTotal: number;
  }>;
  glucoseReadings: GlucoseReading[];
}

export function UnifiedTimeline({ insulinData, glucoseReadings }: UnifiedTimelineProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();

  // Check if there's any insulin data to display
  const hasBasalData = insulinData.some(d => d.basalRate > 0);
  const hasBolusData = insulinData.some(d => d.bolusTotal > 0);
  const hasGlucoseData = glucoseReadings.length > 0;

  if (!hasBasalData && !hasBolusData && !hasGlucoseData) {
    return (
      <div className={styles.container}>
        <Text style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '24px' }}>
          No data available for this day
        </Text>
      </div>
    );
  }

  // Prepare glucose data by hour (average values for each hour)
  const glucoseByHour: { [hour: number]: number[] } = {};
  
  glucoseReadings.forEach(reading => {
    const hour = reading.timestamp.getHours();
    if (!glucoseByHour[hour]) {
      glucoseByHour[hour] = [];
    }
    glucoseByHour[hour].push(reading.value);
  });

  // Merge insulin and glucose data
  const mergedData = insulinData.map(insulin => {
    const glucoseValues = glucoseByHour[insulin.hour] || [];
    const avgGlucose = glucoseValues.length > 0
      ? glucoseValues.reduce((sum, val) => sum + val, 0) / glucoseValues.length
      : null;

    return {
      ...insulin,
      glucose: avgGlucose,
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      dataKey: string;
      color: string;
      payload: { timeLabel: string; basalRate: number; bolusTotal: number; glucose: number | null };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: tokens.colorNeutralBackground1,
          padding: '12px',
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          borderRadius: tokens.borderRadiusMedium,
          fontSize: tokens.fontSizeBase200,
        }}>
          <div style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: '4px' }}>
            {data.timeLabel}
          </div>
          {data.glucose !== null && (
            <div style={{ color: '#FF6B35', marginBottom: '4px' }}>
              Glucose: {data.glucose.toFixed(1)} mmol/L
            </div>
          )}
          {data.basalRate > 0 && (
            <div style={{ color: '#2E7D32' }}>
              Basal Rate: {data.basalRate.toFixed(2)} U
            </div>
          )}
          {data.bolusTotal > 0 && (
            <div style={{ color: '#1976D2' }}>
              Bolus Total: {data.bolusTotal.toFixed(1)} U
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Format X-axis labels (show every 3 hours)
  const formatXAxis = (value: string) => {
    const hour = parseInt(value.split(':')[0]);
    if (hour === 0) return '12A';
    if (hour === 3) return '3A';
    if (hour === 6) return '6A';
    if (hour === 9) return '9A';
    if (hour === 12) return '12P';
    if (hour === 15) return '3P';
    if (hour === 18) return '6P';
    if (hour === 21) return '9P';
    return '';
  };

  // Calculate daily totals
  const basalTotal = insulinData.reduce((sum, d) => sum + d.basalRate, 0);
  const bolusTotal = insulinData.reduce((sum, d) => sum + d.bolusTotal, 0);

  return (
    <div className={styles.container}>
      <div className={styles.chartWithBarWrapper}>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
              
              <XAxis
                dataKey="timeLabel"
                tickFormatter={formatXAxis}
                stroke={tokens.colorNeutralForeground2}
                style={{ fontSize: tokens.fontSizeBase200 }}
              />
              
              <YAxis
                yAxisId="left"
                label={{ 
                  value: 'Insulin (Units)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fontSize: tokens.fontSizeBase200 } 
                }}
                stroke={tokens.colorNeutralForeground2}
                style={{ fontSize: tokens.fontSizeBase200 }}
              />
              
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ 
                  value: 'Glucose (mmol/L)', 
                  angle: 90, 
                  position: 'insideRight', 
                  style: { fontSize: tokens.fontSizeBase200 } 
                }}
                stroke={tokens.colorNeutralForeground2}
                style={{ fontSize: tokens.fontSizeBase200 }}
                domain={[0, 22]}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend
                verticalAlign="top"
                height={36}
                iconType="line"
                wrapperStyle={{ fontSize: tokens.fontSizeBase200 }}
              />
              
              {/* Reference lines for glucose thresholds */}
              {hasGlucoseData && (
                <>
                  <ReferenceLine 
                    yAxisId="right" 
                    y={thresholds.low} 
                    stroke="#FFA726" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                  />
                  <ReferenceLine 
                    yAxisId="right" 
                    y={thresholds.high} 
                    stroke="#FFA726" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                  />
                </>
              )}
              
              {/* Bolus bars */}
              {hasBolusData && (
                <Bar
                  yAxisId="left"
                  dataKey="bolusTotal"
                  name="Bolus"
                  fill="#1976D2"
                  barSize={20}
                />
              )}
              
              {/* Basal line */}
              {hasBasalData && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="basalRate"
                  name="Basal Rate"
                  stroke="#2E7D32"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              
              {/* Glucose line */}
              {hasGlucoseData && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="glucose"
                  name="Glucose"
                  stroke="#FF6B35"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Totals bar on the right side */}
        <InsulinTotalsBar basalTotal={basalTotal} bolusTotal={bolusTotal} />
      </div>

      {/* Custom legend */}
      <div className={styles.legendContainer}>
        {hasGlucoseData && (
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#FF6B35' }} />
            <Text>Glucose (CGM data)</Text>
          </div>
        )}
        {hasBasalData && (
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#2E7D32' }} />
            <Text>Basal Rate (continuous delivery)</Text>
          </div>
        )}
        {hasBolusData && (
          <div className={styles.legendItem}>
            <div className={styles.legendBar} />
            <Text>Bolus (meal/correction doses)</Text>
          </div>
        )}
      </div>
    </div>
  );
}
