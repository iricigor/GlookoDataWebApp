/**
 * InsulinTimeline component
 * Displays 24-hour timeline of insulin delivery with basal (line) and bolus (bars)
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
  ReferenceArea,
} from 'recharts';
import { InsulinTotalsBar } from './InsulinTotalsBar';

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
    ...shorthands.padding('8px'),
    backgroundColor: 'transparent',
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
    backgroundColor: '#2E7D32',
  },
  legendBar: {
    width: '12px',
    height: '20px',
    backgroundColor: '#1976D2',
  },
});

interface InsulinTimelineProps {
  data: Array<{
    hour: number;
    timeLabel: string;
    basalRate: number;
    bolusTotal: number;
  }>;
  showDayNightShading?: boolean;
}

export function InsulinTimeline({ data, showDayNightShading = true }: InsulinTimelineProps) {
  const styles = useStyles();

  // Check if there's any data to display
  const hasBasalData = data.some(d => d.basalRate > 0);
  const hasBolusData = data.some(d => d.bolusTotal > 0);

  if (!hasBasalData && !hasBolusData) {
    return (
      <div className={styles.container}>
        <Text style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '24px' }}>
          No insulin data available for this day
        </Text>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      dataKey: string;
      color: string;
      payload: { timeLabel: string; basalRate: number; bolusTotal: number };
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

  // Format X-axis labels - unified format: 12AM, 6AM, noon, 6PM, 12AM
  // Now receives numeric hour value (not string) since we use dataKey="hour"
  const formatXAxis = (value: number) => {
    const hour = Math.floor(value);
    const unifiedLabels: Record<number, string> = {
      0: '12AM', 6: '6AM', 12: 'noon', 18: '6PM', 24: '12AM'
    };
    return unifiedLabels[hour] || '';
  };

  // Calculate daily totals
  const basalTotal = data.reduce((sum, d) => sum + d.basalRate, 0);
  const bolusTotal = data.reduce((sum, d) => sum + d.bolusTotal, 0);

  return (
    <div className={styles.container}>
      <div className={styles.chartWithBarWrapper}>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {/* Day/night shading gradients */}
              {showDayNightShading && (
                <defs>
                  <linearGradient id="insulinNightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1a237e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="insulinNightGradientRight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1a237e" stopOpacity="0" />
                    <stop offset="100%" stopColor="#1a237e" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
              )}
              
              {/* Day/night shading - midnight to 8AM */}
              {showDayNightShading && (
                <ReferenceArea
                  x1={0}
                  x2={8}
                  fill="url(#insulinNightGradientLeft)"
                />
              )}
              {/* Day/night shading - 8PM to midnight */}
              {showDayNightShading && (
                <ReferenceArea
                  x1={20}
                  x2={24}
                  fill="url(#insulinNightGradientRight)"
                />
              )}
              
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
              
              <XAxis
                type="number"
                dataKey="hour"
                domain={[0, 24]}
                ticks={[0, 6, 12, 18, 24]}
                tickFormatter={formatXAxis}
                stroke={tokens.colorNeutralForeground2}
                style={{ fontSize: tokens.fontSizeBase200 }}
              />
              
              <YAxis
                label={{ 
                  value: 'Insulin (Units)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fontSize: tokens.fontSizeBase200 } 
                }}
                stroke={tokens.colorNeutralForeground2}
                style={{ fontSize: tokens.fontSizeBase200 }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend
                verticalAlign="top"
                height={36}
                iconType="line"
                wrapperStyle={{ fontSize: tokens.fontSizeBase200 }}
              />
              
              {/* Bolus bars */}
              {hasBolusData && (
                <Bar
                  dataKey="bolusTotal"
                  name="Bolus"
                  fill="#1976D2"
                  barSize={20}
                />
              )}
              
              {/* Basal line */}
              {hasBasalData && (
                <Line
                  type="monotone"
                  dataKey="basalRate"
                  name="Basal Rate"
                  stroke="#2E7D32"
                  strokeWidth={2}
                  dot={false}
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
        {hasBasalData && (
          <div className={styles.legendItem}>
            <div className={styles.legendLine} />
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
