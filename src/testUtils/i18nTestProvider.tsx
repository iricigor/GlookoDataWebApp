/**
 * I18n Test Provider Wrapper
 * Provides i18next context for component testing
 */

import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import i18n from '../i18n';

/**
 * Wraps components with necessary providers for testing
 * @param component - The component to wrap
 * @returns The wrapped component
 */
export function renderWithProviders(component: ReactNode) {
  return (
    <I18nextProvider i18n={i18n}>
      <FluentProvider theme={webLightTheme}>
        {component}
      </FluentProvider>
    </I18nextProvider>
  );
}
