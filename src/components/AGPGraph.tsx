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
import type { AGPTimeSlotStats, GlucoseUnit } from '../types';
import { convertGlucoseValue, getUnitLabel } from '../utils/data';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
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
  glucoseUnit: GlucoseUnit;
}

export function AGPGraph({ data, glucoseUnit }: AGPGraphProps) {
  const styles = useStyles();

  // Filter data to only include slots with readings
  const filteredData = data.filter(slot => slot.count > 0);

  if (filteredData.length === 0) {
    return (
      <div className={styles.container}>
        <Text style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '24px' }}>
          No data available for visualization
        </Text>
      </div>
    );
  }

  // Prepare data for the chart - sample every hour for better performance
  // Convert all values to the display unit
  const chartData = filteredData.filter((_, index) => index % 12 === 0).map(slot => {
    const p10 = convertGlucoseValue(slot.p10, glucoseUnit);
    const p25 = convertGlucoseValue(slot.p25, glucoseUnit);
    const p75 = convertGlucoseValue(slot.p75, glucoseUnit);
    const p90 = convertGlucoseValue(slot.p90, glucoseUnit);
    
    return {
      time: slot.timeSlot,
      // Original values for reference
      p10_p90_min: p10,
      p10_p90_max: p90,
      p25_p75_min: p25,
      p25_p75_max: p75,
      // Stacked values for proper rendering
      p10_base: p10,  // Bottom of 10-90 band
      p10_to_p25: p25 - p10,  // Height from p10 to p25 (lower outer band)
      p25_to_p75: p75 - p25,  // Height from p25 to p75 (inner band)
      p75_to_p90: p90 - p75,  // Height from p75 to p90 (upper outer band)
      median: convertGlucoseValue(slot.p50, glucoseUnit),
      lowest: convertGlucoseValue(slot.lowest, glucoseUnit),
      highest: convertGlucoseValue(slot.highest, glucoseUnit),
    };
  });

  // Target range (stored internally in mmol/L, converted for display)
  const targetMin = convertGlucoseValue(3.9, glucoseUnit);
  const targetMax = convertGlucoseValue(10.0, glucoseUnit);
  
  // Y-axis domain - scale based on unit
  const yAxisMax = glucoseUnit === 'mg/dL' ? 360 : 20;
  const unitLabel = getUnitLabel(glucoseUnit);

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
          <div>Median: {data.median.toFixed(glucoseUnit === 'mg/dL' ? 0 : 1)} {unitLabel}</div>
          <div>25-75%: {data.p25_p75_min.toFixed(glucoseUnit === 'mg/dL' ? 0 : 1)} - {data.p25_p75_max.toFixed(glucoseUnit === 'mg/dL' ? 0 : 1)} {unitLabel}</div>
          <div>10-90%: {data.p10_p90_min.toFixed(glucoseUnit === 'mg/dL' ? 0 : 1)} - {data.p10_p90_max.toFixed(glucoseUnit === 'mg/dL' ? 0 : 1)} {unitLabel}</div>
        </div>
      );
    }
    return null;
  };

  // Format X-axis labels (show only key times)
  const formatXAxis = (value: string) => {
    const hour = parseInt(value.split(':')[0]);
    if (hour === 0) return '12AM';
    if (hour === 6) return '6AM';
    if (hour === 12) return '12PM';
    if (hour === 18) return '6PM';
    return '';
  };

  return (
    <div className={styles.container}>
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
              domain={[0, yAxisMax]}
              label={{ value: `Glucose (${unitLabel})`, angle: -90, position: 'insideLeft', dx: 10, style: { fontSize: tokens.fontSizeBase200 } }}
              stroke={tokens.colorNeutralForeground2}
              style={{ fontSize: tokens.fontSizeBase200 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Stack the bands from bottom to top to show all layers */}
            {/* Using stackId to properly layer the areas */}
            
            {/* Invisible base to start stacking from p10 */}
            <Area
              type="monotone"
              dataKey="p10_base"
              stackId="bands"
              stroke="none"
              fill="transparent"
              fillOpacity={0}
            />
            
            {/* Bottom of 10-90 band (p10 to p25) - light blue */}
            <Area
              type="monotone"
              dataKey="p10_to_p25"
              stackId="bands"
              stroke="none"
              fill="url(#color10_90)"
              fillOpacity={1}
            />
            
            {/* Middle 25-75 band (p25 to p75) - darker blue */}
            <Area
              type="monotone"
              dataKey="p25_to_p75"
              stackId="bands"
              stroke="none"
              fill="url(#color25_75)"
              fillOpacity={1}
            />
            
            {/* Top of 10-90 band (p75 to p90) - light blue */}
            <Area
              type="monotone"
              dataKey="p75_to_p90"
              stackId="bands"
              stroke="none"
              fill="url(#color10_90)"
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
          <Text>After Meal Target Range ({targetMin}-{targetMax} mmol/L)</Text>
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
