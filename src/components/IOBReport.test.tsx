import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IOBReport } from './IOBReport';

describe('IOBReport', () => {
  it('should render no data message when no file is selected', () => {
    render(<IOBReport />);
    expect(screen.getByText('Please upload and select a file to view IOB reports')).toBeInTheDocument();
  });

  it('should render component without errors', () => {
    const { container } = render(<IOBReport />);
    expect(container).toBeInTheDocument();
  });
});
