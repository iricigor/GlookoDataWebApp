/**
 * Tests for LanguageSwitcher component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

// Mock the useUILanguage hook
vi.mock('../../hooks/useUILanguage', () => ({
  useUILanguage: () => ({
    uiLanguage: 'en',
    setUILanguage: vi.fn(),
  }),
}));

// Wrapper component to provide FluentProvider context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );
    
    // Check if the dropdown is rendered (by looking for the button with the language value)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should display current language in dropdown', () => {
    render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );
    
    // Check that "English" is displayed as the current selection
    expect(screen.getByRole('combobox')).toHaveAttribute('value', 'English');
  });

  it('should have accessible label', () => {
    render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );
    
    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toHaveAttribute('aria-label', 'Select UI language');
  });

  it('should accept custom className', () => {
    const customClass = 'custom-language-switcher';
    const { container } = render(
      <TestWrapper>
        <LanguageSwitcher className={customClass} />
      </TestWrapper>
    );
    
    const dropdown = container.querySelector(`.${customClass}`);
    expect(dropdown).toBeInTheDocument();
  });
});
