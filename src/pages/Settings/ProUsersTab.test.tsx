/**
 * Unit tests for ProUsersTab component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProUsersTab } from './ProUsersTab';

describe('ProUsersTab', () => {
  // We need to create a test wrapper that provides the styles
  const renderProUsersTab = () => {
    // Create a simple mock styles object with the required properties
    const mockStyles = {
      settingSection: 'mockSettingSection',
      sectionTitle: 'mockSectionTitle',
      divider: 'mockDivider',
      settingDescription: 'mockSettingDescription',
      benefitsList: 'mockBenefitsList',
      expressInterestButton: 'mockExpressInterestButton',
    } as ReturnType<typeof import('./styles').useStyles>;

    return render(
      <ProUsersTab
        styles={mockStyles}
      />
    );
  };

  it('should render Pro Users title', () => {
    renderProUsersTab();
    expect(screen.getByText('Pro Users')).toBeInTheDocument();
  });

  it('should show not enabled message', () => {
    renderProUsersTab();
    expect(screen.getByText(/Pro Users features are not yet enabled/)).toBeInTheDocument();
  });

  it('should show benefits section', () => {
    renderProUsersTab();
    expect(screen.getByText('What Pro Users Get')).toBeInTheDocument();
  });

  it('should show express interest section', () => {
    renderProUsersTab();
    expect(screen.getByText(/express your interest/i)).toBeInTheDocument();
  });

  it('should have express interest button', () => {
    renderProUsersTab();
    const button = screen.getByRole('link');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', expect.stringContaining('github.com'));
  });
});
