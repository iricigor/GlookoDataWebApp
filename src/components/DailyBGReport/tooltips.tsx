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
 * Custom tooltip for glucose chart
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
 * Custom tooltip for IOB chart
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
          Active IOB: {data.activeIOB.toFixed(2)} U
        </div>
        <div style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
          Basal in hour: {data.basalInPreviousHour.toFixed(1)} U
        </div>
        <div style={{ color: tokens.colorNeutralForeground2 }}>
          Bolus in hour: {data.bolusInPreviousHour.toFixed(1)} U
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
 * Custom tooltip for RoC chart
 */
export function RoCTooltip({ active, payload, glucoseUnit }: RoCTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data || !data.timeLabel) return null;
  
  const glucoseValue = data.glucoseDisplay ?? data.glucoseValue;
  const glucoseDisplay = glucoseUnit === 'mg/dL' 
    ? Math.round(glucoseValue).toString()
    : glucoseValue.toFixed(1);
  
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
 * Custom tooltip for Hypos chart
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
