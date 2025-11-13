/**
 * Unit tests for InsulinTotalsBar component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsulinTotalsBar } from './InsulinTotalsBar';

describe('InsulinTotalsBar', () => {
  it('should render basal and bolus sections with correct values', () => {
    const { container } = render(<InsulinTotalsBar basalTotal={10.5} bolusTotal={8.3} />);
    
    // Check that both values are displayed (rounded to 1 decimal)
    expect(screen.getByText('10.5')).toBeInTheDocument();
    expect(screen.getByText('8.3')).toBeInTheDocument();
    
    // Check that container is rendered
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should render with only basal insulin', () => {
    render(<InsulinTotalsBar basalTotal={12.0} bolusTotal={0} />);
    
    expect(screen.getByText('12.0')).toBeInTheDocument();
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  it('should render with only bolus insulin', () => {
    render(<InsulinTotalsBar basalTotal={0} bolusTotal={15.5} />);
    
    expect(screen.getByText('15.5')).toBeInTheDocument();
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  it('should not render when both totals are zero', () => {
    const { container } = render(<InsulinTotalsBar basalTotal={0} bolusTotal={0} />);
    
    // Should return null, so no elements rendered
    expect(container.firstChild).toBeNull();
  });

  it('should round values to 1 decimal place', () => {
    render(<InsulinTotalsBar basalTotal={10.456} bolusTotal={8.999} />);
    
    expect(screen.getByText('10.5')).toBeInTheDocument();
    expect(screen.getByText('9.0')).toBeInTheDocument();
  });

  it('should calculate correct height percentages for sections', () => {
    const { container } = render(<InsulinTotalsBar basalTotal={10} bolusTotal={10} />);
    
    const sections = container.querySelectorAll('[style*="height"]');
    expect(sections.length).toBeGreaterThan(0);
    
    // With equal values, each should be 50%
    const bolusSection = sections[0] as HTMLElement;
    const basalSection = sections[1] as HTMLElement;
    
    expect(bolusSection.style.height).toContain('50%');
    expect(basalSection.style.height).toContain('50%');
  });

  it('should handle small values correctly', () => {
    render(<InsulinTotalsBar basalTotal={0.1} bolusTotal={0.2} />);
    
    expect(screen.getByText('0.1')).toBeInTheDocument();
    expect(screen.getByText('0.2')).toBeInTheDocument();
  });

  it('should handle large values correctly', () => {
    render(<InsulinTotalsBar basalTotal={50.5} bolusTotal={30.3} />);
    
    expect(screen.getByText('50.5')).toBeInTheDocument();
    expect(screen.getByText('30.3')).toBeInTheDocument();
  });

  it('should apply minHeight only when percentage is below threshold', () => {
    // Test with very small basal value (50 basal vs 1 bolus = ~2% bolus)
    const { container } = render(<InsulinTotalsBar basalTotal={50} bolusTotal={1} />);
    
    const sections = container.querySelectorAll('[style*="height"]');
    const bolusSection = sections[0] as HTMLElement;
    
    // Bolus is ~2%, which is below 10% threshold, so should have minHeight
    expect(bolusSection.style.minHeight).toBe('30px');
  });

  it('should not apply minHeight when percentage is above threshold', () => {
    // Test with balanced values (both above 10%)
    const { container } = render(<InsulinTotalsBar basalTotal={20} bolusTotal={30} />);
    
    const sections = container.querySelectorAll('[style*="height"]');
    const bolusSection = sections[0] as HTMLElement;
    const basalSection = sections[1] as HTMLElement;
    
    // Both sections are above 10%, so should not have minHeight set
    expect(bolusSection.style.minHeight).toBe('');
    expect(basalSection.style.minHeight).toBe('');
  });

  it('should have accessibility attributes', () => {
    const { container } = render(<InsulinTotalsBar basalTotal={10.5} bolusTotal={8.3} />);
    
    // Check for role and aria-label on container
    const mainContainer = container.querySelector('[role="complementary"]');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveAttribute('aria-label', 'Daily insulin totals visualization');
    
    // Check for aria-labels on sections
    const sections = container.querySelectorAll('[aria-label]');
    expect(sections.length).toBeGreaterThan(0);
  });
});
