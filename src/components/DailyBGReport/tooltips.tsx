/**
 * Custom tooltip components for DailyBGReport charts
 */

import { tokens } from '@fluentui/react-components';
import type { GlucoseUnit, RoCDataPoint, HourlyIOBData, GlucoseThresholds } from '../../types';
import { 
  formatGlucoseValue, 
  getUnitLabel, 
  formatRoCValue,
  ROC_COLORS,
} from '../../utils/data';
import { HYPO_CHART_COLORS } from './constants';
import { formatInsulinDose } from '../../utils/formatting/formatters';

interface GlucoseTooltipProps {
  active?: boolean;
  payload?: Array<{ 
    payload: { 
      time: string; 
      value: number; 
      originalValue: number; 
      color: string;
    }; 
  }>;
  glucoseUnit: GlucoseUnit;
  maxGlucose: number;
}

/**
 * Render a styled tooltip showing the data time and a formatted glucose value when the chart tooltip is active and contains data.
 *
 * @param active - Whether the chart tooltip is currently active
 * @param payload - Chart payload; the function reads the first element's `payload` which must include `time`, `value`, and `originalValue`
 * @param glucoseUnit - Unit used to format the glucose value (e.g., mg/dL or mmol/L)
 * @param maxGlucose - Maximum glucose threshold used to determine and label clamped values
 * @returns The tooltip JSX element when active and data is present, or `null` otherwise
 */
export function GlucoseTooltip({ active, payload, glucoseUnit, maxGlucose }: GlucoseTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const displayValue = data.originalValue > maxGlucose 
      ? `${formatGlucoseValue(data.originalValue, glucoseUnit)} (clamped to ${formatGlucoseValue(maxGlucose, glucoseUnit)})`
      : formatGlucoseValue(data.value, glucoseUnit);
    
    return (
      <div style={{
        backgroundColor: tokens.colorNeutralBackground1,
        padding: '12px',
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        fontSize: tokens.fontSizeBase300,
        fontFamily: tokens.fontFamilyBase,
        boxShadow: tokens.shadow8,
      }}>
        <div style={{ 
          fontWeight: tokens.fontWeightSemibold,
          marginBottom: '4px',
          color: tokens.colorNeutralForeground1,
        }}>
          {data.time}
        </div>
        <div style={{ color: tokens.colorNeutralForeground2 }}>
          Glucose: {displayValue} {getUnitLabel(glucoseUnit)}
        </div>
      </div>
    );
  }
  return null;
}

interface IOBTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
    payload: HourlyIOBData;
  }>;
}

/**
 * Render a tooltip showing IOB, basal, and bolus values for a hovered timepoint.
 *
 * Displays the time label, active IOB (two decimal places), basal in the previous hour
 * (one decimal place), and bolus in the previous hour (one decimal place).
 *
 * @param active - Tooltip active state; tooltip is rendered only when `true`.
 * @param payload - Chart payload array where the first item's `payload` object must include:
 *   `timeLabel` (string), `activeIOB` (number), `basalInPreviousHour` (number),
 *   and `bolusInPreviousHour` (number).
 * @returns The tooltip element when `active` is `true` and `payload` contains data, `null` otherwise.
 */
export function IOBTooltip({ active, payload }: IOBTooltipProps) {
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
        <div style={{ color: '#1976D2' }}>
          Active IOB: {formatInsulinDose(data.activeIOB, 2)} U
        </div>
        <div style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
          Basal in hour: {formatInsulinDose(data.basalInPreviousHour, 1)} U
        </div>
        <div style={{ color: tokens.colorNeutralForeground2 }}>
          Bolus in hour: {formatInsulinDose(data.bolusInPreviousHour, 1)} U
        </div>
      </div>
    );
  }
  return null;
}

interface RoCTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RoCDataPoint & { glucoseDisplay?: number };
  }>;
  glucoseUnit: GlucoseUnit;
}

/**
 * Render a tooltip showing rate-of-change, glucose value, time, and a categorical status for a RoC chart.
 *
 * @param glucoseUnit - Unit used to format glucose and RoC values (`'mg/dL'` or `'mmol/L'`)
 * @returns A tooltip element with time, formatted RoC (per 5 minutes), glucose value with unit, and a colored status label, or `null` when inactive or payload data is missing
 */
