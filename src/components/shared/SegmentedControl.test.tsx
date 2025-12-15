/**
 * Tests for SegmentedControl Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('renders all options', () => {
    const options = ['100%', '24h'];
    const onChange = vi.fn();
    
    render(
      <SegmentedControl
        options={options}
        value="100%"
        onChange={onChange}
      />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
  });

  it('calls onChange when an option is clicked', async () => {
    const options = ['100%', '24h'];
    const onChange = vi.fn();
    
    render(
      <SegmentedControl
        options={options}
        value="100%"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('24h'));
    expect(onChange).toHaveBeenCalledWith('24h');
  });

  it('marks the selected option as pressed', () => {
    const options = ['100%', '24h'];
    const onChange = vi.fn();
    
    render(
      <SegmentedControl
        options={options}
        value="24h"
        onChange={onChange}
      />
    );

    const button24h = screen.getByText('24h');
    expect(button24h).toHaveAttribute('aria-pressed', 'true');
    expect(button24h).toHaveAttribute('data-selected', 'true');
  });

  it('works with numeric options', () => {
    const options = [3, 5];
    const onChange = vi.fn();
    
    render(
      <SegmentedControl
        options={options}
        value={3}
        onChange={onChange}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const options = ['100%', '24h'];
    const onChange = vi.fn();
    
    const { container } = render(
      <SegmentedControl
        options={options}
        value="100%"
        onChange={onChange}
        className="custom-class"
      />
    );

    const controlContainer = container.querySelector('.custom-class');
    expect(controlContainer).toBeInTheDocument();
  });

  it('sets aria-label when provided', () => {
    const options = ['100%', '24h'];
    const onChange = vi.fn();
    
    const { container } = render(
      <SegmentedControl
        options={options}
        value="100%"
        onChange={onChange}
        ariaLabel="Time unit selector"
      />
    );

    const group = container.querySelector('[role="group"]');
    expect(group).toHaveAttribute('aria-label', 'Time unit selector');
  });
});
