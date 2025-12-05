/**
 * Custom tooltip component for the RoC chart
 */

import { tokens } from '@fluentui/react-components';
import type { RoCDataPoint, GlucoseUnit } from '../../types';
import {
  ROC_COLORS,
  formatRoCValue,
  getUnitLabel,
} from '../../utils/data';

interface RoCChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: RoCDataPoint & { glucoseDisplay?: number };
  }>;
  glucoseUnit: GlucoseUnit;
}

export function RoCChartTooltip({ 
  active, 
  payload,
  glucoseUnit,
}: RoCChartTooltipProps) {
  // Guard against undefined payload or empty array
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  
  // Guard against undefined data within payload
  const data = payload[0]?.payload;
  if (!data || !data.timeLabel) {
    return null;
  }
  
  // Format glucose value based on unit
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