export function RoCTooltip({ active, payload, glucoseUnit }: RoCTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data || !data.timeLabel) return null;
  
  const glucoseValue = data.glucoseDisplay ?? data.glucoseValue;
  const glucoseDisplay = formatGlucoseValue(glucoseValue, glucoseUnit);
  
  return (
    <div style={{
      backgroundColor: tokens.colorNeutralBackground1,
      padding: '12px',
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      borderRadius: tokens.borderRadiusMedium,
      fontSize: tokens.fontSizeBase200,
      boxShadow: tokens.shadow8,
    }}>
      <div style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: '4px' }}>
        {data.timeLabel}
      </div>
      <div style={{ color: data.color, fontWeight: tokens.fontWeightSemibold }}>
        RoC: {formatRoCValue(data.roc, glucoseUnit)} {glucoseUnit === 'mg/dL' ? 'mg/dL' : 'mmol/L'}/5 min
      </div>
      <div style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
        Glucose: {glucoseDisplay} {getUnitLabel(glucoseUnit)}
      </div>
      <div style={{ 
        marginTop: '4px',
        color: data.category === 'good' ? ROC_COLORS.good : 
               data.category === 'medium' ? ROC_COLORS.medium : ROC_COLORS.bad,
        fontStyle: 'italic',
      }}>
        {data.category === 'good' ? 'Stable' : data.category === 'medium' ? 'Moderate' : 'Rapid'}
      </div>
    </div>
  );
}

interface HyposTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      time: string;
      value: number;
      originalValue: number;
      rawValue?: number;
      color: string;
    };
  }>;
  glucoseUnit: GlucoseUnit;
  maxGlucose: number;
  thresholds: GlucoseThresholds;
}

/**
 * Render a tooltip for the hypos chart showing time, formatted glucose with unit, and a hypo status.
 *
 * If the hovered point's `originalValue` exceeds `maxGlucose`, the original value is shown with a note that it is clamped to `maxGlucose`.
 *
 * @param maxGlucose - Maximum glucose used to detect and indicate clamped values in the displayed text
 * @param thresholds - Thresholds used to classify `rawValue` into "Severe Hypo" and "Hypoglycemia"; when `rawValue` is present the tooltip shows the matching status
 * @returns A React element containing the time, glucose value with unit, and an optional colored status line, or `null` when not active or lacking payload
 */
export function HyposTooltip({ active, payload, glucoseUnit, maxGlucose, thresholds }: HyposTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const displayValue = data.originalValue > maxGlucose 
      ? `${formatGlucoseValue(data.originalValue, glucoseUnit)} (clamped to ${formatGlucoseValue(maxGlucose, glucoseUnit)})`
      : formatGlucoseValue(data.value, glucoseUnit);
    
    let statusText = '';
    let statusColor: string = HYPO_CHART_COLORS.normal;
    if (data.rawValue !== undefined) {
      if (data.rawValue < thresholds.veryLow) {
        statusText = 'Severe Hypo';
        statusColor = HYPO_CHART_COLORS.veryLow;
      } else if (data.rawValue < thresholds.low) {
        statusText = 'Hypoglycemia';
        statusColor = HYPO_CHART_COLORS.low;
      } else {
        statusText = 'In Range';
      }
    }
    
    return (
      <div style={{
        backgroundColor: tokens.colorNeutralBackground1,
        padding: '12px',
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        fontSize: tokens.fontSizeBase300,
        fontFamily: tokens.fontFamilyBase,
        boxShadow: tokens.shadow8,
      }}>
        <div style={{ 
          fontWeight: tokens.fontWeightSemibold,
          marginBottom: '4px',
          color: tokens.colorNeutralForeground1,
        }}>
          {data.time}
        </div>
        <div style={{ color: tokens.colorNeutralForeground2 }}>
          Glucose: {displayValue} {getUnitLabel(glucoseUnit)}
        </div>
        {statusText && (
          <div style={{ 
            color: statusColor, 
            fontStyle: 'italic',
            marginTop: '4px',
          }}>
            {statusText}
          </div>
        )}
      </div>
    );
  }
  return null;
}