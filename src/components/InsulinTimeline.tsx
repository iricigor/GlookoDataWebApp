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
} from 'recharts';

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
}

export function InsulinTimeline({ data }: InsulinTimelineProps) {
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

  return (
    <div className={styles.container}>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
            
            <XAxis
              dataKey="timeLabel"
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
