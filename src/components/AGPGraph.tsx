/**
 * AGP Graph component
 * Displays Ambulatory Glucose Profile visualization with percentile bands
 */

import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { AGPTimeSlotStats } from '../types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  graphTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  chartContainer: {
    width: '100%',
    height: '400px',
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
  legendColor: {
    width: '20px',
    height: '12px',
    ...shorthands.borderRadius('2px'),
  },
  targetRangeColor: {
    width: '20px',
    height: '3px',
    backgroundColor: '#4CAF50',
  },
  medianColor: {
    width: '20px',
    height: '2px',
    backgroundColor: '#1976D2',
  },
});

interface AGPGraphProps {
  data: AGPTimeSlotStats[];
  unit?: 'mmol/L' | 'mg/dL';
}

export function AGPGraph({ data, unit = 'mmol/L' }: AGPGraphProps) {
  const styles = useStyles();

  // Filter data to only include slots with readings
  const filteredData = data.filter(slot => slot.count > 0);

  if (filteredData.length === 0) {
    return (
      <div className={styles.container}>
        <Text className={styles.graphTitle}>Ambulatory Glucose Profile (AGP)</Text>
        <Text style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '24px' }}>
          No data available for visualization
        </Text>
      </div>
    );
  }

  // Prepare data for the chart - sample every hour for better performance
  const chartData = filteredData.filter((_, index) => index % 12 === 0).map(slot => ({
    time: slot.timeSlot,
    p10_p90_min: slot.p10,
    p10_p90_max: slot.p90,
    p25_p75_min: slot.p25,
    p25_p75_max: slot.p75,
    median: slot.p50,
    lowest: slot.lowest,
    highest: slot.highest,
  }));

  // Target range in mmol/L (70-180 mg/dL = 3.9-10.0 mmol/L)
  const targetMin = unit === 'mmol/L' ? 3.9 : 70;
  const targetMax = unit === 'mmol/L' ? 10.0 : 180;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { time: string; median: number; p25_p75_min: number; p25_p75_max: number; p10_p90_min: number; p10_p90_max: number } }> }) => {
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
            {data.time}
          </div>
          <div>Median: {data.median.toFixed(1)} {unit}</div>
          <div>25-75%: {data.p25_p75_min.toFixed(1)} - {data.p25_p75_max.toFixed(1)} {unit}</div>
          <div>10-90%: {data.p10_p90_min.toFixed(1)} - {data.p10_p90_max.toFixed(1)} {unit}</div>
        </div>
      );
    }
    return null;
  };

  // Format X-axis labels (show only key times)
  const formatXAxis = (value: string) => {
    const hour = parseInt(value.split(':')[0]);
    if (hour === 0) return '12A';
    if (hour === 6) return '6A';
    if (hour === 12) return '12P';
    if (hour === 18) return '6P';
    return '';
  };

  return (
    <div className={styles.container}>
      <Text className={styles.graphTitle}>Ambulatory Glucose Profile (AGP)</Text>
      
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="color10_90" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#90CAF9" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#90CAF9" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="color25_75" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64B5F6" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#64B5F6" stopOpacity={0.5}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
            
            <XAxis 
              dataKey="time" 
              tickFormatter={formatXAxis}
              stroke={tokens.colorNeutralForeground2}
              style={{ fontSize: tokens.fontSizeBase200 }}
            />
            
            <YAxis 
              domain={[0, unit === 'mmol/L' ? 20 : 400]}
              label={{ value: `Glucose (${unit})`, angle: -90, position: 'insideLeft', style: { fontSize: tokens.fontSizeBase200 } }}
              stroke={tokens.colorNeutralForeground2}
              style={{ fontSize: tokens.fontSizeBase200 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* 10-90 percentile range */}
            <Area
              type="monotone"
              dataKey="p10_p90_max"
              stroke="none"
              fill="url(#color10_90)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="p10_p90_min"
              stroke="none"
              fill={tokens.colorNeutralBackground1}
              fillOpacity={1}
            />
            
            {/* 25-75 percentile range */}
            <Area
              type="monotone"
              dataKey="p25_p75_max"
              stroke="none"
              fill="url(#color25_75)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="p25_p75_min"
              stroke="none"
              fill={tokens.colorNeutralBackground1}
              fillOpacity={1}
            />
            
            {/* Median line */}
            <Area
              type="monotone"
              dataKey="median"
              stroke="#1976D2"
              strokeWidth={2}
              fill="none"
              dot={false}
            />
            
            {/* Target range reference lines - both upper and lower target */}
            <ReferenceLine 
              y={targetMin} 
              stroke="#4CAF50" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              ifOverflow="extendDomain"
            />
            <ReferenceLine 
              y={targetMax} 
              stroke="#4CAF50" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              ifOverflow="extendDomain"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className={styles.legendContainer}>
        <div className={styles.legendItem}>
          <div className={styles.targetRangeColor} />
          <Text>After Meal Target Range ({targetMin}-{targetMax} {unit})</Text>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#64B5F6', opacity: 0.5 }} />
          <Text>25 - 75%</Text>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#90CAF9', opacity: 0.3 }} />
          <Text>10 - 90%</Text>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.medianColor} />
          <Text>Median</Text>
        </div>
      </div>
    </div>
  );
}
