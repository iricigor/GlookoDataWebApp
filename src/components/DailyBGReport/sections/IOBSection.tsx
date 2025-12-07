/**
 * IOB Section component for DailyBGReport
 * Displays Insulin on Board (IOB) chart
 */

import {
  Text,
  tokens,
} from '@fluentui/react-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { HourlyIOBData } from '../../../types';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { IOBTooltip } from '../tooltips';
import { formatXAxisIOB } from '../constants';
import type { useStyles } from '../styles';

interface IOBSectionProps {
  styles: ReturnType<typeof useStyles>;
  hourlyIOBData: HourlyIOBData[];
  showDayNightShading: boolean;
}

/**
 * Render an Insulin on Board (IOB) line chart section for a DailyBGReport.
 *
 * @param hourlyIOBData - Array of hourly data points used to plot `activeIOB` by hour.
 * @param showDayNightShading - When true, add shaded regions for midnight–8:00 AM and 8:00 PM–midnight.
 * @returns A React element containing the section title and a responsive IOB line chart.
 */
export function IOBSection({
  styles,
  hourlyIOBData,
  showDayNightShading,
}: IOBSectionProps) {
  const isMobile = useIsMobile();
  
  // Adjust chart margins for mobile - minimal margins
  const chartMargin = isMobile 
    ? { top: 10, right: 1, left: 0, bottom: 0 }
    : { top: 10, right: 30, left: 0, bottom: 0 };
  
  return (
    <div className={styles.sectionCard}>
      <Text className={styles.sectionTitle}>Insulin on Board (IOB)</Text>
      
      <div className={styles.chartCardInnerContent}>
        <div className={styles.iobChartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyIOBData} margin={chartMargin}>
              {/* Day/night shading gradients */}
              {showDayNightShading && (
                <defs>
                  <linearGradient id="iobNightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1a237e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="iobNightGradientRight" x1="0" y1="0" x2="1" y2="0">
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
                  fill="url(#iobNightGradientLeft)"
                />
              )}
              {/* Day/night shading - 8PM to midnight */}
              {showDayNightShading && (
                <ReferenceArea
                  x1={20}
                  x2={24}
                  fill="url(#iobNightGradientRight)"
                />
              )}
              
              {/* Vertical time reference lines (6AM, noon, 6PM, midnight) */}
              <ReferenceLine 
                x={0} 
                stroke={tokens.colorNeutralStroke2}
                strokeDasharray="3 3" 
                strokeWidth={1}
                strokeOpacity={0.5}
              />
              <ReferenceLine 
                x={6} 
                stroke={tokens.colorNeutralStroke2}
                strokeDasharray="3 3" 
                strokeWidth={1}
                strokeOpacity={0.5}
              />
              <ReferenceLine 
                x={12} 
                stroke={tokens.colorNeutralStroke2}
                strokeDasharray="3 3" 
                strokeWidth={1}
                strokeOpacity={0.5}
              />
              <ReferenceLine 
                x={18} 
                stroke={tokens.colorNeutralStroke2}
                strokeDasharray="3 3" 
                strokeWidth={1}
                strokeOpacity={0.5}
              />
              
              <XAxis
                type="number"
                dataKey="hour"
                domain={[0, 24]}
                ticks={[0, 6, 12, 18, 24]}
                tickFormatter={formatXAxisIOB}
                stroke={tokens.colorNeutralStroke1}
                tick={{ 
                  fill: tokens.colorNeutralForeground2,
                  fontSize: tokens.fontSizeBase200,
                  fontFamily: tokens.fontFamilyBase,
                }}
                axisLine={{ strokeWidth: 1 }}
                tickLine={false}
              />
              
              <YAxis
                label={{ 
                  value: 'Active IOB (U)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { 
                    fontSize: tokens.fontSizeBase200,
                    fontFamily: tokens.fontFamilyBase,
                    fill: tokens.colorNeutralForeground2,
                  } 
                }}
                stroke={tokens.colorNeutralStroke1}
                tick={{ 
                  fill: tokens.colorNeutralForeground2,
                  fontSize: tokens.fontSizeBase200,
                  fontFamily: tokens.fontFamilyBase,
                }}
                axisLine={{ strokeWidth: 1 }}
                tickLine={false}
              />
              
              <RechartsTooltip content={<IOBTooltip />} />
              
              <Line
                type="monotone"
                dataKey="activeIOB"
                stroke="#1976D2"
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  strokeWidth: 2,
                  stroke: tokens.colorNeutralBackground1,
                  fill: '#1976D2',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}