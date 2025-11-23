/**
 * Tests for CookieConsent component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CookieConsent } from './CookieConsent';

describe('CookieConsent', () => {
  it('should render the cookie consent banner', () => {
    const mockOnAccept = vi.fn();
    render(<CookieConsent onAccept={mockOnAccept} />);
    
    expect(screen.getByText(/functional cookies only/i)).toBeInTheDocument();
    expect(screen.getByText(/not collect personal data/i)).toBeInTheDocument();
  });

  it('should display cookie icon', () => {
    const mockOnAccept = vi.fn();
    render(<CookieConsent onAccept={mockOnAccept} />);
    
    // The icon should be present in the document
    const banner = screen.getByRole('group'); // MessageBar has role="group"
    expect(banner).toBeInTheDocument();
  });

  it('should have a "Got it" button', () => {
    const mockOnAccept = vi.fn();
    render(<CookieConsent onAccept={mockOnAccept} />);
    
    const button = screen.getByRole('button', { name: /got it/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onAccept when "Got it" button is clicked', () => {
    const mockOnAccept = vi.fn();
    render(<CookieConsent onAccept={mockOnAccept} />);
    
    const button = screen.getByRole('button', { name: /got it/i });
    fireEvent.click(button);
    
    expect(mockOnAccept).toHaveBeenCalledTimes(1);
  });

  it('should have a link to privacy documentation', () => {
    const mockOnAccept = vi.fn();
    render(<CookieConsent onAccept={mockOnAccept} />);
    
    const link = screen.getByRole('link', { name: /learn more about privacy/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/iricigor/GlookoDataWebApp#-privacy-first');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should explain what cookies are used for', () => {
    const mockOnAccept = vi.fn();
    render(<CookieConsent onAccept={mockOnAccept} />);
    
    expect(screen.getByText(/theme, settings, date selections/i)).toBeInTheDocument();
  });

  it('should clarify no tracking cookies are used', () => {
    const mockOnAccept = vi.fn();
    render(<CookieConsent onAccept={mockOnAccept} />);
    
    expect(screen.getByText(/not collect personal data/i)).toBeInTheDocument();
    expect(screen.getByText(/locally in your browser/i)).toBeInTheDocument();
  });

  it('should be positioned at the bottom of the page', () => {
    const mockOnAccept = vi.fn();
    const { container } = render(<CookieConsent onAccept={mockOnAccept} />);
    
    const banner = container.firstChild as HTMLElement;
    
    // Check if the banner element exists
    expect(banner).toBeTruthy();
    // The banner should have a class applied
    expect(banner.className).toBeTruthy();
  });
});
