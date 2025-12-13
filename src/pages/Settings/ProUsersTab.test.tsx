/**
 * Unit tests for ProUsersTab component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProUsersTab } from './ProUsersTab';

describe('ProUsersTab', () => {
  const mockOnUseProKeysChange = vi.fn();

  // We need to create a test wrapper that provides the styles
  const renderProUsersTab = (props: { useProKeys: boolean; isProUser: boolean }) => {
    // Create a simple mock styles object with the required properties
    const mockStyles = {
      settingSection: 'mockSettingSection',
      sectionTitle: 'mockSectionTitle',
      divider: 'mockDivider',
      settingDescription: 'mockSettingDescription',
      switchContainer: 'mockSwitchContainer',
      benefitsList: 'mockBenefitsList',
      expressInterestButton: 'mockExpressInterestButton',
    } as ReturnType<typeof import('./styles').useStyles>;

    return render(
      <ProUsersTab
        styles={mockStyles}
        useProKeys={props.useProKeys}
        onUseProKeysChange={mockOnUseProKeysChange}
        isProUser={props.isProUser}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Pro Users title', () => {
    renderProUsersTab({ useProKeys: true, isProUser: false });
    expect(screen.getByText('Pro Users')).toBeInTheDocument();
  });

  it('should NOT show Pro AI Keys section for non-Pro users', () => {
    renderProUsersTab({ useProKeys: true, isProUser: false });
    expect(screen.queryByText('Pro AI Keys')).not.toBeInTheDocument();
  });

  it('should show Pro AI Keys section for Pro users', () => {
    renderProUsersTab({ useProKeys: true, isProUser: true });
    expect(screen.getByText('Pro AI Keys')).toBeInTheDocument();
  });

  it('should show switch control for Pro users', () => {
    renderProUsersTab({ useProKeys: true, isProUser: true });
    const switchControl = screen.getByRole('switch');
    expect(switchControl).toBeInTheDocument();
  });

  it('should show correct state when using Pro keys', () => {
    renderProUsersTab({ useProKeys: true, isProUser: true });
    expect(screen.getByText(/Currently using Pro managed AI keys/)).toBeInTheDocument();
  });

  it('should show correct state when using own keys', () => {
    renderProUsersTab({ useProKeys: false, isProUser: true });
    expect(screen.getByText(/Currently using your own API keys/)).toBeInTheDocument();
  });

  it('should call onUseProKeysChange when switch is toggled', () => {
    renderProUsersTab({ useProKeys: true, isProUser: true });
    const switchControl = screen.getByRole('switch');
    
    fireEvent.click(switchControl);
    
    expect(mockOnUseProKeysChange).toHaveBeenCalledWith(false);
  });

  it('should have switch checked when useProKeys is true', () => {
    renderProUsersTab({ useProKeys: true, isProUser: true });
    const switchControl = screen.getByRole('switch') as HTMLInputElement;
    expect(switchControl.checked).toBe(true);
  });

  it('should have switch unchecked when useProKeys is false', () => {
    renderProUsersTab({ useProKeys: false, isProUser: true });
    const switchControl = screen.getByRole('switch') as HTMLInputElement;
    expect(switchControl.checked).toBe(false);
  });
});
