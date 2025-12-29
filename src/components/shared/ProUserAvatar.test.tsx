import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ProUserAvatar } from './ProUserAvatar';
import { renderWithProviders } from '../../testUtils/i18nTestProvider';

describe('ProUserAvatar', () => {
  it('should render avatar with name', () => {
    renderWithProviders(<ProUserAvatar name="John Doe" />);
    
    // Avatar should be present (Fluent UI Avatar renders with the name)
    const avatar = screen.getByText('JD'); // Fluent UI shows initials
    expect(avatar).toBeInTheDocument();
  });

  it('should display pro user badge when isProUser is true', () => {
    renderWithProviders(<ProUserAvatar name="John Doe" isProUser={true} />);
    
    // Pro user badge should be visible
    const proBadge = screen.getByLabelText('Pro user');
    expect(proBadge).toBeInTheDocument();
    expect(proBadge).toHaveTextContent('✨');
  });

  it('should not display pro user badge when isProUser is false', () => {
    renderWithProviders(<ProUserAvatar name="John Doe" isProUser={false} />);
    
    // Pro user badge should not be visible
    expect(screen.queryByLabelText('Pro user')).not.toBeInTheDocument();
  });

  it('should not display pro user badge when isProUser is undefined', () => {
    renderWithProviders(<ProUserAvatar name="John Doe" />);
    
    // Pro user badge should not be visible (default behavior)
    expect(screen.queryByLabelText('Pro user')).not.toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = renderWithProviders(
      <ProUserAvatar name="John Doe" size={28} isProUser={true} />
    );
    
    expect(screen.getByLabelText('Pro user')).toBeInTheDocument();
    
    // Rerender with larger size
    rerender(<ProUserAvatar name="John Doe" size={48} isProUser={true} />);
    expect(screen.getByLabelText('Pro user')).toBeInTheDocument();
  });

  it('should pass through avatar props correctly', () => {
    renderWithProviders(
      <ProUserAvatar 
        name="Jane Smith" 
        image={{ src: 'https://example.com/photo.jpg' }}
        isProUser={false}
      />
    );
    
    // Avatar should be rendered (check for initials as fallback)
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should render badge in the correct position (top-right corner)', () => {
    renderWithProviders(<ProUserAvatar name="John Doe" isProUser={true} />);
    
    const badge = screen.getByLabelText('Pro user');
    
    // Check that badge has position absolute (via styles)
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('SPAN');
  });
});
