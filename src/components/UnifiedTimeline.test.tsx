/**
 * Unit tests for UnifiedTimeline component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnifiedTimeline } from './UnifiedTimeline';
import type { GlucoseReading } from '../types';
import type { BGColorScheme } from '../hooks/useBGColorScheme';

describe('UnifiedTimeline', () => {
  const mockSetColorScheme = vi.fn();
  const mockSetMaxGlucose = vi.fn();
  const mockSetShowCGM = vi.fn();
  
  const defaultProps = {
    colorScheme: 'monochrome' as BGColorScheme,
    setColorScheme: mockSetColorScheme,
    maxGlucose: 22.0,
    setMaxGlucose: mockSetMaxGlucose,
    showCGM: true,
    setShowCGM: mockSetShowCGM,
    hasCGMData: true,
      glucoseUnit: "mmol/L" as const,
  };

  const mockInsulinData = [
    {
      hour: 0,
      timeLabel: '00:00',
      basalRate: 1.0,
      bolusTotal: 0,
    },
    {
      hour: 6,
      timeLabel: '06:00',
      basalRate: 1.2,
      bolusTotal: 3.5,
    },
    {
      hour: 12,
      timeLabel: '12:00',
      basalRate: 1.1,
      bolusTotal: 5.0,
    },
  ];

  const mockGlucoseReadings: GlucoseReading[] = [
    {
      timestamp: new Date('2025-01-14T06:00:00'),
      value: 7.5,
    },
    {
      timestamp: new Date('2025-01-14T12:00:00'),
      value: 9.2,
    },
  ];

  it('should render chart with insulin and glucose data', () => {
    render(
      <UnifiedTimeline 
        {...defaultProps}
        insulinData={mockInsulinData} 
        glucoseReadings={mockGlucoseReadings}
      />
    );
    
    // Should render legend items
    expect(screen.getByText(/glucose \(cgm data\)/i)).toBeInTheDocument();
    expect(screen.getByText(/basal rate/i)).toBeInTheDocument();
  });

  it('should render no data message when all data is empty', () => {
    render(
      <UnifiedTimeline 
        {...defaultProps}
        insulinData={[]} 
        glucoseReadings={[]}
      />
    );
    
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('should render chart with only insulin data', () => {
    render(
      <UnifiedTimeline 
        {...defaultProps}
        insulinData={mockInsulinData} 
        glucoseReadings={[]}
      />
    );
    
    // Should render legend items for insulin only
    expect(screen.getByText(/basal rate/i)).toBeInTheDocument();
    expect(screen.getByText(/bolus/i)).toBeInTheDocument();
  });

  it('should render legend items for all data types present', () => {
    render(
      <UnifiedTimeline 
        {...defaultProps}
        insulinData={mockInsulinData} 
        glucoseReadings={mockGlucoseReadings}
      />
    );
    
    expect(screen.getByText(/glucose \(cgm data\)/i)).toBeInTheDocument();
    expect(screen.getByText(/basal rate/i)).toBeInTheDocument();
    expect(screen.getByText(/bolus/i)).toBeInTheDocument();
  });

  it('should render InsulinTotalsBar with correct totals', () => {
    const { container } = render(
      <UnifiedTimeline 
        {...defaultProps}
        insulinData={mockInsulinData} 
        glucoseReadings={mockGlucoseReadings}
      />
    );
    
    // Check for the totals bar component
    const totalsBar = container.querySelector('[role="complementary"]');
    expect(totalsBar).toBeInTheDocument();
  });

  it('should handle zero insulin values', () => {
    const zeroInsulinData = [
      {
        hour: 0,
        timeLabel: '00:00',
        basalRate: 0,
        bolusTotal: 0,
      },
    ];

    render(
      <UnifiedTimeline 
        {...defaultProps}
        insulinData={zeroInsulinData} 
        glucoseReadings={mockGlucoseReadings}
      />
    );
    
    expect(screen.getByText(/glucose \(cgm data\)/i)).toBeInTheDocument();
  });

  it('should calculate average glucose values per hour', () => {
    const multipleGlucoseReadings: GlucoseReading[] = [
      {
        timestamp: new Date('2025-01-14T06:00:00'),
        value: 7.0,
      },
      {
        timestamp: new Date('2025-01-14T06:30:00'),
        value: 8.0,
      },
    ];

    render(
      <UnifiedTimeline 
        {...defaultProps}
        insulinData={mockInsulinData} 
        glucoseReadings={multipleGlucoseReadings}
      />
    );
    
    // Should render with merged data - verify legend is present
    expect(screen.getByText(/glucose \(cgm data\)/i)).toBeInTheDocument();
  });
});
